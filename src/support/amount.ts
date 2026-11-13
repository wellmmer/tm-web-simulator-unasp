/** Support the dev asks for US dollars, or for Brazilian reais in Brazilian Portuguese (spec 3, "Pix amounts"). */
export type Currency = 'USD' | 'BRL';

export interface AmountRules {
  /** The amount buttons. */
  presets: readonly number[];
  /** The amount chosen when the page opens. */
  preset: number;
  /** The smallest and the largest amount that the "Other" field takes. */
  min: number;
  max: number;
}

export const AMOUNTS: Record<Currency, AmountRules> = {
  // Spec 7. The maximum, $10,000, catches a typo with extra zeros.
  USD: { presets: [1, 3, 5, 10], preset: 5, min: 1, max: 10_000 },
  // Spec 3. The minimum is the smallest button. The maximum is about $10,000.
  BRL: { presets: [5, 10, 25, 50], preset: 25, min: 5, max: 50_000 },
};

/** True for Brazilian Portuguese: "pt", "pt-BR" or "pt-br". */
export function isBrazilian(locale: string): boolean {
  return /^pt(-br)?$/i.test(locale);
}

export function currencyOf(locale: string): Currency {
  return isBrazilian(locale) ? 'BRL' : 'USD';
}

/** The sign that may come before a typed amount. */
const SIGN: Record<Currency, RegExp> = { USD: /^\$\s*/, BRL: /^R\$\s*/i };

/**
 * Reads the "Other" field: whole amounts, or amounts with cents after a point or a comma, with or
 * without the currency sign in front. Returns null for anything else, a thousands separator
 * included, and for amounts outside the currency's minimum and maximum.
 */
export function parseAmount(text: string, currency: Currency): number | null {
  const { min, max } = AMOUNTS[currency];
  const value = text.trim().replace(SIGN[currency], '').replace(',', '.');
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return amount >= min && amount <= max ? amount : null;
}

/** The amount as a link writes it: "5" for a whole amount, "12.50" otherwise. */
export function amountText(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function currencyFormat(currency: Currency, locale: string, useGrouping = true) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, trailingZeroDisplay: 'stripIfInteger', useGrouping });
}

/** The amount as the language writes it: "$5" and "$7.50" in English, "R$ 25" and "R$ 7,50" in Brazilian Portuguese. */
export function formatAmount(amount: number, currency: Currency, locale: string): string {
  return currencyFormat(currency, locale).format(amount);
}

/**
 * A limit of the "Other" field, for its hint: "$10000", "R$ 50000". No thousands separator, because
 * the field refuses one, so the visitor can type the maximum exactly as the hint shows it.
 */
export function formatLimit(amount: number, currency: Currency, locale: string): string {
  return currencyFormat(currency, locale, false).format(amount);
}

/** The currency sign as the language writes it, and whether it comes before the number. */
export function currencySymbol(currency: Currency, locale: string): { symbol: string; before: boolean } {
  const parts = currencyFormat(currency, locale).formatToParts(1);
  const sign = parts.findIndex((part) => part.type === 'currency');
  const number = parts.findIndex((part) => part.type === 'integer');
  return { symbol: parts[sign]?.value ?? currency, before: sign < number };
}

/** Two amounts to type, for the hint of the "Other" field: the amount chosen first, and the same with cents. */
export function amountExamples(currency: Currency, locale: string): { whole: string; cents: string } {
  const { preset } = AMOUNTS[currency];
  return { whole: String(preset), cents: new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(preset + 0.5) };
}
