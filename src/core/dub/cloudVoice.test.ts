import { describe, it, expect, vi } from 'vitest';
import { createCloudVoice, cloudVoiceId, orElevenVoices, parseVoices, CLOUD_PREFIX } from './cloudVoice';

function fakeAudio() {
  const a = Object.assign(new EventTarget(), {
    src: '', playbackRate: 1, volume: 1, preservesPitch: false, paused: true,
    play: vi.fn(async () => { a.paused = false; }),
    pause: vi.fn(() => { a.paused = true; }),
  });
  return a;
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const utterance = (text: string, rate = 1) =>
  ({ text, rate, volume: 0.8, onend: null }) as unknown as SpeechSynthesisUtterance;

describe('cloudVoiceId', () => {
  it('reads the voice id out of a cloud voiceURI only', () => {
    expect(cloudVoiceId(`${CLOUD_PREFIX}abc`)).toBe('el:abc');
    expect(cloudVoiceId('oa:marin')).toBe('oa:marin');
    expect(cloudVoiceId('com.apple.voice.Kanya')).toBeNull();
  });
});

describe('parseVoices', () => {
  it('reads the voices setup wrote, skipping junk', () => {
    expect(parseVoices('Anna:a1:female, Somchai:s2:male,bad')).toEqual([
      { name: 'Anna', id: 'a1', uri: 'el:a1', gender: 'female', provider: 'ElevenLabs (own key)' },
      { name: 'Somchai', id: 's2', uri: 'el:s2', gender: 'male', provider: 'ElevenLabs (own key)' },
    ]);
    expect(parseVoices(undefined)).toEqual([]);
  });
});

describe('orElevenVoices', () => {
  it('offers Anna and Somchai through OpenRouter unless setup picked others', () => {
    expect(orElevenVoices(undefined).map((v) => [v.uri, v.gender, v.provider])).toEqual([
      ['oe:brM9iIbwDREZaWL8luun', 'female', 'ElevenLabs'],
      ['oe:XLXcyPK1jTjw1pYLLcM9', 'male', 'ElevenLabs'],
    ]);
    expect(orElevenVoices('Mai:m1:female')[0]!.uri).toBe('oe:m1');
  });
});

describe('createCloudVoice', () => {
  it('fetches once per text, measures it, and is ready afterwards', async () => {
    const fetchAudio = vi.fn(async (t: string) => `data:${t}`);
    const { engine } = createCloudVoice({ fetchAudio, createAudio: fakeAudio as never, measure: async () => 1500 });
    engine.prepare('หนึ่ง');
    engine.prepare('หนึ่ง');
    expect(engine.ready('หนึ่ง')).toBe(false);
    await tick();
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    expect(engine.ready('หนึ่ง')).toBe(true);
    expect(engine.durationMs('หนึ่ง')).toBe(1500);
  });

  it('keeps at most four requests in flight', async () => {
    const resolvers: Array<() => void> = [];
    const fetchAudio = vi.fn(() => new Promise<string>((r) => resolvers.push(() => r('data:x'))));
    const { engine } = createCloudVoice({ fetchAudio, createAudio: fakeAudio as never, measure: async () => 1 });
    for (const t of ['a', 'b', 'c', 'd', 'e']) engine.prepare(t);
    expect(fetchAudio).toHaveBeenCalledTimes(4);
    resolvers[0]!();
    await tick();
    expect(fetchAudio).toHaveBeenCalledTimes(5);
  });

  it('plays a ready clip at the given rate with pitch kept, and reports the end', async () => {
    const audio = fakeAudio();
    const { synth, engine } = createCloudVoice({
      fetchAudio: async () => 'data:clip', createAudio: () => audio as never, measure: async () => 1000,
    });
    engine.prepare('สวัสดี');
    await tick();
    const u = utterance('สวัสดี', 1.3);
    const onend = vi.fn();
    u.onend = onend;
    synth.speak(u);
    expect(audio.src).toBe('data:clip');
    expect(audio.playbackRate).toBe(1.3);
    expect(audio.preservesPitch).toBe(true);
    expect(synth.speaking).toBe(true);
    audio.dispatchEvent(new Event('ended'));
    expect(onend).toHaveBeenCalled();
    expect(synth.speaking).toBe(false);
  });

  it('asks again after a failure, then treats the line as ready-to-skip; cancel stops playback', async () => {
    vi.useFakeTimers();
    const audio = fakeAudio();
    const fetchAudio = vi.fn(async () => { throw new Error('429'); });
    const { synth, engine } = createCloudVoice({ fetchAudio, createAudio: () => audio as never });
    engine.prepare('x');
    await vi.advanceTimersByTimeAsync(5000);
    vi.useRealTimers();
    expect(fetchAudio).toHaveBeenCalledTimes(3);
    expect(engine.ready('x')).toBe(true);
    const u = utterance('x');
    const onend = vi.fn();
    u.onend = onend;
    synth.speak(u);
    await tick();
    expect(onend).toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
    synth.cancel();
    expect(audio.pause).toHaveBeenCalled();
  });
});
