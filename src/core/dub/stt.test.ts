import { describe, expect, it } from 'vitest';
import { isThaiCode, wordsToCues } from './stt';

const w = (text: string, start: number, end: number) => [{ text, start, end, type: 'word' }, { text: ' ', start: end, end, type: 'spacing' }];

describe('wordsToCues', () => {
  it('splits on sentence stops and pauses, offset to video time', () => {
    const words = [...w('Hello', 0, 0.4), ...w('world.', 0.5, 0.9), ...w('Next', 1, 1.3), ...w('one', 3, 3.3)];
    const cues = wordsToCues(words, 60, 100);
    expect(cues.map((c) => c.text)).toEqual(['Hello world.', 'Next', 'one']);
    expect(cues[0]).toMatchObject({ id: 100, startMs: 60000, endMs: 60900 });
  });
  it('caps a line at eight seconds', () => {
    const words = Array.from({ length: 20 }, (_, i) => w(`w${i}`, i * 0.5, i * 0.5 + 0.4)).flat();
    expect(wordsToCues(words, 0, 0).length).toBe(2);
  });
  it('knows Thai', () => {
    expect(isThaiCode('tha')).toBe(true);
    expect(isThaiCode('eng')).toBe(false);
  });
});
