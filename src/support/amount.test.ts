import { describe, expect, it } from 'vitest';
import { AMOUNTS, amountExamples, amountText, currencyOf, currencySymbol, formatAmount, formatLimit, parseAmount } from './amount';

describe('the amounts', () => {
  it('offers $1, $3, $5 and $10, with $5 chosen first (spec 7)', () => {
    expect(AMOUNTS.USD).toEqual({ presets: [1, 3, 5, 10], preset: 5, min: 1, max: 10_000 });
  });

  it('offers R$5, R$10, R$25 and R$50, with R$25 chosen first (spec 3, "Pix amounts")', () => {
    expect(AMOUNTS.BRL).toEqual({ presets: [5, 10, 25, 50], preset: 25, min: 5, max: 50_000 });
  });
});

describe('currencyOf', () => {
  it('pays in reais in Brazilian Portuguese, and in US dollars in every other language', () => {
    expect(currencyOf('pt-BR')).toBe('BRL');
    expect(currencyOf('pt-br')).toBe('BRL');
    expect(currencyOf('pt')).toBe('BRL');
    expect(currencyOf('pt-PT')).toBe('USD');
    expect(currencyOf('en')).toBe('USD');
    expect(currencyOf('es')).toBe('USD');
  });
});

describe('parseAmount in US dollars', () => {
  it('reads whole dollars and dollars with cents', () => {
    expect(parseAmount('7', 'USD')).toBe(7);
    expect(parseAmount(' 12.5 ', 'USD')).toBe(12.5);
    expect(parseAmount('2,75', 'USD')).toBe(2.75);
  });

  it('refuses less than $1, more than $10,000, and anything that is not an amount', () => {
    expect(parseAmount('0.99', 'USD')).toBeNull();
    expect(parseAmount('1', 'USD')).toBe(1);
    expect(parseAmount('10000', 'USD')).toBe(10000);
    expect(parseAmount('10000.01', 'USD')).toBeNull();
    expect(parseAmount('', 'USD')).toBeNull();
    expect(parseAmount('-5', 'USD')).toBeNull();
    expect(parseAmount('5.123', 'USD')).toBeNull();
    expect(parseAmount('1e3', 'USD')).toBeNull();
    expect(parseAmount('five', 'USD')).toBeNull();
  });

  it('takes a dollar sign before the amount, with spaces around', () => {
    expect(parseAmount('$5', 'USD')).toBe(5);
    expect(parseAmount(' $ 7.50 ', 'USD')).toBe(7.5);
  });

  it('refuses a thousands separator, more than 2 decimals, a misplaced dollar sign and the real sign', () => {
    expect(parseAmount('1,000', 'USD')).toBeNull();
    expect(parseAmount('20000', 'USD')).toBeNull();
    expect(parseAmount('5$', 'USD')).toBeNull();
    expect(parseAmount('$$5', 'USD')).toBeNull();
    expect(parseAmount('R$5', 'USD')).toBeNull();
  });
});

describe('parseAmount in reais', () => {
  it('reads whole reais and reais with centavos, with a comma or a point', () => {
    expect(parseAmount('30', 'BRL')).toBe(30);
    expect(parseAmount('7,50', 'BRL')).toBe(7.5);
    expect(parseAmount('7.5', 'BRL')).toBe(7.5);
  });

  it('takes "R$" before the amount, in either case and with or without a space', () => {
    expect(parseAmount('R$25', 'BRL')).toBe(25);
    expect(parseAmount(' R$ 30,50 ', 'BRL')).toBe(30.5);
    expect(parseAmount('r$10', 'BRL')).toBe(10);
  });

  it('refuses less than R$5 and more than R$50,000', () => {
    expect(parseAmount('4,99', 'BRL')).toBeNull();
    expect(parseAmount('5', 'BRL')).toBe(5);
    expect(parseAmount('50000', 'BRL')).toBe(50000);
    expect(parseAmount('50000,01', 'BRL')).toBeNull();
  });

  it('refuses a thousands separator: "1.000" means one thousand in Brazil, so it must not read as 1', () => {
    expect(parseAmount('1.000', 'BRL')).toBeNull();
    expect(parseAmount('1.000,00', 'BRL')).toBeNull();
    expect(parseAmount('$5', 'BRL')).toBeNull();
  });
});

describe('amountText', () => {
  it('writes whole amounts without cents, and other amounts with two decimals, for links', () => {
    expect(amountText(5)).toBe('5');
    expect(amountText(12.5)).toBe('12.50');
    expect(amountText(2.75)).toBe('2.75');
  });
});

describe('formatAmount', () => {
  it('writes the amount as the language does, without cents when they are zero', () => {
    expect(formatAmount(5, 'USD', 'en')).toBe('$5');
    expect(formatAmount(7.5, 'USD', 'en')).toBe('$7.50');
    expect(formatAmount(25, 'BRL', 'pt-BR')).toBe('R$ 25');
    expect(formatAmount(7.5, 'BRL', 'pt-BR')).toBe('R$ 7,50');
    expect(formatAmount(5, 'USD', 'fr')).toBe('5 $US');
    expect(formatAmount(5, 'USD', 'de')).toBe('5 $');
  });
});

describe('formatLimit', () => {
  // The hint shows the limits as the field takes them: the field refuses a thousands separator.
  it('writes the minimum and the maximum without a thousands separator, in every language', () => {
    expect(formatLimit(10_000, 'USD', 'en')).toBe('$10000');
    expect(formatLimit(50_000, 'BRL', 'pt-BR')).toBe('R$\u00a050000');
    expect(formatLimit(10_000, 'USD', 'es')).toBe('10000\u00a0US$');
    expect(formatLimit(10_000, 'USD', 'fr')).toBe('10000\u00a0$US');
    expect(formatLimit(10_000, 'USD', 'de')).toBe('10000\u00a0$');
    expect(formatLimit(1, 'USD', 'en')).toBe('$1');
    expect(formatLimit(5, 'BRL', 'pt-BR')).toBe('R$\u00a05');
  });

  it('writes a maximum the field takes', () => {
    expect(parseAmount(formatLimit(10_000, 'USD', 'en'), 'USD')).toBe(10_000);
    expect(parseAmount(formatLimit(50_000, 'BRL', 'pt-BR'), 'BRL')).toBe(50_000);
  });
});

describe('currencySymbol', () => {
  it('gives the sign and its side, for the "Other" field', () => {
    expect(currencySymbol('USD', 'en')).toEqual({ symbol: '$', before: true });
    expect(currencySymbol('BRL', 'pt-BR')).toEqual({ symbol: 'R$', before: true });
    expect(currencySymbol('USD', 'de')).toEqual({ symbol: '$', before: false });
  });
});

describe('amountExamples', () => {
  it('gives two amounts to type, without the sign: the amount chosen first, and the same with cents', () => {
    expect(amountExamples('USD', 'en')).toEqual({ whole: '5', cents: '5.50' });
    expect(amountExamples('BRL', 'pt-BR')).toEqual({ whole: '25', cents: '25,50' });
    expect(amountExamples('USD', 'de')).toEqual({ whole: '5', cents: '5,50' });
  });
});
