import type { SpeechEngine } from './scheduler';

/**
 * Voices that live in the cloud, behind the same shape as the browser's
 * speechSynthesis so the scheduler drives either one:
 *
 *   oa:<voice>   GPT Audio Mini through OpenRouter — the default, about 1 baht
 *                for a 10-minute video (needs WXT_OPENROUTER_KEY)
 *   el:<id>      ElevenLabs — premium voices (needs WXT_ELEVENLABS_KEY)
 *
 * Audio is fetched ahead of the playhead (`prepare`), kept by text, and played
 * through an <audio> element whose playbackRate does the auto-rate — with the
 * real clip length known, the rate fits exactly instead of by estimate.
 */

/** voiceURI prefix of an ElevenLabs voice. */
export const CLOUD_PREFIX = 'el:';
/** voiceURI prefix of a GPT Audio Mini voice. */
export const OMNI_PREFIX = 'oa:';

export interface CloudVoiceInfo {
  /** Provider's id for the voice. */
  id: string;
  /** What goes in `DubSettings.voiceURI`. */
  uri: string;
  name: string;
  gender: 'female' | 'male';
  provider: 'GPT' | 'ElevenLabs';
}

/** GPT Audio Mini voices that read Thai well, picked by ear. */
export const OMNI_VOICES: readonly CloudVoiceInfo[] = (
  [['marin', 'Marin', 'female'], ['coral', 'Coral', 'female'], ['cedar', 'Cedar', 'male'], ['ash', 'Ash', 'male']] as const
).map(([id, name, gender]) => ({ id, uri: OMNI_PREFIX + id, name, gender, provider: 'GPT' as const }));

/**
 * ElevenLabs voices from `WXT_DUB_VOICES` ("Name:voiceId:female,Name:voiceId:male",
 * written by the setup wizard from the voices on your own account — voice ids
 * belong to an account, so there is no built-in list).
 */
export function parseVoices(raw: string | undefined): CloudVoiceInfo[] {
  return (raw ?? '').split(',').flatMap((item) => {
    const [name, id, gender] = item.split(':').map((p) => p.trim());
    return name && id
      ? [{ id, uri: CLOUD_PREFIX + id, name, gender: gender === 'male' ? 'male' as const : 'female' as const, provider: 'ElevenLabs' as const }]
      : [];
  });
}

/** Every cloud voice this build can reach, GPT first. */
export const CLOUD_VOICES: readonly CloudVoiceInfo[] = [
  ...(import.meta.env.WXT_OPENROUTER_KEY ? OMNI_VOICES : []),
  ...(import.meta.env.WXT_ELEVENLABS_KEY ? parseVoices(import.meta.env.WXT_DUB_VOICES) : []),
];

/** Whether this build has any cloud voice. */
export const CLOUD_TTS = CLOUD_VOICES.length > 0;

/** The voiceURI itself when it names a cloud voice, else null (a system voice). */
export function cloudVoiceId(voiceURI: string): string | null {
  return voiceURI.startsWith(CLOUD_PREFIX) || voiceURI.startsWith(OMNI_PREFIX) ? voiceURI : null;
}

/** The voices from the same provider as `voiceURI` — what a quick switch offers. */
export function sameProviderVoices(voiceURI: string, voices = CLOUD_VOICES): readonly CloudVoiceInfo[] {
  const current = voices.find((v) => v.uri === voiceURI);
  return current ? voices.filter((v) => v.provider === current.provider) : voices.filter((v) => v.provider === voices[0]?.provider);
}

/** Hooks the scheduler uses when audio has to be fetched before it can play. */
export interface PreparedEngine {
  prepare: (text: string) => void;
  /** True once the line can start at once (or has failed and should be skipped). */
  ready: (text: string) => boolean;
  /** Real length at rate 1, once known. */
  durationMs: (text: string) => number | undefined;
}

interface Clip { status: 'loading' | 'ready' | 'failed'; url?: string; durationMs?: number }

/** Requests in flight at once: enough to stay ahead, few enough for the API's limits. */
const MAX_IN_FLIGHT = 4;
/** Clips kept, oldest dropped first (~50 KB each). */
const MAX_CLIPS = 400;

export interface CloudVoiceDeps {
  /** Text → playable URL (a data: URL from the background). */
  fetchAudio: (text: string) => Promise<string>;
  /** Overridable for tests. */
  createAudio?: () => HTMLAudioElement;
  /** Clip length in ms; overridable for tests. */
  measure?: (url: string) => Promise<number>;
}

function measureWithAudio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration * 1000 : 0);
    a.onerror = () => resolve(0);
    a.src = url;
  });
}

export function createCloudVoice(deps: CloudVoiceDeps): {
  synth: SpeechEngine;
  engine: PreparedEngine;
  /** Change the volume of the line playing now, 0–1. */
  setVolume: (v: number) => void;
} {
  const clips = new Map<string, Clip>();
  const waiting: string[] = [];
  let inFlight = 0;
  const audio = (deps.createAudio ?? (() => new Audio()))();
  const measure = deps.measure ?? measureWithAudio;
  let current: SpeechSynthesisUtterance | null = null;

  function pump(): void {
    while (inFlight < MAX_IN_FLIGHT && waiting.length) {
      const text = waiting.shift()!;
      const clip = clips.get(text)!;
      inFlight++;
      deps.fetchAudio(text)
        .then(async (url) => {
          clip.url = url;
          clip.durationMs = (await measure(url)) || undefined;
          clip.status = 'ready';
        })
        .catch(() => { clip.status = 'failed'; })
        .finally(() => { inFlight--; pump(); });
    }
  }

  const engine: PreparedEngine = {
    prepare(text) {
      if (!text || clips.has(text)) return;
      clips.set(text, { status: 'loading' });
      if (clips.size > MAX_CLIPS) clips.delete(clips.keys().next().value!);
      waiting.push(text);
      pump();
    },
    ready: (text) => clips.get(text)?.status !== 'loading' && clips.has(text),
    durationMs: (text) => clips.get(text)?.durationMs,
  };

  function finish(): void {
    const u = current;
    current = null;
    u?.onend?.(new Event('end') as SpeechSynthesisEvent);
  }
  audio.addEventListener('ended', finish);

  const synth = {
    get speaking() { return current !== null; },
    speak(u: SpeechSynthesisUtterance) {
      const clip = clips.get(u.text);
      if (clip?.status !== 'ready' || !clip.url) {
        engine.prepare(u.text);
        current = u;
        queueMicrotask(finish); // nothing to play: done at once, the line is skipped
        return;
      }
      current = u;
      audio.src = clip.url;
      audio.playbackRate = u.rate;
      audio.preservesPitch = true;
      audio.volume = Math.min(1, Math.max(0, u.volume));
      void audio.play().catch(finish);
    },
    cancel() {
      audio.pause();
      current = null;
    },
  } as SpeechEngine;

  return { synth, engine, setVolume: (v) => { audio.volume = Math.min(1, Math.max(0, v)); } };
}
