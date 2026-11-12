/** The amount buttons on Support the dev, in US dollars (spec 7). */
export const PRESET_AMOUNTS = [1, 3, 5, 10] as const;

export const DEFAULT_AMOUNT = 5;

/** The "Other" field takes $1 (spec 7) up to $10,000, which catches a typo with extra zeros. */
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 10_000;

/**
 * Reads the "Other" field: whole dollars, or dollars and cents with a point or a comma.
 * Returns null for anything else, and for amounts outside MIN_AMOUNT to MAX_AMOUNT.
 */
export function parseAmount(text: string): number | null {
  const value = text.trim().replace(',', '.');
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT ? amount : null;
}

/** The amount as a link writes it: "5" for whole dollars, "12.50" otherwise. */
export function amountText(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}
