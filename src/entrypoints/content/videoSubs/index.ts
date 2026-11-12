import { createCueTranslator } from './translateCues';
import {
  createSubtitlesUi,
  type SubtitleLines,
  type SubtitleUiStrings,
} from './subtitlesUi';
import { mountSubsButton, removeSubsButton, type SubsButtonHandle } from './button';
import type { SubtitleSite } from './site';
import { activeCue } from '~/core/subtitles/activeCue';
import type { Cue } from '~/core/subtitles/types';
import type { SubtitlePosition, SubtitleStyle } from '~/core/subtitles/style';
import { translateBatch, abortTranslate } from '~/messaging/client';
import type { TranslateBatchRequest } from '~/messaging/types';
import { mountDubButton, removeDubButton, showDubToast, type DubButtonHandle, type DubUiStrings } from './dubUi';
import { createDubScheduler, mergeCues, type DubScheduler, type DubLine } from '~/core/dub/scheduler';
import { createDucker, type Ducker } from '~/core/dub/ducking';
import { loadVoices, pickVoice } from '~/core/dub/voice';
import { CLOUD_PREFIX, CLOUD_VOICES, cloudVoiceId, createCloudVoice, type PreparedEngine } from '~/core/dub/cloudVoice';
import type { SpeechEngine } from '~/core/dub/scheduler';
import type { DubSettings } from '~/core/dub/settings';

export interface VideoSubsStrings extends SubtitleUiStrings {
  titleOff: string; titleOn: string; noCaptions: string;
  enableCc: string; live: string; failed: string;
}

export interface VideoSubTranslatorDeps {
  /** Which player this is. Everything site-shaped lives behind it. */
  site: SubtitleSite;
  getTargetLang: () => string;
  strings: VideoSubsStrings;
  notify: (msg: string) => void;
  concurrency: number;
  /** Read live so a settings change reaches an already-playing video. */
  getPosition: () => SubtitlePosition;
  setPosition: (next: SubtitlePosition) => void;
  getStyle: () => SubtitleStyle;
  setStyle: (next: SubtitleStyle) => void;
  /** The Thai dub. Absent (or switched off in settings) means no dub button. */
  dub?: DubDeps;
}

export interface DubStrings extends DubUiStrings {
  /** Shown when the dub starts by itself; `{lang}` is the video's language. */
  autoStarted: string;
  stop: string;
  /** The interface language, for naming the video's language in it. */
  uiLocale: string;
  noSubs: string;
  noVoice: string;
  noVoiceHelp: string;
  noEngine: string;
  openSettings: string;
}

export interface DubDeps {
  getSettings: () => DubSettings;
  setSettings: (patch: Partial<DubSettings>) => void;
  /** Whether the subtitle surface has a working translation engine. */
  hasEngine: () => boolean;
  /** Open the extension's settings at a tab. */
  openSettings: (tab: 'video' | 'translation') => void;
  strings: DubStrings;
  /** Overridable for tests. */
  synth?: SpeechSynthesis;
  /** Fetch a cloud voice's audio for one line (absent: system voices only). */
  fetchCloudAudio?: (text: string, voiceId: string) => Promise<string>;
}

export interface VideoSubTranslator {
  attachButton: () => Promise<void>;
  disable: () => void;
  /** Stop translating and take the whole in-player UI back down. */
  teardown: () => void;
  isOn: () => boolean;
  /** Turn the Thai dub on or off (the player button and Alt+D). */
  toggleDub: () => Promise<void>;
  isDubbing: () => boolean;
  /** The cues loaded for this video, with whatever has been translated so far. */
  transcript: () => Array<{ startMs: number; text: string; translation?: string }>;
}

