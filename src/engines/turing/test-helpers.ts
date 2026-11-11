import { compileMachine, type CompiledMachine } from './compile';
import type { Machine, Rule } from './types';

/** Builds a machine with sensible defaults; tests override only what they check. */
export function machine(rules: Rule[], overrides: Partial<Machine> = {}): Machine {
  return {
    format: 'computable/machine@1',
    name: 'Test',
    tape: 'one-sided',
    blank: '_',
    start: 'q0',
    accept: ['qA'],
    reject: ['qR'],
    input: '',
    rules,
    ...overrides,
  };
}

/** Compiles a machine and fails the test if it has issues. */
export function compiled(m: Machine): CompiledMachine {
  const result = compileMachine(m);
  if (!result.ok) throw new Error(`machine has issues: ${JSON.stringify(result.issues)}`);
  return result.compiled;
}
