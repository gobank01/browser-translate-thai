import { describe, it, expect } from 'vitest';
import { createDucker } from './ducking';
import { DEFAULT_DUB_SETTINGS, clampDubRate, normalizeDubSettings } from './settings';

describe('createDucker', () => {
  it('turns the video down relative to its own volume and restores it exactly', () => {
    const video = { volume: 0.8 } as HTMLMediaElement;
    const d = createDucker(video);
    d.duck(10);
    expect(video.volume).toBeCloseTo(0.08);
    d.duck(30); // re-ducking measures from the original, not the ducked level
    expect(video.volume).toBeCloseTo(0.24);
    expect(d.isDucked()).toBe(true);
    d.restore();
    expect(video.volume).toBe(0.8);
    expect(d.isDucked()).toBe(false);
  });

  it('mutes at 0% and does nothing on restore when never ducked', () => {
    const video = { volume: 0.5 } as HTMLMediaElement;
    const d = createDucker(video);
    d.restore();
    expect(video.volume).toBe(0.5);
    d.duck(0);
    expect(video.volume).toBe(0);
  });
});

describe('normalizeDubSettings', () => {
  it('fills defaults for a store that has none', () => {
    expect(normalizeDubSettings(undefined)).toEqual(DEFAULT_DUB_SETTINGS);
  });

  it('returns its input when nothing needs repair', () => {
    const ok = { ...DEFAULT_DUB_SETTINGS, rate: 1.2 };
    expect(normalizeDubSettings(ok)).toBe(ok);
  });

  it('clamps out-of-range numbers and replaces wrong types', () => {
    expect(normalizeDubSettings({ ...DEFAULT_DUB_SETTINGS, rate: 9, duckVolume: -5, enabled: 'yes' }))
      .toEqual({ ...DEFAULT_DUB_SETTINGS, rate: 1.5, duckVolume: 0 });
    expect(clampDubRate(0.333)).toBe(0.8);
    expect(clampDubRate(1.234)).toBe(1.23);
  });
});
