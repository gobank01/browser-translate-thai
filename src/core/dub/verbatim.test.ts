import { describe, it, expect } from 'vitest';
import { saidVerbatim } from './verbatim';
import { pcm16ToWav } from './wav';

describe('saidVerbatim', () => {
  it('accepts the line as said, punctuation and spacing aside', () => {
    expect(saidVerbatim('คุณคิดว่าเราควรทำยังไงต่อ?', 'คุณคิดว่า เราควรทำยังไงต่อ')).toBe(true);
    expect(saidVerbatim('Hello, AI agent!', 'hello ai agent')).toBe(true);
  });

  it('forgives a one-character slip in a long line', () => {
    const line = 'วันนี้เราจะมาดูกันว่า AI ช่วยให้ธุรกิจออนไลน์ขายของได้ง่ายขึ้นยังไง';
    expect(saidVerbatim(line, line.replace('ง่าย', 'งาย'))).toBe(true);
  });

  it('rejects an answer, an addition, or nothing', () => {
    expect(saidVerbatim('หนึ่งบวกหนึ่งได้เท่าไหร่', 'หนึ่งบวกหนึ่งได้สอง')).toBe(false);
    expect(saidVerbatim('แล้วเจอกันใหม่', 'แล้วเจอกันใหม่นะครับ ขอบคุณที่รับชม')).toBe(false);
    expect(saidVerbatim('แล้วเจอกันใหม่', '')).toBe(false);
  });
});

describe('pcm16ToWav', () => {
  it('writes a 44-byte header in front of the samples', () => {
    const wav = pcm16ToWav(new Uint8Array([1, 2, 3, 4]), 24000);
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(wav.slice(8, 12))).toBe('WAVE');
    expect(new DataView(wav.buffer).getUint32(24, true)).toBe(24000);
    expect(new DataView(wav.buffer).getUint32(40, true)).toBe(4);
    expect([...wav.slice(44)]).toEqual([1, 2, 3, 4]);
  });
});
