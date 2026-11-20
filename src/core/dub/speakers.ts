/**
 * Who is speaking each line — so an interview between a man and a woman is
 * dubbed in a male and a female voice, each person keeping theirs.
 *
 * Subtitles rarely say who speaks. A model reads the lines (with any `>>` turn
 * markers or `Name:` labels the captions do carry) plus the title and
 * description, which usually name the guest, and labels each line with a
 * speaker and that speaker's gender. Lines are labelled a window at a time,
 * ahead of the playhead, with the speakers found so far passed along so a
 * person keeps their label across windows.
 *
 * Runs in the background, which holds the OpenRouter key.
 */
import type { Gender } from './channelVoice';

export interface SpeakerLine { id: number; text: string; speaker?: string }

export interface SpeakerLabels {
  /** Speaker label → gender, for every speaker found so far. */
  speakers: Record<string, Gender | 'unknown'>;
  /** Line id → speaker label. */
  lines: Record<number, string>;
}

export function parseSpeakerLabels(raw: string): SpeakerLabels {
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  const data = JSON.parse(json) as { speakers?: unknown; lines?: unknown };
  const speakers: SpeakerLabels['speakers'] = {};
  for (const [name, g] of Object.entries((data.speakers ?? {}) as Record<string, unknown>)) {
    const v = String(g).toLowerCase();
    speakers[name] = v.startsWith('female') ? 'female' : v.startsWith('male') ? 'male' : 'unknown';
  }
  const lines: SpeakerLabels['lines'] = {};
  for (const l of (Array.isArray(data.lines) ? data.lines : []) as Array<Record<string, unknown>>) {
    const id = Number(l.id);
    if (Number.isInteger(id) && typeof l.speaker === 'string' && l.speaker) lines[id] = l.speaker;
  }
  return { speakers, lines };
}

export async function labelSpeakers(
  video: { title: string; description: string },
  lines: readonly SpeakerLine[],
  known: SpeakerLabels['speakers'],
  key: string, model: string, fetchFn: typeof fetch = fetch,
): Promise<SpeakerLabels> {
  const res = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You label who speaks each subtitle line of a video, for dubbing with male and female voices. '
            + 'Use turn markers (">>", "- ", "Name:"), question/answer turns, names in the title and description, '
            + 'and what speakers say about themselves. Use short labels: the person\'s name when known, else A, B, C. '
            + 'Reuse the labels of speakers already known. A video with one presenter has one speaker. '
            + 'Gender is the voice the speaker would be dubbed in: "male", "female", or "unknown" when there is no clue. '
            + 'Reply with JSON only: {"speakers": {"label": "male|female|unknown"}, "lines": [{"id": n, "speaker": "label"}]} '
            + 'covering every line id given.',
        },
        {
          role: 'user',
          content: `Title: ${video.title}\nDescription: ${video.description.slice(0, 800)}\n`
            + `Speakers known so far: ${JSON.stringify(known)}\n\nLines:\n`
            + lines.map((l) => `${l.id}\t${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openrouter-${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return parseSpeakerLabels(data.choices?.[0]?.message?.content ?? '');
}
