import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDubScheduler, estimateSpeechMs, fitRate, lineAt, mergeCues, GRACE_MS, MAX_AUTO_RATE,
  type DubLine,
} from './scheduler';
import { DEFAULT_DUB_SETTINGS, type DubSettings } from './settings';
import type { Cue } from '~/core/subtitles/types';

const cue = (id: number, startMs: number, endMs: number, text = 'hello'): Cue => ({ id, startMs, endMs, text });

describe('mergeCues', () => {
  it('joins short adjacent cues that are one sentence', () => {
    const lines = mergeCues([cue(0, 0, 1000, 'so what we'), cue(1, 1100, 2000, 'want is this.'), cue(2, 2100, 3000, 'Next')]);
    expect(lines).toEqual([
      { ids: [0, 1], startMs: 0, endMs: 2000 },
      { ids: [2], startMs: 2100, endMs: 3000 },
    ]);
  });

  it('keeps cues apart across a gap or when the line would grow too long', () => {
    expect(mergeCues([cue(0, 0, 1000, 'a'), cue(1, 2000, 3000, 'b')])).toHaveLength(2);
    expect(mergeCues([cue(0, 0, 4000, 'a'), cue(1, 4100, 8000, 'b')])).toHaveLength(2);
  });
});

describe('rate fitting', () => {
  it('ignores whitespace and Thai combining marks', () => {
    expect(estimateSpeechMs('ที่ นี่')).toBe(estimateSpeechMs('ทน'));
  });

  it('keeps the base rate when the line fits', () => {
    expect(fitRate('สวัสดี', 5000, 1, true)).toBe(1);
  });

  it('speeds up a long line, but no further than 1.5x', () => {
    const text = 'ก'.repeat(28); // ~2 s at rate 1
    expect(fitRate(text, 1600, 1, true)).toBeCloseTo(1.25);
    expect(fitRate(text, 500, 1, true)).toBe(MAX_AUTO_RATE);
    expect(fitRate(text, 0, 1, true)).toBe(MAX_AUTO_RATE);
  });

  it('leaves the rate alone when auto-rate is off, and never goes below a faster base', () => {
    expect(fitRate('ก'.repeat(100), 100, 1, false)).toBe(1);
    expect(fitRate('ก', 10_000, 1.4, true)).toBe(1.4);
  });
});

describe('lineAt', () => {
  const lines: DubLine[] = [{ ids: [0], startMs: 0, endMs: 1000 }, { ids: [1], startMs: 2000, endMs: 3000 }];
  it('finds the line under the playhead and nothing in a gap', () => {
    expect(lineAt(500, lines)).toBe(0);
    expect(lineAt(1500, lines)).toBe(-1);
    expect(lineAt(2999, lines)).toBe(1);
  });
});

/** A <video> stand-in: the scheduler only reads these fields and listens for events. */
function fakeVideo() {
  const v = new EventTarget() as EventTarget & Record<string, unknown>;
  Object.assign(v, { currentTime: 0, paused: false, seeking: false, playbackRate: 1 });
  return v as unknown as HTMLVideoElement & { currentTime: number; paused: boolean; seeking: boolean; playbackRate: number };
}

interface FakeUtterance { text: string; rate: number; volume: number; lang: string; voice: unknown; onend: (() => void) | null; onerror: (() => void) | null }

function setup(texts: Record<number, string | null>, settings: Partial<DubSettings> = {}) {
  const spoken: FakeUtterance[] = [];
  const synth = {
    speaking: false,
    speak: vi.fn((u: FakeUtterance) => { spoken.push(u); synth.speaking = true; }),
    cancel: vi.fn(() => { synth.speaking = false; }),
  };
  const video = fakeVideo();
  const lines: DubLine[] = [
    { ids: [0], startMs: 1000, endMs: 3000 },
    { ids: [1], startMs: 3000, endMs: 5000 },
    { ids: [2], startMs: 10_000, endMs: 12_000 },
  ];
  const onSpeak = vi.fn();
  const scheduler = createDubScheduler({
    synth: synth as unknown as SpeechSynthesis,
    video,
    lines,
    getText: (line) => texts[line.ids[0]!] ?? null,
    getSettings: () => ({ ...DEFAULT_DUB_SETTINGS, ...settings }),
    getVoice: () => null,
    lang: 'th-TH',
    onSpeak,
    createUtterance: (text) => ({ text, rate: 1, volume: 1, lang: '', voice: null, onend: null, onerror: null }) as unknown as SpeechSynthesisUtterance,
  });
  const at = (ms: number) => { video.currentTime = ms / 1000; scheduler.tick(); };
  return { synth, video, spoken, scheduler, at, onSpeak };
}

