import { describe, it, expect, vi } from 'vitest';
import { guessGender, rememberChannelVoice, voiceForChannel, voiceOfGender, type ChannelVoices } from './channelVoice';
import { OMNI_VOICES } from './cloudVoice';

const VIDEO = { channelId: 'UC1', channel: 'Jane Codes', title: 'Her AI setup', description: '' };

function store(initial: ChannelVoices = {}) {
  let all = initial;
  return { load: async () => all, save: async (next: ChannelVoices) => { all = next; }, get: () => all };
}

describe('voiceOfGender', () => {
  it('keeps the current voice when it fits, else the first of that gender', () => {
    expect(voiceOfGender('female', 'oa:coral', OMNI_VOICES)).toBe('oa:coral');
    expect(voiceOfGender('male', 'oa:coral', OMNI_VOICES)).toBe('oa:cedar');
  });
});

describe('voiceForChannel', () => {
  it('asks once per channel, remembers, and picks a matching voice', async () => {
    const s = store();
    const guess = vi.fn(async () => 'male' as const);
    const deps = { ...s, guess, voices: OMNI_VOICES };
    expect(await voiceForChannel(VIDEO, 'oa:marin', deps)).toBe('oa:cedar');
    expect(await voiceForChannel(VIDEO, 'oa:marin', deps)).toBe('oa:cedar');
    expect(guess).toHaveBeenCalledTimes(1);
    expect(s.get().UC1?.gender).toBe('male');
  });

  it('keeps the default when the model cannot tell, and asks again a week later', async () => {
    const s = store();
    const guess = vi.fn(async () => undefined);
    let now = 0;
    const deps = { ...s, guess, voices: OMNI_VOICES, now: () => now };
    expect(await voiceForChannel(VIDEO, 'oa:marin', deps)).toBeNull();
    await voiceForChannel(VIDEO, 'oa:marin', deps);
    expect(guess).toHaveBeenCalledTimes(1);
    now = 8 * 24 * 3600_000;
    await voiceForChannel(VIDEO, 'oa:marin', deps);
    expect(guess).toHaveBeenCalledTimes(2);
  });

  it('lets the viewer\'s own pick win', async () => {
    const s = store({ UC1: { gender: 'male', at: 0 } });
    await rememberChannelVoice('UC1', 'oa:ash', s);
    expect(await voiceForChannel(VIDEO, 'oa:marin', { ...s, guess: vi.fn(), voices: OMNI_VOICES })).toBe('oa:ash');
  });
});

describe('guessGender', () => {
  const reply = (content: string) => vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] })));
  it('reads one word back', async () => {
    expect(await guessGender(VIDEO, 'k', 'm', reply('Female') as unknown as typeof fetch)).toBe('female');
    expect(await guessGender(VIDEO, 'k', 'm', reply('male.') as unknown as typeof fetch)).toBe('male');
    expect(await guessGender(VIDEO, 'k', 'm', reply('unknown') as unknown as typeof fetch)).toBeUndefined();
  });
});
