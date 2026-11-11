import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRun, step, stepBack, type Run } from './run';
import { compiled, machine } from './test-helpers';
import type { ModernRule } from './types';

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

describe('step and stepBack', () => {
  it('N steps followed by N step-backs give back the exact start', () => {
    fc.assert(
      fc.property(randomMachine, fc.integer({ min: 0, max: 60 }), (m, n) => {
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
