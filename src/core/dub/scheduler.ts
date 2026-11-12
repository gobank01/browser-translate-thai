import type { Cue } from '~/core/subtitles/types';
import type { DubSettings } from './settings';
import type { PreparedEngine } from './cloudVoice';

/**
 * Speaking translated subtitles in time with the video.
 *
 * The rule that keeps the dub in sync is simple: only the line under the
 * playhead is ever spoken. A line whose moment has passed is never queued up,
 * so lateness cannot accumulate — the worst case is one line cut short when the
 * next one is due (after a short grace, so a line ending a beat late keeps its
 * last word).
 */

/** One spoken unit: one cue, or several short adjacent cues read as a sentence. */
export interface DubLine {
  ids: number[];
  startMs: number;
  endMs: number;
}

/** Adjacent cues closer than this are one sentence broken across the screen. */
const MERGE_GAP_MS = 300;
/** …unless merging would make one line longer than this. */
const MERGE_MAX_SPAN_MS = 6000;
const SENTENCE_END = /[.!?…。！？]["')\]]*$/;

/** How long the previous line may run into the next before it is cut. */
export const GRACE_MS = 600;
/** The most auto-rate will speed a line up. */
export const MAX_AUTO_RATE = 1.5;
/**
 * Roughly how fast a Thai TTS voice reads at rate 1, in spoken characters per
 * second (whitespace and Thai combining marks excluded). An estimate is all
 * auto-rate needs: it only has to tell a line that fits from one that won't.
 */
const CHARS_PER_SECOND = 14;

/** Merge short adjacent cues into sentence-sized lines. Cues must be sorted. */
export function mergeCues(cues: readonly Cue[]): DubLine[] {
  const lines: DubLine[] = [];
  let lastText = '';
  for (const cue of cues) {
    const prev = lines[lines.length - 1];
    if (
      prev
      && cue.startMs - prev.endMs <= MERGE_GAP_MS
      && cue.endMs - prev.startMs <= MERGE_MAX_SPAN_MS
      && !SENTENCE_END.test(lastText.trim())
    ) {
      prev.ids.push(cue.id);
      prev.endMs = Math.max(prev.endMs, cue.endMs);
    } else {
      lines.push({ ids: [cue.id], startMs: cue.startMs, endMs: cue.endMs });
    }
    lastText = cue.text;
  }
  return lines;
}

/** Estimated speaking time at rate 1. */
export function estimateSpeechMs(text: string): number {
  // Thai vowel signs and tone marks above/below the line take no time of their own.
  const spoken = text.replace(/[\sัิ-ฺ็-๎]/g, '').length;
  return spoken / CHARS_PER_SECOND * 1000;
}

/**
 * The rate to speak `text` at so it fits in `availableMs`: never slower than
 * `base`, never faster than MAX_AUTO_RATE (or `base`, if that is higher).
 */
export function fitRate(
  text: string, availableMs: number, base: number, autoRate: boolean, knownMs?: number,
): number {
  if (!autoRate) return base;
  const needed = availableMs > 0 ? (knownMs ?? estimateSpeechMs(text)) / availableMs : Infinity;
  return Math.min(Math.max(needed, base), Math.max(base, MAX_AUTO_RATE));
}

/** Index of the first line that has not ended by `timeMs` (lines.length if none). */
function firstLineFrom(timeMs: number, lines: readonly DubLine[]): number {
  let lo = 0;
  let hi = lines.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid]!.endMs <= timeMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** How far ahead of the playhead cloud audio is fetched. */
export const PREPARE_AHEAD_MS = 30_000;

/** The index of the line containing `timeMs`, or -1 in a gap. Lines are sorted. */
export function lineAt(timeMs: number, lines: readonly DubLine[]): number {
  let lo = 0;
  let hi = lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const l = lines[mid]!;
    if (timeMs < l.startMs) hi = mid - 1;
    else if (timeMs >= l.endMs) lo = mid + 1;
    else return mid;
  }
  return -1;
}

export type SpeechEngine = Pick<SpeechSynthesis, 'speak' | 'cancel' | 'speaking'>;

export interface DubSchedulerDeps {
  synth: SpeechEngine;
  video: HTMLVideoElement;
  lines: readonly DubLine[];
  /** The line's translation, or null while any part of it is still in flight. */
  getText: (line: DubLine) => string | null;
  getSettings: () => DubSettings;
  getVoice: () => SpeechSynthesisVoice | null;
  lang: string;
  /** Called each time a line starts — the first call means the dub is audible. */
  onSpeak?: () => void;
  /** A voice whose audio is fetched (cloud): prepared ahead, waited for, measured. */
  engine?: PreparedEngine;
  /** Overridable for tests, where SpeechSynthesisUtterance does not exist. */
  createUtterance?: (text: string) => SpeechSynthesisUtterance;
}

