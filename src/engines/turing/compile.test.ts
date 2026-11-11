import { describe, expect, it } from 'vitest';
import { compileMachine } from './compile';
import { machine } from './test-helpers';

describe('compileMachine', () => {
  it('finds a modern rule by state and symbol', () => {
    const result = compileMachine(machine([{ state: 'q0', read: '1', write: '0', move: 'R', next: 'qA' }]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.compiled.find('q0', '1')).toEqual({
      index: 0,
      state: 'q0',
      next: 'qA',
      ops: [
        { kind: 'print', symbol: '0' },
        { kind: 'move', move: 'R' },
      ],
    });
    expect(result.compiled.find('q0', '0')).toBeUndefined();
  });

  it('reports two rules for the same state and symbol', () => {
    const result = compileMachine(
      machine([
        { state: 'q1', read: '1', write: '0', move: 'L', next: 'q1' },
        { state: 'q1', read: '1', write: '1', move: 'R', next: 'qA' },
      ]),
    );
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'duplicate-rule', ruleIndex: 1, firstIndex: 0, state: 'q1', read: '1' }],
    });
  });

  it('treats a "blank" matcher and a rule reading the blank symbol as the same rule', () => {
    const result = compileMachine(
      machine([
        { state: 'q0', read: { match: 'blank' }, ops: ['R'], next: 'q0' },
        { state: 'q0', read: '_', write: '_', move: 'R', next: 'q0' },
      ]),
    );
    expect(result).toMatchObject({ ok: false, issues: [{ code: 'duplicate-rule', ruleIndex: 1 }] });
  });

  it('reports symbols that are empty or longer than one character', () => {
    const result = compileMachine(
      machine([
        { state: 'q0', read: '', write: '0', move: 'R', next: 'q0' },
        { state: 'q0', read: '1', write: '00', move: 'R', next: 'q0' },
      ]),
    );
    expect(result).toMatchObject({
      ok: false,
      issues: [
        { code: 'bad-symbol', ruleIndex: 0, field: 'read' },
        { code: 'bad-symbol', ruleIndex: 1, field: 'write' },
      ],
    });
  });

  it('reports empty states, a bad blank, an empty start and unknown 1936 operations', () => {
    const result = compileMachine(
      machine([{ state: ' ', read: '1', ops: ['P1', 'X'], next: '' }], { blank: '', start: '' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual(
      expect.arrayContaining([
        { code: 'bad-blank' },
        { code: 'empty-start' },
        { code: 'empty-state', ruleIndex: 0, field: 'state' },
        { code: 'empty-state', ruleIndex: 0, field: 'next' },
        { code: 'bad-op', ruleIndex: 0, op: 'X' },
      ]),
    );
  });

  it('warns about a next state that has no rules and does not halt', () => {
    const result = compileMachine(machine([{ state: 'q0', read: '1', write: '1', move: 'R', next: 'q5' }]));
    expect(result.warnings).toEqual([{ code: 'state-without-rules', state: 'q5' }]);
  });

  it('matches "any" for every symbol except the blank, and an exact rule wins over "any"', () => {
    const result = compileMachine(
      machine([
        { state: 'q0', read: { match: 'any' }, ops: ['R'], next: 'q0' },
        { state: 'q0', read: 'x', ops: ['E'], next: 'q0' },
      ]),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.compiled.find('q0', 'a')?.index).toBe(0);
    expect(result.compiled.find('q0', 'x')?.index).toBe(1);
    expect(result.compiled.find('q0', '_')).toBeUndefined();
  });

  it('parses 1936 operations P<symbol>, E, L and R', () => {
    const result = compileMachine(machine([{ state: 'b', read: { match: 'blank' }, ops: ['P𝔟', 'R', 'E', 'L'], next: 'b' }], { start: 'b' }));
    if (!result.ok) throw new Error('expected ok');
    expect(result.compiled.find('b', '_')?.ops).toEqual([
      { kind: 'print', symbol: '𝔟' },
      { kind: 'move', move: 'R' },
      { kind: 'erase' },
      { kind: 'move', move: 'L' },
    ]);
  });
});
