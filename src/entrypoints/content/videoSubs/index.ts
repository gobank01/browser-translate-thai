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
import { mostlyThai } from '~/core/dub/thai';
import type { SubtitlePosition, SubtitleStyle } from '~/core/subtitles/style';
import { translateBatch, abortTranslate } from '~/messaging/client';
import type { TranslateBatchRequest } from '~/messaging/types';
import { mountDubButton, removeDubButton, setDubStatus, showDubToast, showLessonPanel, type LessonStrings, type LessonView, type DubButtonHandle, type DubUiStrings } from './dubUi';
import { createDubScheduler, mergeCues, type DubScheduler, type DubLine } from '~/core/dub/scheduler';
import { createDucker, type Ducker } from '~/core/dub/ducking';
import { loadVoices, pickVoice } from '~/core/dub/voice';
import type { SpeakerLabels, SpeakerLine } from '~/core/dub/speakers';
import { voiceOfGender } from '~/core/dub/channelVoice';
import { cloudVoiceId, sameProviderVoices, createCloudVoice, type PreparedEngine } from '~/core/dub/cloudVoice';
import type { SpeechEngine } from '~/core/dub/scheduler';
import type { DubSettings } from '~/core/dub/settings';
import { isThaiCode, type SttResult } from '~/core/dub/stt';
import { startTranscribeLoop, type TranscribeLoop } from './transcribeLoop';

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
  /** The video has its own Thai track and we switched to it / it was already on. */
  nativeSwitched: string;
  nativeAlready: string;
  /** Action: dub it ourselves anyway. */
  useOwnDub: string;
  /** The video's captions are Thai already. */
  alreadyThai: string;
  /** The "summarize what I've watched" menu item and its panel. */
  lessonMenu: string;
  lesson: LessonStrings;
  /** On-video progress. `{n}` / `{total}` are filled in. */
  statusLoading: string;
  statusTranslating: string;
  statusVoicing: string;
  statusReady: string;
  /** Appended while the video is held until the dub is ready. */
  statusHeld: string;
  /** The video has no captions and its audio is being transcribed. */
  statusTranscribing: string;
  /** No captions, and the player's audio could not be reached to transcribe. */
  noAudio: string;
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
  /**
   * The voice for the video now open — e.g. one matching the channel's speaker
   * — or null to use the voice in settings.
   */
  voiceForVideo?: () => Promise<string | null>;
  /** The viewer picked `voiceURI` from the player menu: keep it for this video's channel. */
  rememberVoice?: (voiceURI: string) => void;
  /**
   * Label who speaks each line and their gender, given the speakers found so
   * far (absent: one voice for the whole video).
   */
  labelSpeakers?: (lines: SpeakerLine[], known: SpeakerLabels['speakers']) => Promise<SpeakerLabels>;
  /** Build a study note from the part already watched (absent: no lesson feature). */
  makeLesson?: (lines: Array<{ startMs: number; text: string }>) => Promise<LessonView>;
  /** Fetch a cloud voice's audio for one line (absent: system voices only). */
  fetchCloudAudio?: (text: string, voiceId: string) => Promise<string>;
  /** Speech to text, for videos with no captions (absent: those are skipped). */
  transcribe?: (audio: ArrayBuffer, mime: string) => Promise<SttResult>;
}

export interface VideoSubTranslator {
  attachButton: () => Promise<void>;
  disable: () => void;
  /** Stop translating and take the whole in-player UI back down. */
  teardown: () => void;
  isOn: () => boolean;
  /** Turn the Thai dub on or off (the player button and Alt+D). */
  /** `own`: use our dub even where the video has a Thai track of its own. */
  toggleDub: (opts?: { own?: boolean }) => Promise<void>;
  isDubbing: () => boolean;
  /** The cues loaded for this video, with whatever has been translated so far. */
  transcript: () => Array<{ startMs: number; text: string; translation?: string }>;
  /** Summarize what has been watched so far, in a panel on the video. */
  showLesson: () => Promise<void>;
  /** The last lesson made for this video, for the watch log. */
  lesson: () => LessonView | null;
}

