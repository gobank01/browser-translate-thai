/**
 * "Summarize what I've watched": a short lesson in Thai built from the part of
 * the video already played — its gist, the key points with the moment each
 * was made, and the terms worth knowing. Built from the subtitles the dub has
 * already translated, so it costs one short model call.
 *
 * Runs in the background, which holds the OpenRouter key.
 */
export interface LessonLine { startMs: number; text: string }

export interface Lesson {
  summary: string;
  points: Array<{ atMs: number; text: string }>;
  terms: Array<{ term: string; meaning: string }>;
}

/** Enough transcript to summarize a long sitting without a huge prompt. */
const MAX_CHARS = 24_000;

function mmss(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function parseMmss(v: unknown): number {
  const m = String(v ?? '').match(/(?:(\d+):)?(\d+):(\d{2})/);
  if (!m) return 0;
  return ((Number(m[1] ?? 0) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000;
}

/** The transcript as "[m:ss] text" lines, trimmed from the start to fit. */
export function transcriptForPrompt(lines: readonly LessonLine[]): string {
  const all = lines.filter((l) => l.text.trim()).map((l) => `[${mmss(l.startMs)}] ${l.text.trim()}`);
  let out = all.join('\n');
  while (out.length > MAX_CHARS && all.length > 1) { all.shift(); out = all.join('\n'); }
  return out;
}

/** Read the model's JSON; anything malformed is dropped rather than shown. */
export function parseLesson(raw: string): Lesson {
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  const data = JSON.parse(json) as { summary?: unknown; points?: unknown; terms?: unknown };
  const arr = (v: unknown) => (Array.isArray(v) ? v : []) as Array<Record<string, unknown>>;
  return {
    summary: String(data.summary ?? '').trim(),
    points: arr(data.points)
      .map((p) => ({ atMs: parseMmss(p.time), text: String(p.text ?? '').trim() }))
      .filter((p) => p.text)
      .slice(0, 8),
    terms: arr(data.terms)
      .map((t) => ({ term: String(t.term ?? '').trim(), meaning: String(t.meaning ?? '').trim() }))
      .filter((t) => t.term && t.meaning)
      .slice(0, 8),
  };
}

export async function makeLesson(
  title: string, lines: readonly LessonLine[], key: string, model: string, fetchFn: typeof fetch = fetch,
): Promise<Lesson> {
  const res = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You turn the watched part of a video into a short study note in Thai for a Thai learner. '
            + 'Use only what is in the transcript. Keep technical terms as commonly said (ทับศัพท์ or English). '
            + 'Reply with JSON only: {"summary": "2-3 sentence gist in Thai", '
            + '"points": [{"time": "m:ss from the transcript", "text": "one key point in Thai"}] (3-6 items, in order), '
            + '"terms": [{"term": "term as said", "meaning": "short Thai explanation"}] (0-6 items)}.',
        },
        { role: 'user', content: `Video: ${title}\n\nTranscript so far:\n${transcriptForPrompt(lines)}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openrouter-${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return parseLesson(data.choices?.[0]?.message?.content ?? '');
}
