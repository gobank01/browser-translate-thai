import { isConfigError } from '~/messaging/client';
import type { Cue } from '~/core/subtitles/types';

// While the on-screen line is still untranslated, use a SMALL batch so it appears
// fast. Once caught up (buffering ahead of the playhead), use LARGE batches — far
// fewer requests means the per-batch system-prompt overhead is amortized and total
// throughput is much higher.
const FAST_SEGMENTS = 4;
const FAST_CHARS = 400;
const BULK_SEGMENTS = 15;
const BULK_CHARS = 1200;

// Only cues near the playhead are translated. On a long video this is the
// difference between paying for the whole track up front and paying for what is
// actually watched, and it is why the first subtitle appears in a second or two
// instead of after the entire transcript has been processed.
const LOOK_AHEAD_MS = 60_000;
const LOOK_BEHIND_MS = 5_000; // covers a short scrub backwards
const MAX_RATE = 4; // faster playback consumes the buffer faster, so widen it

export interface CueTranslatorDeps {
  translateBatchFn: (req: {
    type: 'translate:batch';
    requestId: string;
    segments: string[];
    targetLang: string;
    surface: 'subtitle';
  }) => Promise<string[]>;
  abortFn: (requestId: string) => void;
  getTargetLang: () => string;
  getCurrentTimeMs: () => number;
  /** Playback rate, used to widen the look-ahead when the video runs fast. */
  getPlaybackRate: () => number;
  onUpdate: () => void;
  /**
   * The surface cannot be translated as configured (a provider switched off, a
   * model removed). Retrying cannot help, so the translator stops and hands
   * the message over to be shown.
   */
  onConfigError?: (message: string) => void;
  /** Number of concurrent in-flight batches; the caller picks the value per engine
   *  (a free service fans out widest, cloud LLMs less, local least). */
  concurrency: number;
}

export interface CueTranslator {
  /** Load the track. Nothing is translated until the first pump(). */
  start: (cues: Cue[]) => void;
  /** Queue more cues for a track that arrives piece by piece (transcribed audio). */
  add: (cues: Cue[]) => void;
  /** Fill the window around the current playhead. Safe to call often. */
  pump: () => void;
  get: (cueId: number) => string | undefined;
  /** True once a cue has exhausted its attempts — the caller should stop
   *  promising a translation that is not coming. */
  isFailed: (cueId: number) => boolean;
  teardown: () => void;
}

/** One retry per cue. Enough to ride out a rate-limit or a dropped connection,
 *  few enough that a genuinely broken line can't occupy the pool. */
const MAX_ATTEMPTS = 2;

export function createCueTranslator(deps: CueTranslatorDeps): CueTranslator {
  const map = new Map<number, string>();
  const remaining = new Map<number, Cue>();
  const attempts = new Map<number, number>();
  const failed = new Set<number>();
  const inFlightIds = new Set<string>();
  let epoch = 0;
  let seq = 0;
  let active = 0;

  /** Untranslated, unclaimed cues inside the window around the playhead. */
  function windowCues(): { cues: Cue[]; now: number } {
    const now = deps.getCurrentTimeMs();
    const rate = Math.min(Math.max(deps.getPlaybackRate() || 1, 1), MAX_RATE);
    const from = now - LOOK_BEHIND_MS;
    const to = now + LOOK_AHEAD_MS * rate;
    const cues: Cue[] = [];
    for (const cue of remaining.values()) {
      if (cue.endMs >= from && cue.startMs <= to) cues.push(cue);
    }
    return { cues, now };
  }

  /**
   * Claim the next batch nearest the (live) playhead and remove it from the queue
   * so concurrent workers never pick the same cues. Small batch while the on-screen
   * line is still pending (fast first paint), large batch when buffering ahead.
   */
  function claimBatch(): Cue[] | null {
    const { cues, now } = windowCues();
    if (cues.length === 0) return null;

    cues.sort((a, b) => {
      const aAhead = a.endMs >= now;
      const bAhead = b.endMs >= now;
      if (aAhead !== bAhead) return aAhead ? -1 : 1; // upcoming cues first
      return aAhead ? a.startMs - b.startMs : b.startMs - a.startMs; // soonest / most-recent first
    });

    const currentPending = cues.some((c) => c.startMs <= now && now < c.endMs);
    const maxSeg = currentPending ? FAST_SEGMENTS : BULK_SEGMENTS;
    const maxChars = currentPending ? FAST_CHARS : BULK_CHARS;

    const batch: Cue[] = [];
    let chars = 0;
    for (const c of cues) {
      if (batch.length >= maxSeg) break;
      if (batch.length > 0 && chars + c.text.length > maxChars) break;
      batch.push(c);
      chars += c.text.length;
    }
    batch.forEach((c) => remaining.delete(c.id)); // claim
    return batch;
  }

  async function worker(myEpoch: number): Promise<void> {
    active++;
    try {
      for (let batch = claimBatch(); batch && myEpoch === epoch; batch = claimBatch()) {
        const requestId = `ytsub-${myEpoch}-${++seq}`;
        inFlightIds.add(requestId);
        try {
          const translations = await deps.translateBatchFn({
            type: 'translate:batch',
            requestId,
            segments: batch.map((c) => c.text),
            targetLang: deps.getTargetLang(),
            surface: 'subtitle',
          });
          if (myEpoch !== epoch) return; // torn down — drop stale result
          batch.forEach((c, j) => {
            const t = translations[j];
            if (t) map.set(c.id, t);
          });
          deps.onUpdate();
        } catch (e) {
          if (myEpoch !== epoch) return;
          if (isConfigError(e)) {
            epoch++;
            deps.onConfigError?.(e.message);
            return;
          }
          // A dropped request used to lose its cues for good, leaving those
          // lines stuck on the "translating…" placeholder for the rest of the
          // video. Give each one a second chance, then record it as failed so
          // the overlay can fall back to showing the original alone.
          for (const cue of batch) {
            const tries = (attempts.get(cue.id) ?? 0) + 1;
            attempts.set(cue.id, tries);
            if (tries < MAX_ATTEMPTS) remaining.set(cue.id, cue);
            else failed.add(cue.id);
          }
          deps.onUpdate();
          // Leave the pool. The next pump (timeupdate fires several times a
          // second) picks the requeued cues up, which spaces the retry out
          // instead of hammering a service that just refused us.
          return;
        } finally {
          inFlightIds.delete(requestId);
        }
      }
    } finally {
      active--;
    }
  }

  function start(cues: Cue[]): void {
    remaining.clear();
    for (const cue of cues) remaining.set(cue.id, cue);
  }

  function add(cues: Cue[]): void {
    for (const cue of cues) if (!map.has(cue.id)) remaining.set(cue.id, cue);
  }

  function pump(): void {
    if (remaining.size === 0) return;
    const myEpoch = epoch;
    const limit = Math.max(1, deps.concurrency);
    // Each worker claims synchronously before its first await, so the loop sees
    // the shrinking queue and can't over-spawn.
    while (active < limit && windowCues().cues.length > 0) {
      void worker(myEpoch);
    }
  }

  function teardown(): void {
    epoch++;
    for (const id of inFlightIds) deps.abortFn(id);
    inFlightIds.clear();
    remaining.clear();
    attempts.clear();
    failed.clear();
    map.clear();
  }

  return { start, add, pump, get: (id) => map.get(id), isFailed: (id) => failed.has(id), teardown };
}
