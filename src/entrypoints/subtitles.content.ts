import { createVideoSubTranslator, type VideoSubTranslator } from './content/videoSubs';
import { subtitleSiteFor } from './content/videoSubs/sites';
import type { SubtitleSite } from './content/videoSubs/site';
import { StorageClient } from '~/storage/client';
import {
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_SUBTITLE_STYLE,
  type SubtitlePosition,
  type SubtitleStyle,
} from '~/core/subtitles/style';
import { resolveLocale, t } from '~/i18n';
import type { Locale } from '~/i18n/strings';
import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import type { AppData } from '~/storage/schema';
import { DEFAULT_DUB_SETTINGS, type DubSettings } from '~/core/dub/settings';
import { routeProblem } from '~/core/engines/routing';
import type { ChannelVoiceRequest, CloudTtsRequest, CloudTtsResponse, OpenOptionsRequest, RememberVoiceRequest } from '~/messaging/types';
import { CLOUD_TTS } from '~/core/dub/cloudVoice';
import { startWatchTracker } from './content/watchTracker';
import { requestCaptionTracks } from './content/videoSubs/requestCaptionTracks';
import type { WatchLogRequest } from '~/messaging/types';

/**
 * Subtitle translation, in every frame.
 *
 * Its own entrypoint because it is the one feature that has to run inside
 * subframes: a learning platform serves its player from an iframe (Canvas does,
 * as do most embeds), and a content script confined to the top frame never sees
 * the video at all. The selection card and full-page translation stay where
 * they were — a card in every ad slot on a page is not a feature — so this file
 * carries the part that travels and `content.ts` keeps the part that does not.
 */

/**
 * How many subtitle batches to keep in flight, by who is answering them.
 *
 * A free service answers in well under a second and costs nothing per call, so
 * it takes the widest fan-out. A cloud model fans out across its fleet. A
 * self-hosted one uses 2 as a one-deep pipeline: a batch processing while the
 * next is queued, so the model never idles between batches — a local MLX server
 * queues rather than splitting, so this does not slow individual batches.
 */
function subtitleConcurrency(provider: ProviderId | undefined): number {
  // Not configured: nothing will be sent, so the figure is never used.
  if (!provider) return 1;
  if (PROVIDERS[provider].kind === 'service') return 6;
  return provider === 'local' ? 2 : 4;
}

/**
 * Frames too small to be showing a video to anybody. Running in every frame
 * means running in tracking pixels, consent shims and ad slots, and none of
 * them are worth waiting twenty seconds for a player in.
 */
const MIN_FRAME_WIDTH = 200;
const MIN_FRAME_HEIGHT = 140;

function frameCouldHoldAPlayer(): boolean {
  if (window.top === window) return true;
  if (location.href === 'about:blank') return false;
  return window.innerWidth >= MIN_FRAME_WIDTH && window.innerHeight >= MIN_FRAME_HEIGHT;
}

/**
 * Wait for the player to exist before offering the toggle, then offer it
 * regardless.
 *
 * The wait is the whole point. A recording page builds its player after
 * authenticating and asking for the media, which is long after the document
 * settles — so the first look finds no video, and a translator that took that
 * for an answer would decide the page has nothing to translate and never look
 * again.
 *
 * Running out of looks is not a reason to give up either: the last attempt goes
 * ahead, and the probe behind it gives the honest answer for a page that really
 * has no video.
 */
const PLAYER_WAIT_TRIES = 40;
const PLAYER_WAIT_MS = 500;

