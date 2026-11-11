import { describe, expect, it } from 'vitest';
import { isSingleSymbol, symbolsOf } from './symbol';

describe('isSingleSymbol', () => {
  it('accepts one character, including a comma and an astral character', () => {
    expect(isSingleSymbol('a')).toBe(true);
    expect(isSingleSymbol(',')).toBe(true);
    expect(isSingleSymbol('𝔟')).toBe(true);
  });

  it('rejects an empty string and two characters', () => {
    expect(isSingleSymbol('')).toBe(false);
    expect(isSingleSymbol('ab')).toBe(false);
  });
});

describe('symbolsOf', () => {
  it('splits by code point', () => {
    expect(symbolsOf('𝔟𝔠x')).toEqual(['𝔟', '𝔠', 'x']);
  });
});
