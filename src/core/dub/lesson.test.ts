import { describe, it, expect, vi } from 'vitest';
import { makeLesson, parseLesson, transcriptForPrompt } from './lesson';

describe('transcriptForPrompt', () => {
  it('stamps each line with its time and skips empty ones', () => {
    expect(transcriptForPrompt([{ startMs: 65_000, text: 'สวัสดี' }, { startMs: 70_000, text: ' ' }])).toBe('[1:05] สวัสดี');
  });

  it('keeps the latest part when the sitting is long', () => {
    const lines = Array.from({ length: 3000 }, (_, i) => ({ startMs: i * 1000, text: 'ข้อความยาวพอสมควร' }));
    const out = transcriptForPrompt(lines);
    expect(out.length).toBeLessThanOrEqual(24_000);
    expect(out.endsWith('[49:59] ข้อความยาวพอสมควร')).toBe(true);
  });
});

describe('parseLesson', () => {
  it('reads the summary, timed points and terms', () => {
    const lesson = parseLesson('```json\n{"summary":"สรุป","points":[{"time":"1:05","text":"จุดแรก"},{"time":"1:02:03","text":"จุดสอง"},{"text":""}],"terms":[{"term":"agent","meaning":"ตัวแทน"},{"term":"x"}]}\n```');
    expect(lesson).toEqual({
      summary: 'สรุป',
      points: [{ atMs: 65_000, text: 'จุดแรก' }, { atMs: 3_723_000, text: 'จุดสอง' }],
      terms: [{ term: 'agent', meaning: 'ตัวแทน' }],
    });
  });
});

describe('makeLesson', () => {
  it('asks once and returns the parsed lesson', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: '{"summary":"ได้เรียนเรื่อง LLM","points":[{"time":"0:10","text":"LLM คือไฟล์สองไฟล์"}],"terms":[]}' } }],
    })));
    const lesson = await makeLesson('Intro', [{ startMs: 10_000, text: 'LLM คือไฟล์สองไฟล์' }], 'k', 'm', f as unknown as typeof fetch);
    expect(lesson.points[0]).toEqual({ atMs: 10_000, text: 'LLM คือไฟล์สองไฟล์' });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