function attachWhenPlayerReady(subs: VideoSubTranslator, site: SubtitleSite): void {
  const container = site.button?.container;
  const attempt = (n: number) => {
    const ready = (site.readyToProbe?.() ?? site.findVideo() !== null)
      && (!container || document.querySelector(container) !== null);
    if (ready || n <= 0) {
      void subs.attachButton();
      return;
    }
    setTimeout(() => attempt(n - 1), PLAYER_WAIT_MS);
  };
  attempt(PLAYER_WAIT_TRIES);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',
  async main() {
    if (!frameCouldHoldAPlayer()) return;

    const client = new StorageClient();
    let locale: Locale = 'en';
    let targetLanguage = 'zh-CN';
    let subtitlePosition: SubtitlePosition = DEFAULT_SUBTITLE_POSITION;
    let subtitleStyle: SubtitleStyle = DEFAULT_SUBTITLE_STYLE;
    let dubSettings: DubSettings = DEFAULT_DUB_SETTINGS;
    let subs: VideoSubTranslator | null = null;

    async function reattach() {
      subs?.teardown();
      subs = null;

      const site = subtitleSiteFor(location);
      if (!site) return;

      const data = await client.loadAppData();
      locale = resolveLocale(data.settings.uiLanguage, navigator.language);
      targetLanguage = data.settings.targetLanguage;
      subtitlePosition = data.settings.subtitlePosition;
      subtitleStyle = data.settings.subtitleStyle;
      dubSettings = data.settings.dub;
      /** The channel of the video being dubbed, for remembering a voice picked for it. */
      let channelId = '';
      const subtitleReady = routeProblem(data.settings.engines.subtitle, data.providers) === null;

      subs = createVideoSubTranslator({
        site,
        getTargetLang: () => targetLanguage,
        concurrency: subtitleConcurrency(data.settings.engines.subtitle?.provider),
        getPosition: () => subtitlePosition,
        setPosition: (next) => {
          subtitlePosition = next;
          void client.patchSettings({ subtitlePosition: next });
        },
        getStyle: () => subtitleStyle,
        setStyle: (next) => {
          subtitleStyle = next;
          void client.patchSettings({ subtitleStyle: next });
        },
        strings: {
          titleOff: t('ytSubsButtonTitle', locale),
          titleOn: t('ytSubsButtonTitleOn', locale),
          noCaptions: t('ytSubsNoCaptions', locale),
          enableCc: t('ytSubsEnableCc', locale),
          live: t('ytSubsLive', locale),
          failed: t('ytSubsFailed', locale),
          placeholder: t('ytSubsTranslating', locale),
          dragHint: t('ytSubsDragHint', locale),
          subtitlesToggle: t('ytSubsToggleLabel', locale),
          styleTitle: t('subtitleStyle', locale),
          general: t('subtitleGeneral', locale),
          displayMode: t('subtitleDisplayMode', locale),
          displayBilingual: t('subtitleDisplayBilingual', locale),
          displayOriginalOnly: t('subtitleDisplayOriginalOnly', locale),
          displayTranslationOnly: t('subtitleDisplayTranslationOnly', locale),
          translationPosition: t('subtitleTranslationPosition', locale),
          positionAbove: t('subtitlePositionAbove', locale),
          positionBelow: t('subtitlePositionBelow', locale),
          backgroundOpacity: t('subtitleBackgroundOpacity', locale),
          mainSubtitle: t('subtitleMainLine', locale),
          translationSubtitle: t('subtitleTranslationLine', locale),
          fontScale: t('subtitleFontScale', locale),
          color: t('subtitleColor', locale),
          fontFamily: t('subtitleFontFamily', locale),
          fontDefault: t('subtitleFontDefault', locale),
          fontWeight: t('subtitleFontWeight', locale),
          reset: t('subtitleReset', locale),
          resetAll: t('subtitleResetAll', locale),
          back: t('back', locale),
        },
        notify: (msg) => console.info('[BrowserTranslate]', msg),
        dub: {
          getSettings: () => dubSettings,
          setSettings: (patch) => {
            dubSettings = { ...dubSettings, ...patch };
            void client.patchSettings({ dub: dubSettings });
          },
          hasEngine: () => subtitleReady,
          // YouTube with cloud voices: a voice that matches the channel's speaker.
          ...(CLOUD_TTS && site.id === 'youtube' && {
            voiceForVideo: async () => {
              const { details } = await requestCaptionTracks();
              const videoId = new URLSearchParams(location.search).get('v');
              if (!details || details.videoId !== videoId) return null;
              channelId = details.channelId;
              const req: ChannelVoiceRequest = {
                type: 'dub:voice',
                current: dubSettings.voiceURI,
                video: {
                  channelId: details.channelId, channel: details.author,
                  title: details.title, description: details.shortDescription,
                },
              };
              const res = await chrome.runtime.sendMessage(req) as { voiceURI: string | null } | undefined;
              return res?.voiceURI ?? null;
            },
            rememberVoice: (voiceURI: string) => {
              const req: RememberVoiceRequest = { type: 'dub:remember', channelId, voiceURI };
              try { void chrome.runtime.sendMessage(req).catch(() => {}); } catch { /* extension reloaded */ }
            },
          }),
          ...(CLOUD_TTS && {
            fetchCloudAudio: async (text: string, voiceId: string) => {
              const req: CloudTtsRequest = { type: 'tts:cloud', text, voiceId };
              const res = await chrome.runtime.sendMessage(req) as CloudTtsResponse;
              if (!res?.ok) throw new Error(res?.error ?? 'no response');
              return res.url;
            },
          }),
          openSettings: (tab) => {
            const req: OpenOptionsRequest = { type: 'options:open', tab };
            try { void chrome.runtime.sendMessage(req).catch(() => {}); } catch { /* extension reloaded */ }
          },
          strings: {
            titleOff: t('dubButtonTitle', locale),
            titleOn: t('dubButtonTitleOn', locale),
            preparing: t('ytSubsTranslating', locale),
            clipVolume: t('dubClipVolume', locale),
            dubVolume: t('dubVolume', locale),
            rate: t('dubRate', locale),
            noSubs: t('dubNoSubs', locale),
            noVoice: t('dubNoVoice', locale),
            noVoiceHelp: t('dubNoVoiceHelp', locale),
            noEngine: t('dubNoEngine', locale),
            openSettings: t('settings', locale),
            autoStarted: t('dubAutoToast', locale),
            stop: t('dubStop', locale),
            uiLocale: locale,
            statusLoading: t('dubStatusLoading', locale),
            statusTranslating: t('dubStatusTranslating', locale),
            statusVoicing: t('dubStatusVoicing', locale),
            statusReady: t('dubStatusReady', locale),
            statusHeld: t('dubStatusHeld', locale),
            nativeSwitched: t('dubNativeSwitched', locale),
            nativeAlready: t('dubNativeAlready', locale),
            useOwnDub: t('dubUseOwn', locale),
          },
        },
      });
      attachWhenPlayerReady(subs, site);
    }

    await reattach();

    // Opt-in at setup: keep a log of what was watched, as notes on this Mac.
    if (import.meta.env.WXT_WATCHLOG && window.top === window && location.hostname.endsWith('youtube.com')) {
      const stopWatching = startWatchTracker({
        findVideo: () => document.querySelector<HTMLVideoElement>('video.html5-main-video, video'),
        mediaKey: () => (location.pathname === '/watch' && new URLSearchParams(location.search).get('v')) || '',
        transcript: () => subs?.transcript() ?? [],
        isDubbing: () => subs?.isDubbing() ?? false,
        fetchDetails: async () => {
          const res = await requestCaptionTracks();
          return { details: res.details, language: res.tracks.find((t) => t.kind === 'asr')?.languageCode };
        },
        send: (record) => {
          // After the extension is reloaded or removed, this copy of the
          // script lives on in the open tab with no extension behind it, and
          // sendMessage throws outright — which Chrome lists as an extension
          // error. Stop instead.
          if (!chrome.runtime?.id) { stopWatching(); return; }
          const req: WatchLogRequest = { type: 'watch:log', record };
          try {
            void chrome.runtime.sendMessage(req).catch(() => {});
          } catch {
            stopWatching();
          }
        },
      });
    }

    // YouTube's own SPA-navigation event. No other site we handle needs one,
    // and listening for it elsewhere costs nothing.
    window.addEventListener('yt-navigate-finish', () => {
      // A copy left behind by a reloaded extension has nothing to talk to.
      if (!chrome.runtime?.id) return;
      void reattach();
    });

    // Alt+D turns the Thai dub on and off. Matched on the physical key: on a Mac
    // Option+D types "∂", so `key` would never be "d".
    window.addEventListener('keydown', (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.code !== 'KeyD') return;
      if (!subs || !dubSettings.enabled || isTyping(e.target) || !chrome.runtime?.id) return;
      e.preventDefault();
      e.stopPropagation();
      void subs.toggleDub();
    }, true);

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const change = changes['app:data'];
      if (!change) return;
      const next = change.newValue as AppData | undefined;
      // Moving or restyling the subtitles writes to storage, and this listener
      // fires on our own write — and on the write of a sibling frame showing
      // the other video on the same page. Rebuilding for it would take the
      // translator down mid-video, so these two are applied in place, which is
      // also what makes a change in one frame reach the other.
      if (next && onlySubtitleAppearanceChanged(change.oldValue as AppData | undefined, next)) {
        subtitlePosition = next.settings.subtitlePosition;
        subtitleStyle = next.settings.subtitleStyle;
        const before = dubSettings;
        dubSettings = next.settings.dub;
        // The popup's switch and voice picker act on the video playing now.
        if (subs && before.autoStart !== dubSettings.autoStart && subs.isDubbing() !== dubSettings.autoStart) {
          void subs.toggleDub();
        } else if (subs?.isDubbing() && before.voiceURI !== dubSettings.voiceURI) {
          void subs.toggleDub().then(() => subs?.toggleDub());
        }
        return;
      }
      void reattach();
    });
  },
});

/** Whether a key press is going into a text field rather than to the page. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/**
 * True when a stored-data change touched nothing but the subtitle position and
 * style, or the dub's voice, speed and volumes. All are read live by whatever
 * is already running, so they need no rebuild — rebuilding would cut a dub off
 * mid-sentence. Switching the dub on or off in settings does rebuild, since
 * that adds or removes its button.
 */
function onlySubtitleAppearanceChanged(
  before: AppData | undefined,
  after: AppData,
): boolean {
  if (!before) return false;
  const blank = (d: AppData) => ({
    ...d,
    settings: { ...d.settings, subtitlePosition: null, subtitleStyle: null, dub: d.settings.dub?.enabled },
  });
  return JSON.stringify(blank(before)) === JSON.stringify(blank(after));
}
