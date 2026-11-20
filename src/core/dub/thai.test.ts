import { describe, it, expect } from 'vitest';
import { mostlyThai, thaiShare } from './thai';

describe('Thai detection', () => {
  it('measures Thai script among letters', () => {
    expect(thaiShare('AI พากย์เสียง ฟรี 2026')).toBeGreaterThan(0.5);
    expect(thaiShare('How to build an AI agent')).toBe(0);
    expect(thaiShare('123 !!')).toBe(0);
  });

  it('calls Thai captions Thai and English captions not', () => {
    expect(mostlyThai([{ text: 'สวัสดีครับ วันนี้' }, { text: 'เรามาดู AI กัน' }])).toBe(true);
    expect(mostlyThai([{ text: 'hello there' }, { text: 'สวัสดี' }])).toBe(false);
  });
});
