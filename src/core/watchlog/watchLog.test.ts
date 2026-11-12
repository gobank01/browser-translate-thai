import { describe, it, expect, vi, afterEach } from 'vitest';
import { WatchClock, buildRecord } from './watchLog';
import { startWatchTracker } from '~/entrypoints/content/watchTracker';
import type { VideoDetails } from '~/entrypoints/content/videoSubs/bridgeProtocol';

describe('WatchClock', () => {
  it('counts only time actually played', () => {
    const c = new WatchClock();
    c.sample(0, true);
    c.sample(1, true);
    c.sample(2, false); // paused: the step does not count
    c.sample(2, true);
    c.sample(300, true); // a seek, not playback
    c.sample(301, true);
    expect(c.watchedS).toBe(2);
    expect(c.reachedS).toBe(301);
  });
});

const DETAILS: VideoDetails = {
  videoId: 'abc123xyz00', title: 'T', author: 'C', channelId: 'UC', lengthSeconds: 600,
  keywords: ['k'], shortDescription: 'd',
};

describe('buildRecord', () => {
  it('describes the video and what was watched', () => {
    const clock = new WatchClock();
    clock.watchedS = 90.4;
    const r = buildRecord({ details: DETAILS, clock, dubbed: true, language: 'en', transcript: [], session: 's', now: new Date(0) });
    expect(r).toMatchObject({ videoId: 'abc123xyz00', url: 'https://www.youtube.com/watch?v=abc123xyz00', watchedS: 90, dubbed: true, language: 'en', session: 's' });
  });
});

describe('startWatchTracker', () => {
  afterEach(() => vi.useRealTimers());

  it('logs a video watched for over a minute when the page moves on, and skips a short one', async () => {
    vi.useFakeTimers();
    const video = Object.assign(new EventTarget(), { currentTime: 0, paused: false, seeking: false }) as unknown as HTMLVideoElement & { currentTime: number };
    let key = 'abc123xyz00';
    const send = vi.fn();
    const stop = startWatchTracker({
      findVideo: () => video,
      mediaKey: () => key,
      transcript: () => [{ startMs: 0, text: 'hi', translation: 'สวัสดี' }],
      isDubbing: () => true,
      fetchDetails: async () => ({ details: { ...DETAILS, videoId: key }, language: 'en' }),
      send,
    });
    for (let s = 1; s <= 70; s++) { video.currentTime = s; await vi.advanceTimersByTimeAsync(1000); }
    key = 'short000000';
    await vi.advanceTimersByTimeAsync(1000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]![0]).toMatchObject({ videoId: 'abc123xyz00', dubbed: true, transcript: [{ translation: 'สวัสดี' }] });
    expect(send.mock.calls[0]![0].watchedS).toBeGreaterThanOrEqual(60);
    for (let s = 1; s <= 10; s++) { video.currentTime = s; await vi.advanceTimersByTimeAsync(1000); }
    stop();
    expect(send).toHaveBeenCalledTimes(1); // ten seconds is not watching
  });
});
