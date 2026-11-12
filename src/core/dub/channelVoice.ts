/**
 * A dub voice that matches the speaker: a woman's channel gets a female voice,
 * a man's a male one. Decided once per channel from what YouTube says about
 * it (name, title, description) — a model usually knows the creator, and
 * otherwise reads the cues — then remembered. A voice the viewer picks on the
 * video overrides it for that channel for good.
 *
 * Runs in the background, which holds the OpenRouter key.
 */
import { sameProviderVoices, type CloudVoiceInfo } from './cloudVoice';

export type Gender = 'female' | 'male';

export interface ChannelEntry {
  /** What the model concluded; absent when it could not tell. */
  gender?: Gender;
  /** A voice the viewer chose for this channel. Wins over `gender`. */
  voiceURI?: string;
  at: number;
}

export type ChannelVoices = Record<string, ChannelEntry>;

export interface VideoInfo {
  channelId: string;
  channel: string;
  title: string;
  description: string;
}

/** Re-ask about a channel the model could not place after this long. */
const UNKNOWN_RETRY_MS = 7 * 24 * 3600_000;
/** Channels kept; the least recently decided go first. */
const MAX_CHANNELS = 2000;

export async function guessGender(
  video: VideoInfo, key: string, model: string, fetchFn: typeof fetch = fetch,
): Promise<Gender | undefined> {
  const res = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 5,
      messages: [
        {
          role: 'system',
          content: 'You decide whether the main speaker of a YouTube video has a male or female voice, '
            + 'from the channel and video details. If you know the creator, use what you know; otherwise '
            + 'use the cues (names, pronouns, "her"/"his", the description). '
            + 'Answer with exactly one word: male, female, or unknown.',
        },
        {
          role: 'user',
          content: `Channel: ${video.channel}\nTitle: ${video.title}\nDescription: ${video.description.slice(0, 600)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openrouter-${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const answer = (data.choices?.[0]?.message?.content ?? '').trim().toLowerCase();
  if (answer.startsWith('female')) return 'female';
  if (answer.startsWith('male')) return 'male';
  return undefined;
}

/** The voice of `gender` to use: the current one if it fits, else the first that does. */
export function voiceOfGender(
  gender: Gender, currentURI: string, voices?: readonly CloudVoiceInfo[],
): string | null {
  const pool = sameProviderVoices(currentURI, voices);
  const current = pool.find((v) => v.uri === currentURI);
  if (current?.gender === gender) return current.uri;
  return pool.find((v) => v.gender === gender)?.uri ?? null;
}

export interface ChannelVoiceDeps {
  load: () => Promise<ChannelVoices>;
  save: (all: ChannelVoices) => Promise<void>;
  guess: (video: VideoInfo) => Promise<Gender | undefined>;
  voices?: readonly CloudVoiceInfo[];
  now?: () => number;
}

/** The voice for this video's channel, or null to keep the default. */
export async function voiceForChannel(
  video: VideoInfo, currentURI: string, deps: ChannelVoiceDeps,
): Promise<string | null> {
  if (!video.channelId) return null;
  const now = (deps.now ?? Date.now)();
  const all = await deps.load();
  let entry = all[video.channelId];
  if (entry?.voiceURI) return entry.voiceURI;
  if (!entry || (!entry.gender && now - entry.at > UNKNOWN_RETRY_MS)) {
    const gender = await deps.guess(video).catch(() => undefined);
    entry = { ...(gender && { gender }), at: now };
    await deps.save(prune({ ...all, [video.channelId]: entry }));
  }
  return entry.gender ? voiceOfGender(entry.gender, currentURI, deps.voices) : null;
}

/** Keep the viewer's own pick for a channel. */
export async function rememberChannelVoice(
  channelId: string, voiceURI: string, deps: Pick<ChannelVoiceDeps, 'load' | 'save' | 'now'>,
): Promise<void> {
  if (!channelId) return;
  const all = await deps.load();
  await deps.save(prune({ ...all, [channelId]: { ...all[channelId], voiceURI, at: (deps.now ?? Date.now)() } }));
}

function prune(all: ChannelVoices): ChannelVoices {
  const ids = Object.keys(all);
  if (ids.length <= MAX_CHANNELS) return all;
  const keep = ids.sort((a, b) => all[b]!.at - all[a]!.at).slice(0, MAX_CHANNELS);
  return Object.fromEntries(keep.map((id) => [id, all[id]!]));
}