export function createVideoSubTranslator(deps: VideoSubTranslatorDeps): VideoSubTranslator {
  const { site } = deps;
  let on = false;
  let button: SubsButtonHandle | null = null;
  let translator: ReturnType<typeof createCueTranslator> | null = null;
  // The in-player UI outlives on/off: the menu that turns translation on lives
  // inside it, so it has to be there before there is anything to translate.
  let ui: ReturnType<typeof createSubtitlesUi> | null = null;
  let cues: Cue[] = [];
  let rafId = 0;
  let pumpTarget: HTMLVideoElement | null = null;
  let enabledMediaKey = '';
  let dubButton: DubButtonHandle | null = null;
  let dubbing = false;
  let dubScheduler: DubScheduler | null = null;
  let ducker: Ducker | null = null;
  let duckedAt = -1;
  /** Live volume control for the line playing now (cloud voices only). */
  let setDubVolume: ((v: number) => void) | null = null;
  let dubVolumeAt = -1;

  function currentTimeMs(): number {
    return Math.round((site.findVideo()?.currentTime ?? 0) * 1000);
  }

  // The lines to draw right now, straight from the transcript's own timing.
  // Stable closure so the overlay (created before the cues are fetched) always
  // sees the latest state.
  function getLines(): SubtitleLines | null {
    const cue = activeCue(currentTimeMs(), cues);
    if (!cue) return null;
    return {
      ...(cue.speaker && { speaker: cue.speaker }),
      original: cue.text,
      translation: translator?.get(cue.id) ?? null,
      failed: translator?.isFailed(cue.id) ?? false,
    };
  }

  function ensureUi(): ReturnType<typeof createSubtitlesUi> {
    if (ui) return ui;
    ui = createSubtitlesUi({
      selectors: site.selectors,
      getLines,
      getTargetLang: deps.getTargetLang,
      strings: deps.strings,
      getPosition: deps.getPosition,
      onPositionChange: deps.setPosition,
      getStyle: deps.getStyle,
      onStyleChange: deps.setStyle,
      isActive: () => on,
      onActiveChange: (next) => { if (next) void enable(); else disable(); },
    });
    return ui;
  }

  function tick(): void {
    // The page moved to different media → drop everything, or the previous
    // video's cues would be drawn over the new one.
    if (on && site.mediaKey() !== enabledMediaKey) {
      disable();
      return;
    }
    ui?.refresh();
    if (dubScheduler) {
      const level = deps.dub!.getSettings().duckVolume;
      if (level !== duckedAt) { ducker?.duck(level); duckedAt = level; }
      const vol = deps.dub!.getSettings().volume;
      if (vol !== dubVolumeAt) { setDubVolume?.(vol / 100); dubVolumeAt = vol; }
      dubScheduler.tick();
    }
    rafId = requestAnimationFrame(tick);
  }

  async function enable(): Promise<void> {
    if (on) return;
    on = true;
    enabledMediaKey = site.mediaKey();
    button?.setActive(true);

    // Show the subtitles immediately. Until the transcript arrives getLines()
    // returns null, and once it does the original shows straight away with the
    // "translating…" placeholder beneath it — the subtitle is never blank while
    // a translation is in flight.
    ensureUi().setActive(true);
    rafId = requestAnimationFrame(tick);

    const probe = await site.probe();
    if (!on) return; // reader toggled off during the await
    if (probe.kind === 'live') { deps.notify(deps.strings.live); disable(); return; }
    if (probe.kind === 'none') { deps.notify(deps.strings.noCaptions); disable(); return; }

    // `unknown` goes ahead and asks. Some sites can only answer by fetching the
    // transcript, and doing that before the reader has asked for a translation
    // would be a request we have no business making on every page.
    let fetched: Cue[];
    try {
      fetched = await site.fetchTranscript();
    } catch {
      deps.notify(probe.kind === 'unknown' && probe.hint === 'enableCaptions'
        ? deps.strings.enableCc
        : deps.strings.failed);
      disable();
      return;
    }
    if (!on) return; // reader toggled off during the await
    if (fetched.length === 0) { deps.notify(deps.strings.noCaptions); disable(); return; }
    cues = fetched;

    translator = createCueTranslator({
      translateBatchFn: (req) => translateBatch(req as TranslateBatchRequest),
      abortFn: abortTranslate,
      getTargetLang: deps.getTargetLang,
      getCurrentTimeMs: currentTimeMs,
      getPlaybackRate: () => site.findVideo()?.playbackRate ?? 1,
      onUpdate: () => ui?.refresh(),
      onConfigError: (message) => { deps.notify(message); disable(); },
      concurrency: deps.concurrency,
    });
    translator.start(cues);

    // Translation follows the playhead rather than draining the track, so it has
    // to be nudged as the video moves. timeupdate fires a few times a second,
    // which is plenty to keep the look-ahead window filled.
    pumpTarget = site.findVideo();
    pumpTarget?.addEventListener('timeupdate', pump);
    pumpTarget?.addEventListener('seeked', pump);
    pumpTarget?.addEventListener('ratechange', pump);
    pump();
  }

  function pump(): void {
    translator?.pump();
  }

  function detachPump(): void {
    pumpTarget?.removeEventListener('timeupdate', pump);
    pumpTarget?.removeEventListener('seeked', pump);
    pumpTarget?.removeEventListener('ratechange', pump);
    pumpTarget = null;
  }

  function disable(): void {
    if (!on) return;
    stopDub();
    on = false;
    button?.setActive(false);
    cancelAnimationFrame(rafId);
    detachPump();
    translator?.teardown();
    translator = null;
    cues = [];
    // The UI stays: its menu is how translation gets turned back on.
    ui?.setActive(false);
  }

  function teardown(): void {
    disable();
    stopDub();
    dubButton?.remove();
    dubButton = null;
    ui?.teardown();
    ui = null;
  }

  async function attachButton(): Promise<void> {
    // Probe up front so the toggle is never offered on media that has nothing to
    // translate. Only a definite no hides it — a site that cannot tell yet gets
    // the button, and says so when it is pressed.
    const probe = await site.probe();
    if (probe.kind === 'none') {
      removeSubsButton();
      removeDubButton();
      teardown();
      return;
    }
    if (site.button) {
      button = mountSubsButton(site.button, {
        titleOff: deps.strings.titleOff,
        titleOn: deps.strings.titleOn,
        // The button opens the menu rather than translating outright: the same
        // press has to reach the style settings, which are useless once the video
        // has moved on and the reader has to hunt for them.
        onToggle: () => ensureUi().togglePanel(),
      }, site.selectors);
      button.setActive(on);
    }
    if (site.button && deps.dub?.getSettings().enabled) {
      const dub = deps.dub;
      dubButton = mountDubButton(site.button, site.selectors, {
        strings: dub.strings,
        onToggle: () => { void toggleDub(); },
        getMenuValues: () => dub.getSettings(),
        voices: dub.fetchCloudAudio
          ? CLOUD_VOICES.map((v) => ({ value: CLOUD_PREFIX + v.id, label: v.name }))
          : [],
        onMenuChange: (patch) => {
          dub.setSettings(patch);
          // A new voice takes over from the next line on.
          if (patch.voiceURI && dubbing) { stopDub(); void toggleDub(); }
        },
      });
      dubButton?.setState(dubbing ? 'on' : 'off');
    }
    ensureUi();
    // Auto-start: only where there is something foreign to dub. A track already
    // in the target language needs no voice-over.
    const s = deps.dub?.getSettings();
    const target = deps.getTargetLang().toLowerCase().split('-')[0]!;
    const spoken = probe.kind === 'ready'
      ? (probe.spokenLanguage ?? probe.languageCode)?.toLowerCase().split('-')[0]
      : undefined;
    if (s?.enabled && s.autoStart && !dubbing && probe.kind !== 'live' && spoken !== target) {
      void toggleDub().then(() => {
        if (!dubbing || !deps.dub) return;
        // Say why a voice just started, and how to stop it.
        dubToast(deps.dub.strings.autoStarted.replace('{lang}', languageLabel(spoken, deps.dub.strings.uiLocale)),
          { label: deps.dub.strings.stop, run: stopDub });
      });
    }
  }

  // --- Thai dub -------------------------------------------------------------

  function dubToast(text: string, action?: { label: string; run: () => void }): void {
    showDubToast(site.selectors, text, action);
  }

  async function toggleDub(): Promise<void> {
    const dub = deps.dub;
    if (!dub) return;
    if (dubbing) { stopDub(); return; }
    const s = dub.strings;
    if (!dub.hasEngine()) {
      dubToast(s.noEngine, { label: s.openSettings, run: () => dub.openSettings('translation') });
      return;
    }
    // A cloud voice when one is chosen and this build can reach it; the
    // computer's own voices otherwise.
    const cloudId = dub.fetchCloudAudio ? cloudVoiceId(dub.getSettings().voiceURI) : null;
    let synth: SpeechEngine | undefined;
    let engine: PreparedEngine | undefined;
    let voice: SpeechSynthesisVoice | null = null;
    let lang = 'th-TH';
    if (cloudId) {
      const fetchAudio = dub.fetchCloudAudio!;
      let setVolume: (v: number) => void;
      ({ synth, engine, setVolume } = createCloudVoice({ fetchAudio: (text) => fetchAudio(text, cloudId) }));
      setDubVolume = setVolume;
      dubVolumeAt = dub.getSettings().volume;
    } else {
      const system = dub.synth ?? globalThis.speechSynthesis;
      voice = system
        ? pickVoice(await loadVoices(system), dub.getSettings().voiceURI, deps.getTargetLang())
        : null;
      if (!system || !voice) {
        dubToast(s.noVoice, { label: s.noVoiceHelp, run: () => dub.openSettings('video') });
        return;
      }
      synth = system;
      lang = voice.lang;
    }
    dubbing = true;
    dubButton?.setState('preparing');
    if (!on) await enable();
    // enable() switches itself off when there is nothing to translate.
    if (!on) { stopDub(); dubToast(s.noSubs); return; }
    if (!dubbing) return; // turned off again while the transcript loaded
    const video = site.findVideo();
    if (!translator || cues.length === 0 || !video) {
      stopDub();
      dubToast(s.noSubs);
      return;
    }
    const tr = translator;
    ducker = createDucker(video);
    duckedAt = dub.getSettings().duckVolume;
    ducker.duck(duckedAt);
    dubScheduler = createDubScheduler({
      synth,
      video,
      lines: mergeCues(cues),
      getText: (line: DubLine) => {
        const parts: string[] = [];
        for (const id of line.ids) {
          const text = tr.get(id);
          if (text !== undefined) parts.push(text);
          else if (!tr.isFailed(id)) return null; // still translating
        }
        return parts.join(' ').trim();
      },
      getSettings: dub.getSettings,
      getVoice: () => voice,
      lang,
      engine,
      onSpeak: () => dubButton?.setState('on'),
    });
  }

  function stopDub(): void {
    dubScheduler?.stop();
    dubScheduler = null;
    ducker?.restore();
    ducker = null;
    setDubVolume = null;
    if (!dubbing) return;
    dubbing = false;
    dubButton?.setState('off');
  }

  function transcript() {
    return cues.map((c) => ({ startMs: c.startMs, text: c.text, translation: translator?.get(c.id) }));
  }

  return { attachButton, disable, teardown, isOn: () => on, toggleDub, isDubbing: () => dubbing, transcript };
}

/** A language code as a word in the page's language ("en" → "อังกฤษ"), or the code. */
function languageLabel(code: string | undefined, locale: string): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames([locale], { type: 'language' })
      .of(code) ?? code;
  } catch {
    return code;
  }
}
