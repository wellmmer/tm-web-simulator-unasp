import { describe, expect, it } from 'vitest';
import { amountText, DEFAULT_AMOUNT, parseAmount, PRESET_AMOUNTS } from './amount';

describe('the amounts (spec 7)', () => {
  it('offers $1, $3, $5 and $10, with $5 chosen first', () => {
    expect(PRESET_AMOUNTS).toEqual([1, 3, 5, 10]);
    expect(DEFAULT_AMOUNT).toBe(5);
  });
});

describe('parseAmount', () => {
  it('reads whole dollars and dollars with cents', () => {
    expect(parseAmount('7')).toBe(7);
    expect(parseAmount(' 12.5 ')).toBe(12.5);
    expect(parseAmount('2,75')).toBe(2.75);
  });

  it('refuses less than $1, more than $10,000, and anything that is not an amount', () => {
    expect(parseAmount('0.99')).toBeNull();
    expect(parseAmount('1')).toBe(1);
    expect(parseAmount('10000')).toBe(10000);
    expect(parseAmount('10000.01')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('5.123')).toBeNull();
    expect(parseAmount('1e3')).toBeNull();
    expect(parseAmount('five')).toBeNull();
  });

  it('takes a dollar sign before the amount, with spaces around', () => {
    expect(parseAmount('$5')).toBe(5);
    expect(parseAmount(' $ 7.50 ')).toBe(7.5);
  });

  it('refuses a thousands separator, more than $10,000, more than 2 decimals, and a misplaced dollar sign', () => {
    expect(parseAmount('1,000')).toBeNull();
    expect(parseAmount('20000')).toBeNull();
    expect(parseAmount('5.123')).toBeNull();
    expect(parseAmount('5$')).toBeNull();
    expect(parseAmount('$$5')).toBeNull();
  });
});

describe('amountText', () => {
  it('writes whole dollars without cents, and other amounts with two decimals', () => {
    expect(amountText(5)).toBe('5');
    expect(amountText(12.5)).toBe('12.50');
    expect(amountText(2.75)).toBe('2.75');
  });
});
