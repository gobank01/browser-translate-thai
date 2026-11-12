import { buildRecord, MIN_WATCH_S, WatchClock, type TranscriptLine, type WatchRecord } from '~/core/watchlog/watchLog';
import type { VideoDetails } from './videoSubs/bridgeProtocol';

/**
 * Watches the YouTube player and hands a WatchRecord to `send` for every video
 * played for at least a minute: when the page moves on, when it closes, and
 * every couple of minutes in between so a crash loses little.
 */
export interface WatchTrackerDeps {
  findVideo: () => HTMLVideoElement | null;
  /** The video id; empty when the page is not a video. */
  mediaKey: () => string;
  /** What the subtitle translator has for this video right now. */
  transcript: () => TranscriptLine[];
  isDubbing: () => boolean;
  fetchDetails: () => Promise<{ details?: VideoDetails; language?: string }>;
  send: (record: WatchRecord) => void;
}

const SAMPLE_MS = 1000;
const FLUSH_EVERY_MS = 120_000;
const DETAILS_RETRY_MS = 3000;

export function startWatchTracker(deps: WatchTrackerDeps): () => void {
  let key = '';
  let clock = new WatchClock();
  let dubbed = false;
  let lines: TranscriptLine[] = [];
  let meta: { details?: VideoDetails; language?: string } | null = null;
  let lastFlush = Date.now();
  let asking = false;
  let lastAsk = 0;
  let session = '';
  let video: HTMLVideoElement | null = null;
  const onSeek = () => clock.break();

  function flush(): void {
    if (!key || !meta?.details || meta.details.videoId !== key || clock.watchedS < MIN_WATCH_S) return;
    deps.send(buildRecord({ details: meta.details, clock, dubbed, language: meta.language, transcript: lines, session }));
    lastFlush = Date.now();
  }

  function sample(): void {
    const nextKey = deps.mediaKey();
    if (nextKey !== key) {
      flush();
      key = nextKey;
      clock = new WatchClock();
      dubbed = false;
      lines = [];
      meta = null;
      lastAsk = 0;
      session = new Date().toISOString();
    }
    if (!key) return;
    // Right after a navigation the player can still describe the previous
    // video, so keep asking until it names this one.
    if (meta?.details?.videoId !== key && !asking && Date.now() - lastAsk > DETAILS_RETRY_MS) {
      const forKey = key;
      asking = true;
      lastAsk = Date.now();
      void deps.fetchDetails()
        .then((m) => { if (key === forKey) meta = m; })
        .catch(() => {})
        .finally(() => { asking = false; });
    }
    const v = deps.findVideo();
    if (v !== video) {
      video?.removeEventListener('seeking', onSeek);
      v?.addEventListener('seeking', onSeek);
      video = v;
    }
    if (v) clock.sample(v.currentTime, !v.paused && !v.seeking);
    dubbed ||= deps.isDubbing();
    // Keep the last transcript seen: turning subtitles off clears the live one.
    const now = deps.transcript();
    if (now.length) lines = now;
    if (Date.now() - lastFlush >= FLUSH_EVERY_MS) flush();
  }

  const timer = setInterval(sample, SAMPLE_MS);
  const onHide = () => flush();
  window.addEventListener('pagehide', onHide);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    window.removeEventListener('pagehide', onHide);
    video?.removeEventListener('seeking', onSeek);
    flush();
  };
}
