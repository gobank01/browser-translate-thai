import { describe, it, expect, vi } from 'vitest';
import { loadVoices, pickVoice, voicesFor } from './voice';

const voice = (name: string, lang: string, localService = true): SpeechSynthesisVoice =>
  ({ name, lang, localService, voiceURI: `uri:${name}`, default: false }) as SpeechSynthesisVoice;

const VOICES = [
  voice('Samantha', 'en-US'),
  voice('Google ไทย', 'th-TH', false),
  voice('Kanya', 'th-TH'),
  voice('Narisa', 'th_TH'),
];

describe('voicesFor', () => {
  it('keeps only voices for the language, whatever the separator', () => {
    expect(voicesFor(VOICES, 'th').map((v) => v.name)).toEqual(['Google ไทย', 'Kanya', 'Narisa']);
  });
});

describe('pickVoice', () => {
  it('prefers the chosen voice, then Kanya', () => {
    expect(pickVoice(VOICES, 'uri:Narisa')?.name).toBe('Narisa');
    expect(pickVoice(VOICES)?.name).toBe('Kanya');
    expect(pickVoice(VOICES, 'uri:gone')?.name).toBe('Kanya');
  });

  it('falls back to a local Thai voice, then any, then null', () => {
    expect(pickVoice([VOICES[1]!, VOICES[3]!])?.name).toBe('Narisa');
    expect(pickVoice([VOICES[1]!])?.name).toBe('Google ไทย');
    expect(pickVoice([VOICES[0]!])).toBeNull();
  });
});

describe('loadVoices', () => {
  it('answers at once when voices are already loaded', async () => {
    const synth = { getVoices: () => VOICES } as unknown as SpeechSynthesis;
    await expect(loadVoices(synth)).resolves.toBe(VOICES);
  });

  it('waits for voiceschanged when the list starts empty', async () => {
    let list: SpeechSynthesisVoice[] = [];
    const target = new EventTarget();
    const synth = Object.assign(target, { getVoices: () => list }) as unknown as SpeechSynthesis;
    const pending = loadVoices(synth, 10_000);
    list = VOICES;
    target.dispatchEvent(new Event('voiceschanged'));
    await expect(pending).resolves.toBe(VOICES);
  });

  it('gives up after the timeout', async () => {
    vi.useFakeTimers();
    const synth = Object.assign(new EventTarget(), { getVoices: () => [] }) as unknown as SpeechSynthesis;
    const pending = loadVoices(synth, 100);
    vi.advanceTimersByTime(100);
    await expect(pending).resolves.toEqual([]);
    vi.useRealTimers();
  });
});
