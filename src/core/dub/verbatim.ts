/**
 * Did a chat-style voice model say the line it was given, and only that?
 *
 * GPT Audio Mini is a conversational model: given a short question it may
 * answer it, and given anything it may add a word or two. Its streamed
 * transcript is what it actually said, so it is compared with the line —
 * punctuation and spacing aside, allowing a slip of a character or two.
 */
const NOISE = /[\s\p{P}\p{S}]/gu;

export function normalizeSpoken(text: string): string {
  return text.normalize('NFC').replace(NOISE, '').toLowerCase();
}

function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length]!;
}

/** True when `spoken` is `line`, give or take ~5% of its characters. */
export function saidVerbatim(line: string, spoken: string): boolean {
  const a = normalizeSpoken(line);
  const b = normalizeSpoken(spoken);
  if (!a || !b) return false;
  if (a === b) return true;
  return distance(a, b) <= Math.max(1, Math.floor(a.length * 0.05));
}
