/**
 * Choosing a Thai voice. Everything here runs on the voices the browser already
 * has installed — nothing is fetched, nothing leaves the machine.
 */

/** Installed voices for a language, e.g. `th` → every `th-TH` voice. */
export function voicesFor(voices: readonly SpeechSynthesisVoice[], lang = 'th'): SpeechSynthesisVoice[] {
  const prefix = lang.toLowerCase().split('-')[0]!;
  return voices.filter((v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === prefix);
}

/**
 * The voice to speak with: the one the user picked if it is still installed,
 * else Kanya (macOS's Thai voice), else a local voice, else any Thai voice.
 * Null when the machine has no Thai voice at all.
 */
export function pickVoice(
  voices: readonly SpeechSynthesisVoice[],
  preferredURI = '',
  lang = 'th',
): SpeechSynthesisVoice | null {
  const candidates = voicesFor(voices, lang);
  return candidates.find((v) => preferredURI && v.voiceURI === preferredURI)
    ?? candidates.find((v) => /kanya/i.test(v.name))
    ?? candidates.find((v) => v.localService)
    ?? candidates[0]
    ?? null;
}

/**
 * The browser's voice list. Chrome fills it asynchronously, so an empty first
 * answer means "not yet", not "none": wait for `voiceschanged`, but not forever.
 */
export function loadVoices(synth: SpeechSynthesis, timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      synth.removeEventListener('voiceschanged', done);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    synth.addEventListener('voiceschanged', done);
  });
}