describe('createDubScheduler', () => {
  let s: ReturnType<typeof setup>;
  beforeEach(() => { s = setup({ 0: 'หนึ่ง', 1: 'สอง', 2: 'สาม' }); });

  it('says nothing in a gap and speaks a line once when the playhead enters it', () => {
    s.at(500);
    expect(s.spoken).toHaveLength(0);
    s.at(1000);
    s.at(1500);
    expect(s.spoken.map((u) => u.text)).toEqual(['หนึ่ง']);
    expect(s.spoken[0]!.lang).toBe('th-TH');
    expect(s.onSpeak).toHaveBeenCalledTimes(1);
  });

  it('waits for a translation still in flight, then speaks it while the line lasts', () => {
    const texts: Record<number, string | null> = { 0: null };
    const t = setup(texts);
    t.at(1000);
    expect(t.spoken).toHaveLength(0);
    texts[0] = 'มาแล้ว';
    t.at(2000);
    expect(t.spoken.map((u) => u.text)).toEqual(['มาแล้ว']);
  });

  it('lets the previous line finish within the grace period, then cuts it', () => {
    s.at(1000);
    s.at(3000 + GRACE_MS - 1);
    expect(s.spoken).toHaveLength(1);
    s.at(3000 + GRACE_MS);
    expect(s.synth.cancel).toHaveBeenCalled();
    expect(s.spoken.map((u) => u.text)).toEqual(['หนึ่ง', 'สอง']);
  });

  it('starts the next line at once when the previous one has finished', () => {
    s.at(1000);
    s.spoken[0]!.onend?.();
    s.synth.speaking = false;
    s.at(3000);
    expect(s.spoken).toHaveLength(2);
  });

  it('never goes back for a line whose moment has passed', () => {
    s.at(1000);
    s.at(10_000); // jumped past line 1 without seeking (e.g. a stall)
    expect(s.spoken.map((u) => u.text)).toEqual(['หนึ่ง', 'สาม']);
  });

  it('falls silent on pause and re-reads the current line on resume', () => {
    s.at(1000);
    s.video.paused = true;
    s.video.dispatchEvent(new Event('pause'));
    expect(s.synth.cancel).toHaveBeenCalled();
    s.at(1500);
    expect(s.spoken).toHaveLength(1);
    s.video.paused = false;
    s.at(1600);
    expect(s.spoken.map((u) => u.text)).toEqual(['หนึ่ง', 'หนึ่ง']);
  });

  it('after a seek speaks the line at the new position, not the old one', () => {
    s.at(1000);
    s.video.dispatchEvent(new Event('seeking'));
    s.at(10_500);
    expect(s.spoken.map((u) => u.text)).toEqual(['หนึ่ง', 'สาม']);
  });

  it('multiplies the rate by the video playback rate and applies the dub volume', () => {
    const t = setup({ 0: 'หนึ่ง' }, { rate: 1.2, volume: 50 });
    t.video.playbackRate = 2;
    t.at(1000);
    expect(t.spoken[0]!.rate).toBeCloseTo(2.4);
    expect(t.spoken[0]!.volume).toBe(0.5);
  });

  it('marks a line with an empty translation done instead of waiting on it', () => {
    const t = setup({ 0: '' });
    t.at(1000);
    t.at(1500);
    expect(t.spoken).toHaveLength(0);
  });

  it('stop() silences and detaches', () => {
    s.at(1000);
    s.scheduler.stop();
    expect(s.synth.cancel).toHaveBeenCalled();
    const calls = s.synth.cancel.mock.calls.length;
    s.video.dispatchEvent(new Event('pause'));
    expect(s.synth.cancel.mock.calls.length).toBe(calls);
  });
});

describe('createDubScheduler with a cloud voice', () => {
  it('fetches lines ahead, waits for audio, and fits the rate to the real clip length', () => {
    const ready = new Set<string>();
    const engine = {
      prepare: vi.fn(),
      ready: (t: string) => ready.has(t),
      durationMs: () => 3000,
    };
    const spoken: Array<{ text: string; rate: number }> = [];
    const synth = { speaking: false, speak: vi.fn((u: { text: string; rate: number }) => spoken.push(u)), cancel: vi.fn() };
    const video = fakeVideo();
    const scheduler = createDubScheduler({
      synth: synth as unknown as SpeechSynthesis,
      video,
      lines: [{ ids: [0], startMs: 1000, endMs: 3000 }, { ids: [1], startMs: 15_000, endMs: 16_000 }],
      getText: (l) => (l.ids[0] === 0 ? 'หนึ่ง' : 'สอง'),
      getSettings: () => DEFAULT_DUB_SETTINGS,
      getVoice: () => null,
      lang: 'th-TH',
      engine,
      createUtterance: (text) => ({ text, rate: 1 }) as unknown as SpeechSynthesisUtterance,
    });
    video.currentTime = 0;
    scheduler.tick();
    expect(engine.prepare.mock.calls.map((c) => c[0])).toEqual(['หนึ่ง', 'สอง']);
    video.currentTime = 1;
    scheduler.tick();
    expect(spoken).toHaveLength(0); // audio not here yet
    ready.add('หนึ่ง');
    scheduler.tick();
    expect(spoken[0]!.rate).toBe(MAX_AUTO_RATE); // 3 s of audio into 2 s, capped
  });
});
