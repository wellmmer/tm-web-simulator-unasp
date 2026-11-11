import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseMachine, serializeMachine } from './format';
import { machine } from './test-helpers';
import type { Machine } from './types';

describe('parseMachine', () => {
  it('reads a valid machine', () => {
    const m = machine([{ state: 'q0', read: '1', write: '1', move: 'R', next: 'qA' }]);
    expect(parseMachine(JSON.stringify(m))).toEqual({ ok: true, machine: m });
  });

  it('rejects text that is not JSON', () => {
    expect(parseMachine('{oops')).toEqual({ ok: false, error: { code: 'not-json' } });
  });

  it('rejects JSON without the Computable format tag', () => {
    expect(parseMachine('{"rules": []}')).toEqual({ ok: false, error: { code: 'not-a-machine' } });
  });

  it('names a missing field', () => {
    const withoutRules: Partial<Machine> = machine([]);
    delete withoutRules.rules;
    expect(parseMachine(JSON.stringify(withoutRules))).toEqual({ ok: false, error: { code: 'missing-field', field: 'rules' } });
  });

  it('names a field with a wrong value inside a rule', () => {
    const bad = machine([{ state: 'q0', read: '1', write: '1', move: 'R', next: 'qA' }]);
    const text = JSON.stringify(bad).replace('"move":"R"', '"move":"X"');
    expect(parseMachine(text)).toEqual({ ok: false, error: { code: 'bad-field', field: 'rules.0.move' } });
  });

  it('names a missing field inside a modern rule', () => {
    const bad = machine([{ state: 'q0', read: '1', write: '1', move: 'R', next: 'qA' }]);
    const text = JSON.stringify(bad).replace(',"move":"R"', '');
    expect(parseMachine(text)).toEqual({ ok: false, error: { code: 'missing-field', field: 'rules.0.move' } });
  });

  it('names an unknown field, so a typo is not ignored', () => {
    const text = JSON.stringify({ ...machine([]), leftedge: 'reject' });
    expect(parseMachine(text)).toEqual({ ok: false, error: { code: 'bad-field', field: 'leftedge' } });
  });

  it('names a modern field inside a 1936 rule, so no field is lost', () => {
    const text = JSON.stringify(machine([{ state: 'b', read: '0', ops: ['P0'], next: 'b' }])).replace(
      '"ops":["P0"]',
      '"ops":["P0"],"write":"1"',
    );
    expect(parseMachine(text)).toEqual({ ok: false, error: { code: 'bad-field', field: 'rules.0.write' } });
  });

  it('names an unknown field inside a read matcher', () => {
    const text = JSON.stringify(machine([{ state: 'b', read: { match: 'blank' }, ops: ['P0'], next: 'b' }])).replace(
      '{"match":"blank"}',
      '{"match":"blank","x":1}',
    );
    expect(parseMachine(text)).toEqual({ ok: false, error: { code: 'bad-field', field: 'rules.0.read.x' } });
  });

  it('names a wrong field inside a 1936 rule', () => {
    const bad = machine([{ state: 'b', read: { match: 'blank' }, ops: ['P0'], next: 'b' }]);
    const text = JSON.stringify(bad).replace('"ops":["P0"]', '"ops":"P0"');
    expect(parseMachine(text)).toEqual({ ok: false, error: { code: 'bad-field', field: 'rules.0.ops' } });
  });
});

const symbol = fc.constantFrom('0', '1', '_', ',', '𝔟', 'x');
const state = fc.constantFrom('q0', 'q1', 'qA', '𝔟');
const randomMachine: fc.Arbitrary<Machine> = fc
  .record({
    name: fc.string(),
    tape: fc.constantFrom('one-sided' as const, 'two-way' as const),
    input: fc.array(symbol).map((s) => s.join('')),
    rules: fc.array(
      fc.oneof(
        fc.record({ state, read: symbol, write: symbol, move: fc.constantFrom('L' as const, 'R' as const, 'S' as const), next: state }),
        fc.record({
          state,
          read: fc.oneof(symbol, fc.constant({ match: 'any' as const }), fc.constant({ match: 'blank' as const })),
          ops: fc.array(fc.constantFrom('P0', 'R', 'L', 'E')),
          next: state,
        }),
      ),
    ),
  })
  .map(({ rules, ...rest }) => machine(rules, rest));

describe('serializeMachine', () => {
  it('save then load gives back the same machine', () => {
    fc.assert(
      fc.property(randomMachine, (m) => {
        expect(parseMachine(serializeMachine(m))).toEqual({ ok: true, machine: m });
      }),
    );
  });
});
