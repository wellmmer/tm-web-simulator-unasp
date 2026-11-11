/** A symbol is exactly one Unicode code point. "𝔟" counts as one; "ab" does not. */
export function isSingleSymbol(value: string): boolean {
  return [...value].length === 1;
}

/** Splits text into symbols by code point, so "𝔟𝔠" gives two symbols, not four. */
export function symbolsOf(text: string): string[] {
  return [...text];
}
