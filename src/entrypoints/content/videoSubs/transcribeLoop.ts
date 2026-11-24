import type { Cue } from '~/core/subtitles/types';
import { wordsToCues, type SttResult } from '~/core/dub/stt';
import { requestTap, type TapResponse } from './tapProtocol';

/**
 * Captions for a video that has none: the audio the player has already
 * downloaded is sent off in chunks, a minute ahead of the playhead, and comes
 * back as cues. Only what is about to be watched is transcribed, so a video
 * left halfway costs half.
 */
export interface TranscribeLoopDeps {
  video: HTMLVideoElement;
  transcribe: (audio: ArrayBuffer, mime: string) => Promise<SttResult>;
  onCues: (cues: Cue[]) => void;
  /** The language of the first chunk; return false to stop (a Thai video). */
  onLanguage: (code: string) => boolean;
  /** Overridable for tests. */
  tap?: (req: { src: string; from: number; to: number }) => Promise<TapResponse | null>;
  intervalMs?: number;
}

export interface TranscribeLoop {
  stop: () => void;
  /** At least one chunk is back. */
  started: () => boolean;
  /** The audio at `t` (seconds) has been transcribed or is not coming. */
  covers: (t: number) => boolean;
  /** Nothing could be tapped from this player (no MSE audio, or not yet). */
  failed: () => boolean;
}

const AHEAD_S = 60;
const FIRST_CHUNK_S = 15;
const CHUNK_S = 30;
/** Wait for at least this much buffered audio before sending a chunk. */
const MIN_CHUNK_S = 8;
/** Give up when the tap has had nothing for this player for this long. */
const NO_AUDIO_GIVE_UP_MS = 15_000;
const MAX_ERRORS = 3;

export function startTranscribeLoop(deps: TranscribeLoopDeps): TranscribeLoop {
  const { video } = deps;
  const tap = deps.tap ?? ((req) => requestTap(req));
  const covered: Array<[number, number]> = [];
  let busy = false;
  let stopped = false;
  let chunks = 0;
  let errors = 0;
  let nextId = 0;
  let firstTry = 0;
  let shortEnd = -1;
  let shortSeen = 0;

  const covers = (t: number) => covered.some(([s, e]) => s <= t + 0.05 && t < e);
  /** The first moment at or after `t` that is not transcribed yet. */
  function gapFrom(t: number): number {
    let g = t;
    for (let moved = true; moved;) {
      moved = false;
      for (const [s, e] of covered) if (s <= g + 0.05 && g < e) { g = e; moved = true; }
    }
    return g;
  }

  async function step(): Promise<void> {
    if (busy || stopped) return;
    const now = video.currentTime;
    const end = Number.isFinite(video.duration) ? video.duration : Infinity;
    const gap = gapFrom(now);
    if (gap >= Math.min(now + AHEAD_S, end - 0.5)) return;
    busy = true;
    try {
      const r = await tap({ src: video.currentSrc, from: gap, to: gap + (chunks ? CHUNK_S : FIRST_CHUNK_S) });
      if (stopped) return;
      if (!r?.ok || !r.bytes || r.start === undefined || r.end === undefined) {
        firstTry ||= Date.now();
        return;
      }
      firstTry = 0;
      // Nothing new past what is done: never pay for the same audio twice.
      if (r.end <= gap + 0.1) return;
      // Not enough buffered yet: wait for the player to fetch more — unless the
      // playhead is nearly there, or this piece stops short for good (the
      // player switched quality, and the rest comes as a new stream).
      if (r.end - gap < MIN_CHUNK_S && r.end < end - 1 && now < r.end - 4) {
        shortSeen = shortEnd === r.end ? shortSeen + 1 : 1;
        shortEnd = r.end;
        if (shortSeen < 3) return;
      }
      const res = await deps.transcribe(r.bytes, r.mime ?? 'audio/mp4');
      if (stopped) return;
      if (!chunks && !deps.onLanguage(res.language)) { stop(); return; }
      chunks++;
      errors = 0;
      // A chunk that starts inside one already done would repeat its words.
      const fromS = covered.some(([, e]) => Math.abs(e - gap) < 0.05) ? gap - 0.3 : -Infinity;
      const words = res.words.filter((w) => w.start + r.start! >= fromS);
      covered.push([Math.min(gap, r.start), r.end]);
      const cues = wordsToCues(words, r.start, nextId);
      nextId += cues.length;
      if (cues.length) deps.onCues(cues);
    } catch (e) {
      console.warn('[BrowserTranslate] transcription failed:', e);
      if (++errors >= MAX_ERRORS) stop();
    } finally {
      busy = false;
    }
  }

  const timer = setInterval(() => { void step(); }, deps.intervalMs ?? 1000);
  void step();
  function stop(): void {
    stopped = true;
    clearInterval(timer);
  }
  return {
    stop,
    started: () => chunks > 0,
    covers: (t) => stopped || covers(t) || t >= (Number.isFinite(video.duration) ? video.duration - 0.5 : Infinity),
    failed: () => stopped && !chunks || (!chunks && firstTry > 0 && Date.now() - firstTry > NO_AUDIO_GIVE_UP_MS),
  };
}
