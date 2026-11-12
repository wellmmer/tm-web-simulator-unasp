import { describe, expect, it } from 'vitest';
import { writeInputCell } from './tape-edit';

describe('writeInputCell', () => {
  it('writes a symbol into the input, filling the gap with blanks', () => {
    expect(writeInputCell('1011', '_', 1, '1')).toBe('1111');
    expect(writeInputCell('10', '_', 4, '1')).toBe('10__1');
    expect(writeInputCell('', '␣', 0, '𝔟')).toBe('𝔟');
  });

  it('drops blanks at the end, so the input ends with its last symbol', () => {
    expect(writeInputCell('1011', '_', 3, '_')).toBe('101');
    expect(writeInputCell('10_1', '_', 3, '_')).toBe('10');
    expect(writeInputCell('1', '_', 5, '_')).toBe('1');
  });
});
