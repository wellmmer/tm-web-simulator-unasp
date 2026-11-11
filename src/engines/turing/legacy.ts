import { MACHINE_FORMAT } from './format';
import type { Machine, ModernRule, Move } from './types';

/**
 * The blank for imported 2016 machines. The 2016 app used a space as the blank, and its
 * example uses "_" as an ordinary symbol, so the blank cannot be "_".
 */
export const LEGACY_BLANK = '␣';

export type LegacyError = { code: 'legacy-too-short' } | { code: 'legacy-bad-row'; row: number };
export type LegacyResult = { ok: true; machine: Machine } | { ok: false; error: LegacyError };

function legacyState(value: string): string {
  if (value === 'A' || value === 'a') return 'qA';
  if (value === 'R' || value === 'r') return 'qR';
  return `q${value}`;
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
 * rule per line: `state,read,write,next,dir,`. `row` in errors is the 1-based line number.
 */
export function parseLegacy(text: string, name: string): LegacyResult {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2 || lines[0].trim() === '') return { ok: false, error: { code: 'legacy-too-short' } };

  const rules: ModernRule[] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const parts = line.split(',');
    if (parts.length < 5 || parts[0] === '' || parts[1] === '' || parts[2] === '' || parts[3] === '') {
      return { ok: false, error: { code: 'legacy-bad-row', row: i + 1 } };
    }
    rules.push({
      state: legacyState(parts[0]),
      read: legacySymbol(parts[1]),
      write: legacySymbol(parts[2]),
      next: legacyState(parts[3]),
      move: legacyMove(parts[4]),
    });
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
      accept: ['qA'],
      reject: ['qR'],
      input: [...lines[1]].map(legacySymbol).join(''),
      rules,
    },
  };
}
