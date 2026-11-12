/**
 * The personal watch log: which videos were watched, for how long, and what
 * was said in them (with the Thai translation the dub already paid for).
 *
 * The record leaves the browser only for a native host on this machine, which
 * writes it into a folder of notes — see `watchlog/`. Personal
 * builds only (`WXT_WATCHLOG` in .env.local).
 */
import type { VideoDetails } from '~/entrypoints/content/videoSubs/bridgeProtocol';

export interface TranscriptLine { startMs: number; text: string; translation?: string }

export interface WatchRecord {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  channelId: string;
  durationS: number;
  /** Seconds of the video actually played (not wall time). */
  watchedS: number;
  /** Furthest point reached, in seconds. */
  reachedS: number;
  dubbed: boolean;
  language?: string;
  keywords: string[];
  description: string;
  /** ISO time of this flush. */
  at: string;
  /** ISO time this sitting with the video began; repeated flushes share it. */
  session: string;
  transcript: TranscriptLine[];
}

/** Less than this is browsing, not watching. */
export const MIN_WATCH_S = 60;
/** A jump bigger than this between two time updates is a seek, not playback. */
const MAX_STEP_S = 3;

/** Counts seconds actually played from a stream of currentTime samples. */
export class WatchClock {
  watchedS = 0;
  reachedS = 0;
  private last: number | null = null;

  sample(currentTime: number, playing: boolean): void {
    const prev = this.last;
    this.last = currentTime;
    this.reachedS = Math.max(this.reachedS, currentTime);
    if (!playing || prev === null) return;
    const step = currentTime - prev;
    if (step > 0 && step <= MAX_STEP_S) this.watchedS += step;
  }

  /** After a seek the next sample starts a new run. */
  break(): void { this.last = null; }
}

export function buildRecord(input: {
  details: VideoDetails;
  clock: WatchClock;
  dubbed: boolean;
  language?: string;
  transcript: TranscriptLine[];
  session: string;
  now?: Date;
}): WatchRecord {
  const { details, clock } = input;
  return {
    videoId: details.videoId,
    url: `https://www.youtube.com/watch?v=${details.videoId}`,
    title: details.title,
    channel: details.author,
    channelId: details.channelId,
    durationS: details.lengthSeconds,
    watchedS: Math.round(clock.watchedS),
    reachedS: Math.round(clock.reachedS),
    dubbed: input.dubbed,
    ...(input.language && { language: input.language }),
    keywords: details.keywords,
    description: details.shortDescription,
    at: (input.now ?? new Date()).toISOString(),
    session: input.session,
    transcript: input.transcript,
  };
}
