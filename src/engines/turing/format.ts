import { z } from 'zod';
import type { Machine } from './types';

export const MACHINE_FORMAT = 'computable/machine@1';

const moveSchema = z.enum(['L', 'R', 'S']);
const readMatcherSchema = z.union([z.object({ match: z.literal('any') }), z.object({ match: z.literal('blank') })]);

const modernRuleSchema = z.object({
  state: z.string(),
  read: z.string(),
  write: z.string(),
  move: moveSchema,
  next: z.string(),
});

const turingRuleSchema = z.object({
  state: z.string(),
  read: z.union([z.string(), readMatcherSchema]),
  ops: z.array(z.string()),
  next: z.string(),
});

const machineSchema = z.object({
  format: z.literal(MACHINE_FORMAT),
  name: z.string(),
  notation: z.enum(['modern', 'turing1936']).optional(),
  tape: z.enum(['one-sided', 'two-way']),
  leftEdge: z.enum(['stay', 'reject']).optional(),
  blank: z.string(),
  start: z.string(),
  accept: z.array(z.string()),
  reject: z.array(z.string()),
  input: z.string(),
  rules: z.array(z.union([turingRuleSchema, modernRuleSchema])),
});

/** Why a file could not be read. `field` is a path such as "rules.2.move". */
export type FormatError =
  | { code: 'not-json' }
  | { code: 'not-a-machine' }
  | { code: 'missing-field'; field: string }
  | { code: 'bad-field'; field: string };

export type ParseResult = { ok: true; machine: Machine } | { ok: false; error: FormatError };

/** Reads a `computable/machine@1` JSON text. Checks the shape only; compileMachine checks the rules. */
export function parseMachine(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: { code: 'not-json' } };
  }
  if (typeof data !== 'object' || data === null || (data as { format?: unknown }).format !== MACHINE_FORMAT) {
    return { ok: false, error: { code: 'not-a-machine' } };
  }
  const result = machineSchema.safeParse(data);
  if (result.success) return { ok: true, machine: result.data };
  const issue = result.error.issues[0];
  const field = issue.path.join('.');
  const missing = issue.code === 'invalid_type' && getAt(data, issue.path) === undefined;
  return { ok: false, error: missing ? { code: 'missing-field', field } : { code: 'bad-field', field } };
}

function getAt(data: unknown, path: ReadonlyArray<PropertyKey>): unknown {
  let current: unknown = data;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

/** Writes a machine as pretty JSON, the same text "Download" saves. */
export function serializeMachine(machine: Machine): string {
  return `${JSON.stringify(machine, null, 2)}\n`;
}
