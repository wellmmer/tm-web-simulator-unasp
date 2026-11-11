import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import binaryPlusOne from '../../../examples/binary-plus-one.json';
import palindrome from '../../../examples/palindrome.json';
import turingFirst from '../../../examples/turing-1936-first.json';
import { createRun, runUntilHalt, step } from './run';
import { compiled, fromJson } from './test-helpers';

describe('Binary +1', () => {
  const m = compiled(fromJson(binaryPlusOne));

  it('turns 1011 into 1100 and accepts after 8 steps', () => {
    const run = createRun(m);
    expect(runUntilHalt(run)).toBe('halted');
    expect(run).toMatchObject({ status: 'accepted', steps: 8 });
    expect(run.tape.toString()).toBe('1100');
  });

  it('adds 1 to any binary number', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (n) => {
        const run = createRun(m, n.toString(2));
        runUntilHalt(run);
        expect(run.status).toBe('accepted');
        expect(run.tape.toString()).toBe((n + 1).toString(2));
      }),
    );
  });
});

describe('Palindrome checker', () => {
  const m = compiled(fromJson(palindrome));

  it('accepts exactly the binary palindromes, including the empty input', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom('0', '1'), { maxLength: 12 }), (symbols) => {
        const input = symbols.join('');
        const run = createRun(m, input);
        expect(runUntilHalt(run)).toBe('halted');
        expect(run.status).toBe(input === [...symbols].reverse().join('') ? 'accepted' : 'rejected');
      }),
    );
  });
});

describe("Turing's first machine (1936)", () => {
  const m = compiled(fromJson(turingFirst));

  it('prints 0 1 0 1 on every other square', () => {
    const run = createRun(m);
    for (let i = 0; i < 8; i++) step(run);
    expect(run.tape.toString()).toBe('0_1_0_1');
    expect(run).toMatchObject({ head: 8, state: '𝔟' });
  });

  it('never halts, so it pauses at the step limit', () => {
    const run = createRun(m);
    expect(runUntilHalt(run, 10_000)).toBe('limit');
    expect(run.status).toBe('running');
  });
});
