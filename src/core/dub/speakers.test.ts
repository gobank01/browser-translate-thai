import { describe, it, expect, vi } from 'vitest';
import { labelSpeakers, parseSpeakerLabels } from './speakers';

describe('parseSpeakerLabels', () => {
  it('reads speakers with their gender and a label per line', () => {
    expect(parseSpeakerLabels('{"speakers":{"Lex":"male","Jane":"Female","A":"?"},"lines":[{"id":1,"speaker":"Lex"},{"id":"2","speaker":"Jane"},{"id":3}]}'))
      .toEqual({ speakers: { Lex: 'male', Jane: 'female', A: 'unknown' }, lines: { 1: 'Lex', 2: 'Jane' } });
  });
});

describe('labelSpeakers', () => {
  it('sends the lines with turn markers and known speakers, once', async () => {
    const f = vi.fn(async (_u: string, init?: RequestInit) => {
      const user = JSON.parse(String(init?.body)).messages[1].content as string;
      expect(user).toContain('Speakers known so far: {"Lex":"male"}');
      expect(user).toContain('7\t>> so tell me about your work');
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"speakers":{"Lex":"male","Jane":"female"},"lines":[{"id":7,"speaker":"Lex"}]}' } }] }));
    });
    const out = await labelSpeakers({ title: 'Lex with Jane', description: '' },
      [{ id: 7, text: '>> so tell me about your work' }], { Lex: 'male' }, 'k', 'm', f as unknown as typeof fetch);
    expect(out.lines[7]).toBe('Lex');
    expect(f).toHaveBeenCalledTimes(1);
  });
});
