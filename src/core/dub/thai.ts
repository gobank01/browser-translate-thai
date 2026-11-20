/** Share of the letters in `text` that are Thai script (0–1). */
export function thaiShare(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return 0;
  return letters.filter((c) => c >= '\u0E00' && c <= '\u0E7F').length / letters.length;
}

/** True when subtitle lines are mostly Thai already — nothing to translate into Thai. */
export function mostlyThai(lines: readonly { text: string }[]): boolean {
  return thaiShare(lines.slice(0, 40).map((l) => l.text).join(' ')) > 0.5;
}
