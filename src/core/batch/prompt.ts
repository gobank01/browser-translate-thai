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
  'Do not force native equivalents onto loanwords: technical terms, product names and words native speakers ' +
  'normally borrow (AI, agent, prompt, model, app, update…) stay as they are commonly said — in Thai, written ' +
  'as the usual Thai transliteration (ทับศัพท์, e.g. เอเจนต์, พรอมต์, โมเดล, แอป), with brand names kept in English.';

/**
 * Models translating into Thai like to end every line with ครับ/ค่ะ, which on a
 * whole video reads (and, dubbed, sounds) like a call-centre script.
 */
export const NO_PARTICLES =
  'SENTENCE ENDINGS\n' +
  'Write like a narrator, not a customer-service agent: do NOT end lines with polite particles ' +
  '(in Thai: ครับ, ค่ะ, คะ, นะครับ, นะคะ, ครับผม, จ้า). A speaker addressing the audience, greeting or explaining ' +
  'is not a reason to add one. Use a particle only when the original itself has an explicit politeness or ' +
  'softening word there (sir, ma\'am, please, okay?), and then sparingly.';

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
    (surface === 'subtitle' ? NO_PARTICLES + '\n\n' : '') +
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
