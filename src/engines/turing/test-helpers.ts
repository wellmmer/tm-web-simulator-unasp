import { compileMachine, type CompiledMachine } from './compile';
import { MACHINE_FORMAT, parseMachine } from './format';
import type { Machine, Rule } from './types';

/** Builds a machine with sensible defaults; tests override only what they check. */
export function machine(rules: Rule[], overrides: Partial<Machine> = {}): Machine {
  return {
    format: MACHINE_FORMAT,
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

/** Parses an example file's JSON object and fails the test if it is not a valid machine. */
export function fromJson(data: unknown): Machine {
  const result = parseMachine(JSON.stringify(data));
  if (!result.ok) throw new Error(`bad example: ${JSON.stringify(result.error)}`);
  return result.machine;
}
