import { MACHINE_FORMAT } from './format';
import type { Machine, ModernRule, Move } from './types';

/**
 * The blank for imported 2016 machines. The 2016 app used a space as the blank, and its
 * example uses "_" as an ordinary symbol, so the blank cannot be "_".
 */
export const LEGACY_BLANK = '␣';

export type LegacyError = { code: 'legacy-too-short' } | { code: 'legacy-bad-row'; row: number };
/** Two rows give a rule for the same state and symbol. `keptRow` is the row the machine uses. */
export type LegacyWarning = { code: 'legacy-duplicate-row'; row: number; keptRow: number; state: string; read: string };
export type LegacyResult = { ok: true; machine: Machine; warnings: LegacyWarning[] } | { ok: false; error: LegacyError };

/** The accept and reject states of an imported 2016 machine. */
export const LEGACY_ACCEPT = 'qA';
export const LEGACY_REJECT = 'qR';

/**
 * A state outside the `next` column. In 2016, `A` and `R` halted only in the `next` column, so a
 * state named `A` or `R` is an ordinary state. It gets a prime (`qA′`), so it cannot become qA or qR.
 */
function legacyState(value: string): string {
  const name = `q${value}`;
  return name === LEGACY_ACCEPT || name === LEGACY_REJECT ? `${name}′` : name;
}

/** A state in the `next` column: `A` accepts and `R` rejects, in either case. */
function legacyNext(value: string): string {
  if (value === 'A' || value === 'a') return LEGACY_ACCEPT;
  if (value === 'R' || value === 'r') return LEGACY_REJECT;
  return legacyState(value);
}

function legacySymbol(value: string): string {
  return value === ' ' ? LEGACY_BLANK : value;
}

function legacyMove(value: string): Move {
  if (value === '>') return 'R';
  if (value === '<') return 'L';
  return 'S';
}

/**
 * Reads a machine saved by the 2016 app. Line 1 is the start state, line 2 the input, then one
 * rule per line: `state,read,write,next,dir,`. `row` in errors and warnings is the 1-based line number.
 * When two rows share a state and symbol, the last row wins, as in the 2016 app, and a warning names both.
 */
export function parseLegacy(text: string, name: string): LegacyResult {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2 || lines[0].trim() === '') return { ok: false, error: { code: 'legacy-too-short' } };

  const rules: ModernRule[] = [];
  const rowOfRule: number[] = [];
  const indexByKey = new Map<string, number>();
  const warnings: LegacyWarning[] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const parts = line.split(',');
    if (parts.length < 5 || parts[0] === '' || parts[1] === '' || parts[2] === '' || parts[3] === '') {
      return { ok: false, error: { code: 'legacy-bad-row', row: i + 1 } };
    }
    const rule: ModernRule = {
      state: legacyState(parts[0]),
      read: legacySymbol(parts[1]),
      write: legacySymbol(parts[2]),
      next: legacyNext(parts[3]),
      move: legacyMove(parts[4]),
    };
    const key = `${rule.state}\u0000${rule.read}`;
    const earlier = indexByKey.get(key);
    if (earlier === undefined) {
      indexByKey.set(key, rules.length);
      rules.push(rule);
      rowOfRule.push(i + 1);
    } else {
      warnings.push({ code: 'legacy-duplicate-row', row: rowOfRule[earlier], keptRow: i + 1, state: rule.state, read: rule.read });
      rules[earlier] = rule;
      rowOfRule[earlier] = i + 1;
    }
  }

  return {
    ok: true,
    machine: {
      format: MACHINE_FORMAT,
      name,
      tape: 'one-sided',
      leftEdge: 'reject',
      blank: LEGACY_BLANK,
      start: legacyState(lines[0].trim()),
      accept: [LEGACY_ACCEPT],
      reject: [LEGACY_REJECT],
      input: [...lines[1]].map(legacySymbol).join(''),
      rules,
    },
    warnings,
  };
}
