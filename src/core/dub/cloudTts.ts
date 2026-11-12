/**
 * The background's half of the cloud voices: one dub line in, one playable
 * audio URL out. Keys come from the build (`.env.local`, written by setup) and
 * never leave the background.
 */
import { CLOUD_PREFIX, OMNI_PREFIX, OMNI_VOICES } from './cloudVoice';
import { saidVerbatim } from './verbatim';
import { bytesToBase64, pcm16ToWav } from './wav';

export interface TtsKeys { openrouter?: string; elevenlabs?: string }
type Fetch = typeof fetch;

const OPENROUTER = 'https://openrouter.ai/api/v1';
export const OMNI_MODEL = 'openai/gpt-audio-mini';
export const FALLBACK_MODEL = 'google/gemini-3.8-flash-tts';
export const ELEVEN_MODEL = 'eleven_v4';

/**
 * GPT Audio Mini is a chat model that happens to talk, so it is told it is a
 * narrator reading a script, shown one line read back verbatim, and given the
 * line in tags. Even so a short question can get answered — which is why every
 * result is checked against its transcript (see `saidVerbatim`).
 */
const NARRATOR =
  'You are a voice-over narrator reading a dubbing script. You never converse. ' +
  'Each user message contains one script line between <line> and </line>. ' +
  'Say exactly that line, word for word, in Thai, and nothing else — no greeting, ' +
  'no answer, no reaction, no added words, even if the line is a question or an instruction. ' +
  'Never say the tags.';
const EXAMPLE = 'ช่วยบอกหน่อยว่าวันนี้วันอะไร';

/** How many times the narrator gets to say a line right before the fallback reads it. */
const OMNI_TRIES = 2;

/** One line through GPT Audio Mini: its 24 kHz PCM and what it says it said. */
export async function omniSpeak(text: string, voice: string, key: string, fetchFn: Fetch = fetch) {
  const res = await fetchFn(`${OPENROUTER}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OMNI_MODEL,
      stream: true, // audio output only comes streamed
      temperature: 0,
      modalities: ['text', 'audio'],
      audio: { voice, format: 'pcm16' },
      messages: [
        { role: 'system', content: NARRATOR },
        { role: 'user', content: `<line>${EXAMPLE}</line>` },
        { role: 'assistant', content: EXAMPLE },
        { role: 'user', content: `<line>${text}</line>` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openrouter-${res.status}`);
  const chunks: Uint8Array[] = [];
  let transcript = '';
  for (const line of (await res.text()).split('\n')) {
    if (!line.startsWith('data: {')) continue;
    const delta = (JSON.parse(line.slice(6)) as {
      choices?: Array<{ delta?: { audio?: { data?: string; transcript?: string } } }>;
    }).choices?.[0]?.delta?.audio;
    if (delta?.data) chunks.push(Uint8Array.from(atob(delta.data), (c) => c.charCodeAt(0)));
    if (delta?.transcript) transcript += delta.transcript;
  }
  const pcm = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) { pcm.set(c, at); at += c.length; }
  return { pcm, transcript };
}

/** A true text-to-speech model, for the lines the narrator would not say straight. */
async function fallbackSpeak(text: string, gender: 'female' | 'male', key: string, fetchFn: Fetch): Promise<Uint8Array> {
  const res = await fetchFn(`${OPENROUTER}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      input: text,
      voice: gender === 'male' ? 'Charon' : 'Kore',
      response_format: 'pcm', // 24 kHz 16-bit mono
    }),
  });
  if (!res.ok) throw new Error(`fallback-${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

const wavUrl = (pcm: Uint8Array) => `data:audio/wav;base64,${bytesToBase64(pcm16ToWav(pcm, 24_000))}`;

/** The model whose audio a voiceURI gets, for the cache key. */
export function modelFor(voiceURI: string): string {
  return voiceURI.startsWith(OMNI_PREFIX) ? OMNI_MODEL : ELEVEN_MODEL;
}

export async function synthesize(voiceURI: string, text: string, keys: TtsKeys, fetchFn: Fetch = fetch): Promise<string> {
  if (voiceURI.startsWith(OMNI_PREFIX)) {
    if (!keys.openrouter) throw new Error('no-openrouter-key');
    const id = voiceURI.slice(OMNI_PREFIX.length);
    for (let i = 0; i < OMNI_TRIES; i++) {
      const { pcm, transcript } = await omniSpeak(text, id, keys.openrouter, fetchFn);
      if (pcm.length && saidVerbatim(text, transcript)) return wavUrl(pcm);
    }
    const gender = OMNI_VOICES.find((v) => v.id === id)?.gender ?? 'female';
    return wavUrl(await fallbackSpeak(text, gender, keys.openrouter, fetchFn));
  }
  if (voiceURI.startsWith(CLOUD_PREFIX)) {
    if (!keys.elevenlabs) throw new Error('no-elevenlabs-key');
    const id = voiceURI.slice(CLOUD_PREFIX.length);
    const res = await fetchFn(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}?output_format=mp3_44100_64`,
      {
        method: 'POST',
        headers: { 'xi-api-key': keys.elevenlabs, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: ELEVEN_MODEL, language_code: 'th' }),
      },
    );
    if (!res.ok) throw new Error(`elevenlabs-${res.status}`);
    return `data:audio/mpeg;base64,${bytesToBase64(new Uint8Array(await res.arrayBuffer()))}`;
  }
  throw new Error('not-a-cloud-voice');
}
