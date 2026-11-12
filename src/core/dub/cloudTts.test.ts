import { describe, it, expect, vi } from 'vitest';
import { synthesize, OMNI_MODEL, FALLBACK_MODEL } from './cloudTts';

const b64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));

/** An OpenRouter stream in which the narrator says `said`. */
function omniStream(said: string) {
  const events = [
    { choices: [{ delta: { audio: { data: b64([1, 2]), transcript: said.slice(0, 3) } } }] },
    { choices: [{ delta: { audio: { data: b64([3, 4]), transcript: said.slice(3) } } }] },
  ];
  return new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('') + 'data: [DONE]\n');
}

function fakeFetch(saidEachTime: string[]) {
  const said = [...saidEachTime];
  return vi.fn(async (url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    if (String(url).endsWith('/chat/completions')) {
      expect(body.model).toBe(OMNI_MODEL);
      return omniStream(said.shift() ?? '');
    }
    expect(body.model).toBe(FALLBACK_MODEL);
    return new Response(new Uint8Array([9, 9]));
  });
}

const wavSamples = (url: string) => [...Uint8Array.from(atob(url.split(',')[1]!), (c) => c.charCodeAt(0)).slice(44)];

describe('synthesize with GPT Audio Mini', () => {
  it('returns the narrator\'s audio as WAV when it read the line as written', async () => {
    const f = fakeFetch(['สวัสดีครับ']);
    const url = await synthesize('oa:marin', 'สวัสดีครับ', { openrouter: 'k' }, f as unknown as typeof fetch);
    expect(url.startsWith('data:audio/wav;base64,')).toBe(true);
    expect(wavSamples(url)).toEqual([1, 2, 3, 4]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('asks again when it ad-libs, and falls back to a true TTS when it keeps doing so', async () => {
    const f = fakeFetch(['หนึ่งบวกหนึ่งได้สอง', 'หนึ่งบวกหนึ่งได้สองครับ']);
    const url = await synthesize('oa:cedar', 'หนึ่งบวกหนึ่งได้เท่าไหร่', { openrouter: 'k' }, f as unknown as typeof fetch);
    expect(f).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(f.mock.calls[2]![1]?.body)).voice).toBe('Charon'); // male stays male
    expect(wavSamples(url)).toEqual([9, 9]);
  });

  it('accepts a right second try', async () => {
    const f = fakeFetch(['ได้เลยครับ แล้วเจอกันใหม่', 'แล้วเจอกันใหม่']);
    await synthesize('oa:marin', 'แล้วเจอกันใหม่', { openrouter: 'k' }, f as unknown as typeof fetch);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('needs the key', async () => {
    await expect(synthesize('oa:marin', 'x', {})).rejects.toThrow('no-openrouter-key');
  });
});
