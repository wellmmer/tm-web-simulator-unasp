import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRun, step, stepBack, type Run } from './run';
import { compiled, machine } from './test-helpers';
import type { Machine, ModernRule, ReadMatcher, TuringRule } from './types';

const STATES = ['q0', 'q1', 'q2'];
const SYMBOLS = ['0', '1', '_'];

/** A random machine with at most one rule per state and symbol, so it always compiles. */
const randomMachine = fc
  .record({
    tape: fc.constantFrom('one-sided' as const, 'two-way' as const),
    leftEdge: fc.constantFrom('stay' as const, 'reject' as const),
    input: fc.array(fc.constantFrom(...SYMBOLS), { maxLength: 8 }).map((symbols) => symbols.join('')),
    rules: fc.array(
      fc.option(
        fc.record({
          write: fc.constantFrom(...SYMBOLS),
          move: fc.constantFrom('L' as const, 'R' as const, 'S' as const),
          next: fc.constantFrom(...STATES, 'qA', 'qR'),
        }),
        { freq: 4 },
      ),
      { minLength: STATES.length * SYMBOLS.length, maxLength: STATES.length * SYMBOLS.length },
    ),
  })
  .map(({ tape, leftEdge, input, rules }) => {
    const modernRules: ModernRule[] = [];
    rules.forEach((rule, i) => {
      if (rule === null) return;
      const state = STATES[Math.floor(i / SYMBOLS.length)];
      const read = SYMBOLS[i % SYMBOLS.length];
      modernRules.push({ state, read, ...rule });
    });
    return machine(modernRules, { tape, leftEdge, input });
  });

function snapshot(run: Run) {
  return {
    state: run.state,
    head: run.head,
    steps: run.steps,
    status: run.status,
    reason: run.reason,
    tape: run.tape.toString(),
    bounds: run.tape.bounds(),
  };
}

/** A random 1936-style machine: "blank", "any" and exact matchers, several operations per rule. */
const TURING_READS: Array<string | ReadMatcher> = [{ match: 'blank' }, { match: 'any' }, '1'];
const randomTuringMachine = fc
  .record({
    tape: fc.constantFrom('one-sided' as const, 'two-way' as const),
    leftEdge: fc.constantFrom('stay' as const, 'reject' as const),
    input: fc.array(fc.constantFrom(...SYMBOLS), { maxLength: 8 }).map((symbols) => symbols.join('')),
    rules: fc.array(
      fc.option(
        fc.record({
          ops: fc.array(fc.constantFrom('P0', 'P1', 'E', 'L', 'R'), { maxLength: 4 }),
          next: fc.constantFrom(...STATES, 'qA', 'qR'),
        }),
        { freq: 4 },
      ),
      { minLength: STATES.length * TURING_READS.length, maxLength: STATES.length * TURING_READS.length },
    ),
  })
  .map(({ tape, leftEdge, input, rules }) => {
    const turingRules: TuringRule[] = [];
    rules.forEach((rule, i) => {
      if (rule === null) return;
      const state = STATES[Math.floor(i / TURING_READS.length)];
      const read = TURING_READS[i % TURING_READS.length];
      turingRules.push({ state, read, ...rule });
    });
    return machine(turingRules, { tape, leftEdge, input });
  });

describe('step and stepBack', () => {
  it.each([
    { kind: 'modern rules', machines: randomMachine },
    { kind: '1936 rules', machines: randomTuringMachine },
  ])('N steps followed by N step-backs give back the exact start ($kind)', ({ machines }: { machines: fc.Arbitrary<Machine> }) => {
    fc.assert(
      fc.property(machines, fc.integer({ min: 0, max: 60 }), (m, n) => {
        const run = createRun(compiled(m));
        const start = snapshot(run);
        let taken = 0;
        for (let i = 0; i < n && step(run) !== null; i++) taken++;
        for (let i = 0; i < taken; i++) expect(stepBack(run)).toBe(true);
        expect(snapshot(run)).toEqual(start);
        expect(run.history).toHaveLength(0);
      }),
    );
  });
});