/** Longest the video is held waiting for the dub before it plays regardless. */
const HOLD_MAX_MS = 20_000;
/** Re-asks for captions that were not ready yet, for auto-dub. */
const PROBE_RETRIES = 6;
const PROBE_RETRY_MS = 1000;
/** Separates voice and text in a line's audio key. */
const VOICE_SEP = '\u0001';
/** How far ahead speakers are worked out, how many lines at a time, and when to stop trying. */
const SPEAKER_AHEAD_MS = 60_000;
const SPEAKER_BATCH = 40;
const SPEAKER_MAX_ERRORS = 3;
/** Lines each of a man and a woman must have before voices are switched at all. */
const SPEAKER_MIN_LINES = 3;
/** A line this close to starting goes ahead in the default voice rather than wait for its speaker. */
const SPEAKER_WAIT_MS = 4000;
/** Longest a playing video is paused for one late line before it carries on. */
const GAP_HOLD_MAX_MS = 6000;
/** How long "ready" stays on screen. */
const READY_NOTE_MS = 1500;
/** Least time between two waits for transcription to catch up. */
const BEHIND_HOLD_EVERY_MS = 30_000;
const byStart = (a: { startMs: number }, b: { startMs: number }) => a.startMs - b.startMs;

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
  /** The captions turned out to be Thai already, so nothing was translated. */
  let alreadyThai = false;
  let dubButton: DubButtonHandle | null = null;
  let dubbing = false;
  let dubScheduler: DubScheduler | null = null;
  let ducker: Ducker | null = null;
  let duckedAt = -1;
  /** Live volume control for the line playing now (cloud voices only). */
  let setDubVolume: ((v: number) => void) | null = null;
  /** The voice the dub is speaking with now (may differ from settings: per channel). */
  let activeVoiceURI = '';
  /** The video was paused by us to wait for the dub; it is resumed when ready. */
  let holding = false;
  let holdUntil = 0;
  let lastStatusAt = 0;
  /** When the "ready" note went up, so it can come down again. */
  let readySince = 0;
  /** The line a mid-video wait was last made for, so it is waited for once. */
  let heldForLine = -1;
  /** The current wait is for one late line, not the start of the dub. */
  let gapHold = false;
  let dubVolumeAt = -1;
  /** Captions made from the audio, for a video that has none. */
  let transcriber: TranscribeLoop | null = null;
  /** What the dub speaks; grows as transcribed lines come in. */
  let dubLines: DubLine[] = [];
  let behindHoldAt = 0;

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
    if (dubbing) {
      updateStatus();
      if (dubScheduler) pumpSpeakers((site.findVideo()?.currentTime ?? 0) * 1000);
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
    if (probe.kind === 'none') {
      if (canTranscribe()) { startTranscribing(); return; }
      deps.notify(deps.strings.noCaptions); disable(); return;
    }

    // `unknown` goes ahead and asks. Some sites can only answer by fetching the
    // transcript, and doing that before the reader has asked for a translation
    // would be a request we have no business making on every page.
    let fetched: Cue[];
    try {
      fetched = await site.fetchTranscript();
    } catch {
      if (!on) return;
      if (canTranscribe()) { startTranscribing(); return; }
      deps.notify(probe.kind === 'unknown' && probe.hint === 'enableCaptions'
        ? deps.strings.enableCc
        : deps.strings.failed);
      disable();
      return;
    }
    if (!on) return; // reader toggled off during the await
    if (fetched.length === 0) {
      if (canTranscribe()) { startTranscribing(); return; }
      deps.notify(deps.strings.noCaptions); disable(); return;
    }
    // Captions already in Thai, for a Thai target: nothing to translate or dub.
    if (deps.getTargetLang().toLowerCase().startsWith('th') && mostlyThai(fetched)) {
      alreadyThai = true;
      disable();
      return;
    }
    cues = fetched;
    startTranslator();
  }

  function startTranslator(): void {
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

  /** The player streams its audio (MSE), so it can be tapped and transcribed. */
  function canTranscribe(): boolean {
    return Boolean(deps.dub?.transcribe && site.findVideo()?.currentSrc.startsWith('blob:'));
  }

  function startTranscribing(): void {
    const video = site.findVideo()!;
    cues = [];
    startTranslator();
    transcriber = startTranscribeLoop({
      video,
      transcribe: deps.dub!.transcribe!,
      onCues: (more) => {
        cues.push(...more);
        cues.sort(byStart);
        translator?.add(more);
        dubLines.push(...mergeCues(more));
        dubLines.sort(byStart);
        pump();
      },
      onLanguage: (code) => {
        if (!deps.getTargetLang().toLowerCase().startsWith('th') || !isThaiCode(code)) return true;
        // Spoken in Thai: nothing to translate, and nothing more to pay for.
        alreadyThai = true;
        const wasDubbing = dubbing;
        disable();
        if (wasDubbing && deps.dub) dubToast(deps.dub.strings.alreadyThai);
        return false;
      },
    });
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
    transcriber?.stop();
    transcriber = null;
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
    let probe = await site.probe();
    // A player that is up before its captions are (YouTube Shorts) answers
    // "can't tell" at first; for auto-dub, ask again a few times before
    // settling for that.
    for (let i = 0; probe.kind === 'unknown' && deps.dub?.getSettings().autoStart && i < PROBE_RETRIES; i++) {
      await new Promise((r) => setTimeout(r, PROBE_RETRY_MS));
      probe = await site.probe();
    }
    const transcribable = probe.kind === 'none' && canTranscribe();
    if (probe.kind === 'none' && !transcribable) {
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
        getMenuValues: () => ({ ...dub.getSettings(), voiceURI: activeVoiceURI || dub.getSettings().voiceURI }),
        voices: dub.fetchCloudAudio
          ? sameProviderVoices(dub.getSettings().voiceURI).map((v) => ({ value: v.uri, label: `${v.gender === 'female' ? '♀' : '♂'} ${v.name}` }))
          : [],
        ...(dub.makeLesson && { onLesson: () => { void showLesson(); }, lessonLabel: dub.strings.lessonMenu }),
        onMenuChange: ({ voiceURI, ...rest }) => {
          if (Object.keys(rest).length) dub.setSettings(rest);
          if (!voiceURI) return;
          // A voice picked on the video is this channel's voice from now on;
          // the default in settings stays as it was.
          if (dub.rememberVoice) dub.rememberVoice(voiceURI);
          else dub.setSettings({ voiceURI });
          activeVoiceURI = voiceURI;
          // A new voice takes over from the next line on.
          if (dubbing) { stopDub(); void toggleDub(); }
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
    // Unknown language: do nothing by itself rather than spend on a Thai video.
    // No captions: only on YouTube, where a page is one video someone chose,
    // and not for a Thai title or a song — the first chunk is paid for.
    const autoTranscribe = transcribable && probe.kind === 'none' && site.id === 'youtube'
      && !probe.thai && !probe.music && target === 'th';
    if (s?.enabled && s.autoStart && !dubbing && (autoTranscribe
      || (probe.kind === 'ready' && !probe.music && spoken && spoken !== target))) {
      void toggleDub().then(() => {
        if (!dubbing || !deps.dub) return;
        // Say why a voice just started, and how to stop it.
        const auto = deps.dub.strings.autoStarted;
        dubToast(spoken ? auto.replace('{lang}', languageLabel(spoken, deps.dub.strings.uiLocale)) : auto.replace(/ · [^·]*\{lang\}/, ''),
          { label: deps.dub.strings.stop, run: stopDub });
      });
    }
  }

  // --- Thai dub -------------------------------------------------------------

  function dubToast(text: string, action?: { label: string; run: () => void }): void {
    showDubToast(site.selectors, text, action);
  }

  async function toggleDub(opts: { own?: boolean } = {}): Promise<void> {
    const dub = deps.dub;
    if (!dub) return;
    if (dubbing) { stopDub(); return; }
    const s = dub.strings;
    if (!dub.hasEngine()) {
      dubToast(s.noEngine, { label: s.openSettings, run: () => dub.openSettings('translation') });
      return;
    }
    // Hold the video until the first lines can be heard, so the viewer is not
    // left wondering when to press play.
    dubbing = true;
    dubButton?.setState('preparing');
    hold();
    setDubStatus(site.selectors, { text: withHold(s.statusLoading) });
    // A video with its own Thai track (YouTube's dubs) plays that instead:
    // perfectly in time and free. The viewer can still ask for ours.
    if (!opts.own && site.nativeAudio && dub.getSettings().preferNative) {
      const lang = deps.getTargetLang().toLowerCase().split('-')[0]!;
      const native = await site.nativeAudio(lang).catch(() => 'none' as const);
      if (!dubbing) return;
      if (native !== 'none') {
        stopDub();
        dubToast(native === 'switched' ? s.nativeSwitched : s.nativeAlready,
          { label: s.useOwnDub, run: () => { void toggleDub({ own: true }); } });
        return;
      }
    }
    activeVoiceURI = (await dub.voiceForVideo?.().catch(() => null)) ?? dub.getSettings().voiceURI;
    if (!dubbing) return;
    // A cloud voice when one is chosen and this build can reach it; the
    // computer's own voices otherwise.
    const cloudId = dub.fetchCloudAudio ? cloudVoiceId(activeVoiceURI) : null;
    let synth: SpeechEngine | undefined;
    let engine: PreparedEngine | undefined;
    let voice: SpeechSynthesisVoice | null = null;
    let lang = 'th-TH';
    if (cloudId) {
      const fetchAudio = dub.fetchCloudAudio!;
      let setVolume: (v: number) => void;
      // Each line's audio is keyed by voice and text, so speakers can differ line by line.
      ({ synth, engine, setVolume } = createCloudVoice({
        fetchAudio: (key) => {
          const [uri, text] = key.split(VOICE_SEP) as [string, string];
          return fetchAudio(text, uri);
        },
      }));
      setDubVolume = setVolume;
      dubVolumeAt = dub.getSettings().volume;
    } else {
      const system = dub.synth ?? globalThis.speechSynthesis;
      voice = system
        ? pickVoice(await loadVoices(system), activeVoiceURI, deps.getTargetLang())
        : null;
      if (!system || !voice) {
        stopDub();
        dubToast(s.noVoice, { label: s.noVoiceHelp, run: () => dub.openSettings('video') });
        return;
      }
      synth = system;
      lang = voice.lang;
    }
    if (!on) await enable();
    // enable() switches itself off when there is nothing to translate.
    if (!on) { stopDub(); dubToast(alreadyThai ? s.alreadyThai : s.noSubs); return; }
    if (!dubbing) return; // turned off again while the transcript loaded
    const video = site.findVideo();
    if (!translator || (cues.length === 0 && !transcriber) || !video) {
      stopDub();
      dubToast(s.noSubs);
      return;
    }
    const tr = translator;
    dubLines = mergeCues(cues);
    ducker = createDucker(video);
    duckedAt = dub.getSettings().duckVolume;
    ducker.duck(duckedAt);
    dubScheduler = createDubScheduler({
      synth,
      video,
      lines: dubLines,
      getText: (line: DubLine) => {
        const parts: string[] = [];
        for (const id of line.ids) {
          const text = tr.get(id);
          if (text !== undefined) parts.push(text);
          else if (!tr.isFailed(id)) return null; // still translating
        }
        const text = parts.join(' ').trim();
        if (!text || !cloudId) return text;
        const uri = voiceForLine(line, video.currentTime * 1000);
        return uri ? `${uri}${VOICE_SEP}${text}` : null;
      },
      getSettings: dub.getSettings,
      getVoice: () => voice,
      lang,
      engine,
      onSpeak: () => dubButton?.setState('on'),
    });
  }

  function hold(maxMs = HOLD_MAX_MS): void {
    const video = site.findVideo();
    if (!video || video.paused) return;
    holding = true;
    holdUntil = Date.now() + maxMs;
    video.pause();
  }

  function release(): void {
    gapHold = false;
    if (!holding) return;
    holding = false;
    try {
      void Promise.resolve(site.findVideo()?.play()).catch(() => {});
    } catch { /* a player that will not play is the viewer's to start */ }
  }

  function withHold(text: string): string {
    return holding ? `${text} · ${deps.dub!.strings.statusHeld}` : text;
  }

  /** Keep the on-video status current; a few times a second is plenty. */
  function updateStatus(): void {
    const now = Date.now();
    if (now - lastStatusAt < 250) return;
    lastStatusAt = now;
    const s = deps.dub!.strings;
    if (!dubScheduler) {
      setDubStatus(site.selectors, { text: withHold(s.statusLoading) });
      return;
    }
    const video0 = site.findVideo();
    if (transcriber && video0) {
      if (transcriber.failed()) { stopDub(); dubToast(s.noAudio); return; }
      // The transcript has not reached the playhead: wait for it (once in a
      // while — a player that buffers little would otherwise stutter).
      if (!transcriber.covers(video0.currentTime + 0.5)) {
        if (!holding && !video0.paused && transcriber.started() && now - behindHoldAt > BEHIND_HOLD_EVERY_MS) {
          behindHoldAt = now;
          gapHold = true;
          hold(GAP_HOLD_MAX_MS);
        }
        if (holding && now > holdUntil) release();
        readySince = 0;
        setDubStatus(site.selectors, { text: withHold(s.statusTranscribing) });
        return;
      }
    }
    const r = dubScheduler.readiness();
    // Mid-video, the next line about to start without its voice would be a
    // stretch of silence: wait for it briefly instead — once per line.
    const video = site.findVideo();
    const nextAt = Math.round((video?.currentTime ?? 0) * 1000 + r.nextInMs);
    if (!holding && video && !video.paused && !r.nextReady && r.nextInMs < 600 && heldForLine !== nextAt) {
      heldForLine = nextAt;
      gapHold = true;
      hold(GAP_HOLD_MAX_MS);
    }
    if (gapHold && holding && (r.nextReady || now > holdUntil)) {
      gapHold = false;
      release();
    }
    if (r.ready || (holding && now > holdUntil)) {
      release();
      if (!readySince) {
        readySince = now;
        setDubStatus(site.selectors, { text: s.statusReady, tone: 'ready' });
      } else if (now - readySince > READY_NOTE_MS) {
        setDubStatus(site.selectors, null);
      }
      return;
    }
    readySince = 0;
    const fill = (t: string, n: number) => t.replace('{n}', String(n)).replace('{total}', String(r.total));
    const text = r.translated < r.total ? fill(s.statusTranslating, r.translated) : fill(s.statusVoicing, r.voiced);
    setDubStatus(site.selectors, {
      text: withHold(text),
      progress: r.total ? (r.translated + r.voiced) / (2 * r.total) : 0,
    });
  }

  function stopDub(): void {
    resetSpeakers();
    release();
    readySince = 0;
    setDubStatus(site.selectors, null);
    dubScheduler?.stop();
    dubScheduler = null;
    ducker?.restore();
    ducker = null;
    setDubVolume = null;
    if (!dubbing) return;
    dubbing = false;
    dubButton?.setState('off');
  }

  let lastLesson: LessonView | null = null;

  // --- who speaks each line -------------------------------------------------
  let speakerOf = new Map<number, string>();
  let speakerGenders: SpeakerLabels['speakers'] = {};
  let speakerAsked = new Set<number>();
  let speakerBusy = false;
  let speakerErrors = 0;

  function resetSpeakers(): void {
    speakerOf = new Map();
    speakerGenders = {};
    speakerAsked = new Set();
    speakerBusy = false;
    speakerErrors = 0;
  }

  /** Label the lines due in the next minute that have no speaker yet. */
  function pumpSpeakers(nowMs: number): void {
    const label = deps.dub?.labelSpeakers;
    if (!label || !deps.dub?.getSettings().voicePerSpeaker || speakerBusy || speakerErrors >= SPEAKER_MAX_ERRORS) return;
    const due = cues.filter((c) => c.endMs >= nowMs - 2000 && c.startMs <= nowMs + SPEAKER_AHEAD_MS
      && !speakerOf.has(c.id) && !speakerAsked.has(c.id)).slice(0, SPEAKER_BATCH);
    if (!due.length) return;
    // A few lines already labelled before them, so turns carry over.
    const first = cues.indexOf(due[0]!);
    const context = cues.slice(Math.max(0, first - 6), first).filter((c) => speakerOf.has(c.id));
    for (const c of due) speakerAsked.add(c.id);
    speakerBusy = true;
    const toLine = (c: Cue): SpeakerLine => ({ id: c.id, text: c.text, ...(c.speaker && { speaker: c.speaker }) });
    void label([...context, ...due].map(toLine), speakerGenders)
      .then((r) => {
        speakerGenders = { ...speakerGenders, ...r.speakers };
        for (const [id, sp] of Object.entries(r.lines)) speakerOf.set(Number(id), sp);
      })
      .catch(() => {
        speakerErrors++;
        for (const c of due) speakerAsked.delete(c.id);
      })
      .finally(() => { speakerBusy = false; });
  }

  /**
   * The voice for one line: the channel's voice for a video with one speaker,
   * else a voice of the speaker's gender. Null while the speaker is still
   * being worked out and the line is not yet due.
   */
  function voiceForLine(line: DubLine, nowMs: number): string | null {
    if (!deps.dub?.labelSpeakers || !deps.dub.getSettings().voicePerSpeaker || speakerErrors >= SPEAKER_MAX_ERRORS) {
      return activeVoiceURI;
    }
    const speaker = line.ids.map((id) => speakerOf.get(id)).find(Boolean);
    if (!speaker) return line.startMs - nowMs > SPEAKER_WAIT_MS ? null : activeVoiceURI;
    // Only switch once a man and a woman have each clearly spoken several
    // lines; anything less certain keeps the one voice, since a voice that
    // flips on a guess is worse than no switching at all.
    const linesBy = { male: 0, female: 0 };
    for (const sp of speakerOf.values()) {
      const g = speakerGenders[sp];
      if (g === 'male' || g === 'female') linesBy[g]++;
    }
    const gender = speakerGenders[speaker];
    if (linesBy.male < SPEAKER_MIN_LINES || linesBy.female < SPEAKER_MIN_LINES
      || !gender || gender === 'unknown') return activeVoiceURI;
    return voiceOfGender(gender, activeVoiceURI) ?? activeVoiceURI;
  }

  async function showLesson(): Promise<void> {
    const dub = deps.dub;
    if (!dub?.makeLesson) return;
    const video = site.findVideo();
    const now = (video?.currentTime ?? 0) * 1000;
    const lines = cues
      .filter((c) => c.startMs <= now)
      .map((c) => ({ startMs: c.startMs, text: translator?.get(c.id) ?? c.text }));
    const seek = (ms: number) => { if (video) video.currentTime = ms / 1000; };
    if (!lines.length) { console.warn('[BrowserTranslate] lesson: nothing watched yet', cues.length, now); showLessonPanel(site.selectors, dub.strings.lesson.failed, dub.strings.lesson, seek); return; }
    showLessonPanel(site.selectors, null, dub.strings.lesson, seek);
    try {
      lastLesson = await dub.makeLesson(lines);
      showLessonPanel(site.selectors, lastLesson, dub.strings.lesson, seek);
    } catch (e) {
      console.warn('[BrowserTranslate] lesson failed:', e);
      showLessonPanel(site.selectors, dub.strings.lesson.failed, dub.strings.lesson, seek);
    }
  }

  function transcript() {
    return cues.map((c) => ({ startMs: c.startMs, text: c.text, translation: translator?.get(c.id) }));
  }

  return {
    attachButton, disable, teardown, isOn: () => on, toggleDub, isDubbing: () => dubbing, transcript,
    showLesson, lesson: () => lastLesson,
  };
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
