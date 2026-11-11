import { describe, expect, it } from 'vitest';
import { Tape } from './tape';

describe('Tape', () => {
  it('reads the blank where nothing is written', () => {
    const tape = new Tape('_');
    expect(tape.read(0)).toBe('_');
    expect(tape.read(-5)).toBe('_');
    expect(tape.toString()).toBe('');
    expect(tape.bounds()).toBeNull();
  });

  it('places the input from cell 0', () => {
    const tape = new Tape('_', '1011');
    expect(tape.read(0)).toBe('1');
    expect(tape.read(3)).toBe('1');
    expect(tape.read(4)).toBe('_');
    expect(tape.toString()).toBe('1011');
  });

  it('stores only non-blank cells, so writing the blank clears a cell', () => {
    const tape = new Tape('_', '10');
    tape.write(1, '_');
    expect(tape.toString()).toBe('1');
    expect(tape.bounds()).toEqual({ min: 0, max: 0 });
  });

  it('keeps blanks between written cells and supports negative cells', () => {
    const tape = new Tape('_');
    tape.write(-2, 'a');
    tape.write(1, 'b');
    expect(tape.toString()).toBe('a__b');
    expect(tape.bounds()).toEqual({ min: -2, max: 1 });
  });
});