export interface DubScheduler {
  /** Call often (every animation frame): starts the line under the playhead. */
  tick: () => void;
  stop: () => void;
  /** How ready the next few lines are — for the on-video status. */
  readiness: () => DubReadiness;
}

export interface DubReadiness {
  /** Lines looked at: the next few from the playhead. */
  total: number;
  translated: number;
  /** Translated and with audio to hand (always = translated for a system voice). */
  voiced: number;
  ready: boolean;
}

/** How many upcoming lines must be ready before the dub counts as ready. */
export const READY_LINES = 3;

export function createDubScheduler(deps: DubSchedulerDeps): DubScheduler {
  const { synth, video, lines } = deps;
  const make = deps.createUtterance ?? ((text: string) => new SpeechSynthesisUtterance(text));
  /** The line most recently started, so it is not started twice. */
  let spoken = -1;
  /** Whether the speech in progress is ours. */
  let talking = false;

  function silence(): void {
    if (talking || synth.speaking) synth.cancel();
    talking = false;
  }

  // Pausing stops the voice at once; seeking (or resuming) re-reads whatever
  // line the playhead is in, fitted into the time that line has left.
  function interrupt(): void {
    silence();
    spoken = -1;
  }
  video.addEventListener('pause', interrupt);
  video.addEventListener('seeking', interrupt);

  function tick(): void {
    const now = video.currentTime * 1000;
    // Fetch ahead even while paused: that is when the viewer is waiting for it.
    if (deps.engine) prepareAhead(now, deps.engine);
    if (video.paused || video.seeking) {
      if (talking) interrupt();
      return;
    }
    const idx = lineAt(now, lines);
    if (idx < 0 || idx === spoken) return;
    const line = lines[idx]!;
    const text = deps.getText(line);
    if (!text) {
      // A line with nothing to say is done with; one still translating is not.
      if (text === '') spoken = idx;
      return;
    }
    // Let the previous line finish its last word before cutting it — but only
    // just past its own end; one that has run on longer than that is stale.
    const previous = spoken >= 0 ? lines[spoken] : undefined;
    if (talking && synth.speaking && previous && now < previous.endMs + GRACE_MS) return;
    // Cloud audio still on its way: wait, then fit it into what is left of the line.
    if (deps.engine && !deps.engine.ready(text)) return;

    silence();
    const settings = deps.getSettings();
    const playback = video.playbackRate || 1;
    // Time is measured in video time, so a faster video leaves less real time.
    const available = (line.endMs - now) / playback;
    const rate = fitRate(text, available, settings.rate, settings.autoRate, deps.engine?.durationMs(text)) * playback;
    const u = make(text);
    u.lang = deps.lang;
    const voice = deps.getVoice();
    if (voice) u.voice = voice;
    u.rate = Math.min(4, Math.max(0.1, rate));
    u.volume = settings.volume / 100;
    const finished = () => { if (spoken === idx) talking = false; };
    u.onend = finished;
    u.onerror = finished;
    spoken = idx;
    talking = true;
    synth.speak(u);
    deps.onSpeak?.();
  }

  /** Ask for the audio of every translated line due in the next little while. */
  function prepareAhead(now: number, engine: PreparedEngine): void {
    const until = now + PREPARE_AHEAD_MS * Math.max(1, video.playbackRate || 1);
    for (let j = firstLineFrom(now, lines); j < lines.length && lines[j]!.startMs < until; j++) {
      const text = deps.getText(lines[j]!);
      if (text) engine.prepare(text);
    }
  }

  function readiness(): DubReadiness {
    const now = video.currentTime * 1000;
    const next = lines.slice(firstLineFrom(now, lines), firstLineFrom(now, lines) + READY_LINES);
    let translated = 0;
    let voiced = 0;
    for (const line of next) {
      const text = deps.getText(line);
      if (text === null) continue;
      translated++;
      if (!text || !deps.engine || deps.engine.ready(text)) voiced++;
    }
    return { total: next.length, translated, voiced, ready: voiced === next.length };
  }

  function stop(): void {
    video.removeEventListener('pause', interrupt);
    video.removeEventListener('seeking', interrupt);
    silence();
  }

  return { tick, stop, readiness };
}
