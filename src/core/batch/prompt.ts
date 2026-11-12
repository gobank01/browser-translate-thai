import { DEFAULT_STYLE_PROMPT, translationContext } from '~/core/prompt/style';

/**
 * For a dub: the subtitles are read aloud, so they should sound like someone
 * talking, and be short enough to say in the time the line is on screen.
 */
export const SPOKEN_STYLE =
  'SPOKEN DUB STYLE\n' +
  'These subtitles are read aloud by a text-to-speech voice as a dub over the video. ' +
  'Translate into natural, conversational spoken language, the way a native narrator would say it out loud — not written or formal subtitle style. ' +
  'Keep it concise: say the same meaning in as few words as reads naturally, so it fits the time the line is on screen. ' +
  'No parentheses, brackets, ellipses, emoji or symbols that cannot be spoken. ' +
  'Keep names and technical terms in English only where native speakers say them in English. ' +
  'No polite sentence-final particles (such as ครับ/ค่ะ in Thai) unless the speaker is clearly being polite.';

/** Internal ID-based batch protocol, not editable with the user's base prompt. */
export function batchSystemPrompt(
  targetLang: string,
  basePrompt = DEFAULT_STYLE_PROMPT,
  surface: 'fullPage' | 'subtitle' = 'fullPage',
  spoken = false,
): string {
  return (
    'BASE INSTRUCTIONS\n' + basePrompt + '\n\n' +
    (spoken && surface === 'subtitle' ? SPOKEN_STYLE + '\n\n' : '') +
    translationContext(targetLang) + '\n\n' +
    'OUTPUT PROTOCOL — these format rules take precedence over conflicting base instructions.\n' +
    `You translate ${surface === 'subtitle' ? 'video subtitle' : 'web page'} text segments. ` +
    'Input is a JSON array of objects with id and text fields. Process the ENTIRE text of EACH item, never a word extracted from it.\n' +
    'Respond with ONLY a JSON array of objects with this shape: [{"id":0,"translation":"..."}]. ' +
    'Return each input id exactly once, unchanged, with a string translation. Do not merge or split items. ' +
    'Ids are alignment metadata, never part of the translated text. ' +
    'No code fences or commentary. Translation values are plain text: do not introduce markdown or HTML formatting. ' +
    'Preserve meaningful line breaks. If a segment needs no change, return its text as-is.'
  );
}

/** IDs let the parser verify correspondence and recover from reordered output. */
export function batchUserPrompt(segments: string[], targetLang: string): string {
  const input = segments.map((text, id) => ({ id, text }));
  return `Translate all ${segments.length} items to ${targetLang}. Return one result per id.\n\n${JSON.stringify(input)}`;
}
