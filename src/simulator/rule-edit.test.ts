import { describe, expect, it } from 'vitest';
import { compileMachine } from '@/engines/turing';
import { machine } from '@/engines/turing/test-helpers';
import { examples } from './examples';
import {
  addRule,
  deleteRule,
  isTuringTable,
  newMachine,
  opsText,
  parseOps,
  parseStateList,
  ruleProblems,
  updateRule,
} from './rule-edit';

const modern = { state: 'q0', read: '1', write: '0', move: 'R', next: 'q1' } as const;

describe('parseOps', () => {
  it('reads operations separated by commas and spaces', () => {
    expect(parseOps('P0, R')).toEqual(['P0', 'R']);
    expect(parseOps(' R ,L,E ')).toEqual(['R', 'L', 'E']);
    expect(parseOps('')).toEqual([]);
  });

  it('takes the character after P as the symbol, even a comma or a space', () => {
    expect(parseOps('P,, R')).toEqual(['P,', 'R']);
    expect(parseOps('P , R')).toEqual(['P ', 'R']);
    expect(parseOps('P𝔟')).toEqual(['P𝔟']);
  });

  it('keeps a wrong operation as it is, so compileMachine can report it', () => {
    expect(parseOps('X1, R')).toEqual(['X1', 'R']);
    expect(parseOps('P')).toEqual(['P']);
  });
});

describe('opsText', () => {
  it('writes the operations as Turing did', () => {
    expect(opsText({ state: 'b', read: { match: 'blank' }, ops: ['P0', 'R'], next: 'c' })).toBe('P0, R');
    expect(opsText(modern)).toBe('P0, R');
    expect(opsText({ ...modern, move: 'S' })).toBe('P0');
  });
});

describe('parseStateList', () => {
  it('reads states separated by commas, without empty names', () => {
    expect(parseStateList('qA, qB ,')).toEqual(['qA', 'qB']);
    expect(parseStateList('  ')).toEqual([]);
  });
});

describe('rule changes', () => {
  it('adds a modern rule from the start state, with empty symbols to fill in', () => {
    const result = addRule(machine([modern]));
    expect(result.rules).toEqual([modern, { state: 'q0', read: '', write: '', move: 'R', next: 'q0' }]);
  });

  it('adds a 1936 rule to a machine in Turing notation', () => {
    const turing = examples['turing-1936'].machine;
    expect(addRule(turing).rules.at(-1)).toEqual({ state: '𝔟', read: '', ops: [], next: '𝔟' });
  });

  it('replaces and deletes one rule, and leaves the others alone', () => {
    const start = machine([modern, { ...modern, read: '0' }]);
    const changed = updateRule(start, 1, { ...modern, read: '_' });
    expect(changed.rules).toEqual([modern, { ...modern, read: '_' }]);
    expect(deleteRule(changed, 0).rules).toEqual([{ ...modern, read: '_' }]);
    expect(start.rules).toHaveLength(2);
  });

  it('knows when the table uses Turing notation', () => {
    expect(isTuringTable(examples['turing-1936'].machine)).toBe(true);
    expect(isTuringTable({ ...newMachine('Mine'), notation: 'turing1936' })).toBe(true);
    expect(isTuringTable(examples['binary-plus-one'].machine)).toBe(false);
  });
});

describe('newMachine', () => {
  it('starts one-sided with no rules (spec 3)', () => {
    expect(newMachine('My machine')).toEqual({
      format: 'computable/machine@1',
      name: 'My machine',
      tape: 'one-sided',
      blank: '_',
      start: 'q0',
      accept: ['qA'],
      reject: ['qR'],
      input: '',
      rules: [],
    });
  });
});

describe('ruleProblems', () => {
  it('marks the fields and the duplicate rows that compileMachine reports', () => {
    const result = compileMachine(
      machine([
        { state: '', read: '11', write: '0', move: 'R', next: 'q1' },
        { state: 'q1', read: '1', write: '0', move: 'L', next: '' },
        { state: 'q1', read: '1', write: '1', move: 'R', next: 'qA' },
        { state: 'q1', read: { match: 'any' }, ops: ['X'], next: 'qA' },
      ]),
    );
    if (result.ok) throw new Error('expected issues');
    const problems = ruleProblems(result.issues);
    expect(problems.get(0)).toEqual({ fields: { state: 'emptyState', read: 'badSymbol' }, duplicate: null });
    expect(problems.get(1)).toEqual({ fields: { next: 'emptyState' }, duplicate: { state: 'q1', symbol: '1', isFirst: true } });
    expect(problems.get(2)).toEqual({ fields: {}, duplicate: { state: 'q1', symbol: '1', isFirst: false } });
    expect(problems.get(3)).toEqual({ fields: { ops: 'badOp' }, duplicate: null });
  });
});
