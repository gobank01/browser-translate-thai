import type { Cue } from '~/core/subtitles/types';

/**
 * Speech to text for videos with no captions: ElevenLabs Scribe, word timings
 * included, about US$0.22 an hour of audio (scribe_v2, Nov 2026).
 */
export interface SttWord { text: string; start: number; end: number; type?: string }
export interface SttResult { language: string; words: SttWord[] }

export const STT_MODEL = 'scribe_v2';

export async function transcribe(audio: Blob, key: string): Promise<SttResult> {
  const form = new FormData();
  form.append('model_id', STT_MODEL);
  form.append('tag_audio_events', 'false');
  form.append('file', audio, 'audio');
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST', headers: { 'xi-api-key': key }, body: form,
  });
  if (!res.ok) throw new Error(`scribe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json() as { language_code?: string; words?: SttWord[] };
  return { language: json.language_code ?? '', words: (json.words ?? []).filter((w) => w.type !== 'audio_event') };
}

const MAX_LINE_S = 8;
const PAUSE_S = 0.7;

/**
 * Words into subtitle lines: a line ends at a sentence stop, a pause, or after
 * eight seconds. `offsetS` moves them from the clip's clock to the video's.
 */
export function wordsToCues(words: SttWord[], offsetS: number, firstId: number): Cue[] {
  const cues: Cue[] = [];
  let text = '';
  let start = -1;
  let end = 0;
  const close = () => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t && start >= 0) cues.push({ id: firstId + cues.length, startMs: Math.round((start + offsetS) * 1000), endMs: Math.round((end + offsetS) * 1000), text: t });
    text = ''; start = -1;
  };
  for (const w of words) {
    if (w.type === 'spacing') { text += w.text; continue; }
    if (start >= 0 && (w.start - end > PAUSE_S || w.end - start > MAX_LINE_S)) close();
    if (start < 0) start = w.start;
    text += w.text;
    end = w.end;
    if (/[.!?。？！]$/.test(w.text)) close();
  }
  close();
  return cues;
}

/** Scribe names languages ISO 639-3 ("tha", "eng"); the rest of the app uses 639-1. */
export function isThaiCode(code: string): boolean {
  return /^th/i.test(code);
}
