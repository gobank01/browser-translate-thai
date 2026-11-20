import { describe, it, expect } from 'vitest';
import { isMusicVideo } from './music';

const v = (title: string, author = 'Someone', extra: Partial<{ category: string; keywords: string[] }> = {}) => ({ title, author, ...extra });

describe('isMusicVideo', () => {
  it('spots music videos', () => {
    expect(isMusicVideo(v('สำคัญแต่สำรอง - Miteennn l Official MV', 'Home Run Music'))).toBe(true);
    expect(isMusicVideo(v('Blinding Lights (Official Video)', 'The Weeknd'))).toBe(true);
    expect(isMusicVideo(v('Song', 'Artist - Topic'))).toBe(true);
    expect(isMusicVideo(v('anything', 'x', { category: 'Music' }))).toBe(true);
    expect(isMusicVideo(v('ใจ', 'GMM Music', { keywords: ['เพลงใหม่'] }))).toBe(true);
  });

  it('leaves talks and lessons alone, even about music', () => {
    expect(isMusicVideo(v('[1hr Talk] Intro to Large Language Models', 'Andrej Karpathy'))).toBe(false);
    expect(isMusicVideo(v('How music theory works', 'Music Matters', { keywords: ['theory'] }))).toBe(false);
  });
});
