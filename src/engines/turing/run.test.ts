import { describe, expect, it } from 'vitest';
import { createRun, runUntilHalt, step, stepBack } from './run';
import { compiled, machine } from './test-helpers';

describe('step', () => {
  it('prints, moves and changes state', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '1', write: '0', move: 'R', next: 'q1' }], { input: '1' })));
    const outcome = step(run);
    expect(outcome).toEqual({ rule: expect.objectContaining({ index: 0 }), hitLeftEdge: false });
    expect(run).toMatchObject({ state: 'q1', head: 1, steps: 1 });
    expect(run.tape.toString()).toBe('0');
  });

  it('keeps the head in place on an S move', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '1', write: '1', move: 'S', next: 'q1' }], { input: '1' })));
    step(run);
    expect(run.head).toBe(0);
  });

  it('accepts on reaching an accept state and rejects on reaching a reject state', () => {
    const accepting = createRun(compiled(machine([{ state: 'q0', read: '_', write: '_', move: 'S', next: 'qA' }])));
    step(accepting);
    expect(accepting).toMatchObject({ status: 'accepted', reason: { kind: 'accept-state', state: 'qA' } });

    const rejecting = createRun(compiled(machine([{ state: 'q0', read: '_', write: '_', move: 'S', next: 'qR' }])));
    step(rejecting);
    expect(rejecting).toMatchObject({ status: 'rejected', reason: { kind: 'reject-state', state: 'qR' } });
  });

  it('rejects when no rule matches, without counting a step', () => {
    const run = createRun(compiled(machine([], { input: '1' })));
    expect(step(run)).toEqual({ rule: null, hitLeftEdge: false });
    expect(run).toMatchObject({ status: 'rejected', steps: 0, reason: { kind: 'no-rule', state: 'q0', symbol: '1' } });
  });

  it('does nothing once the run has halted', () => {
    const run = createRun(compiled(machine([], { start: 'qA' })));
    expect(run.status).toBe('accepted');
    expect(step(run)).toBeNull();
  });

  it('keeps the head on cell 0 when a one-sided tape moves left (Sipser)', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '_', write: 'x', move: 'L', next: 'q1' }])));
    expect(step(run)?.hitLeftEdge).toBe(true);
    expect(run).toMatchObject({ head: 0, state: 'q1', status: 'running' });
  });

  it('rejects at the left edge when the machine uses the 2016 rule', () => {
    const run = createRun(
      compiled(machine([{ state: 'q0', read: '_', write: 'x', move: 'L', next: 'q1' }], { leftEdge: 'reject' })),
    );
    step(run);
    expect(run).toMatchObject({ head: 0, status: 'rejected', reason: { kind: 'left-edge', state: 'q0' } });
    expect(run.tape.toString()).toBe('x');
  });

  it('accepts at the left edge with the 2016 rule when the same rule enters an accept state, as the 2016 app did', () => {
    const run = createRun(
      compiled(machine([{ state: 'q0', read: '1', write: '1', move: 'L', next: 'qA' }], { leftEdge: 'reject', input: '1' })),
    );
    expect(step(run)?.hitLeftEdge).toBe(true);
    expect(run).toMatchObject({ head: 0, state: 'qA', status: 'accepted' });
  });

  it('runs no more operations of a 1936 rule after it rejects at the left edge', () => {
    const run = createRun(
      compiled(machine([{ state: 'b', read: { match: 'blank' }, ops: ['L', 'P1', 'R'], next: 'b' }], { start: 'b', leftEdge: 'reject' })),
    );
    expect(step(run)?.hitLeftEdge).toBe(true);
    expect(run).toMatchObject({ head: 0, status: 'rejected', reason: { kind: 'left-edge', state: 'b' } });
    expect(run.tape.toString()).toBe('');
  });

  it('still enters the accept state of a 1936 rule that hits the left edge with the 2016 rule', () => {
    const run = createRun(
      compiled(machine([{ state: 'b', read: { match: 'blank' }, ops: ['L', 'P1'], next: 'qA' }], { start: 'b', leftEdge: 'reject' })),
    );
    step(run);
    expect(run).toMatchObject({ head: 0, state: 'qA', status: 'accepted' });
    expect(run.tape.toString()).toBe('');
  });

  it('moves to negative cells on a two-way tape', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '_', write: 'x', move: 'L', next: 'q0' }], { tape: 'two-way' })));
    step(run);
    step(run);
    expect(run.head).toBe(-2);
    expect(run.tape.toString()).toBe('xx');
  });

  it('runs every operation of a 1936 rule in order', () => {
    const run = createRun(compiled(machine([{ state: 'b', read: { match: 'blank' }, ops: ['P0', 'R', 'R', 'P1'], next: 'b' }], { start: 'b' })));
    step(run);
    expect(run.tape.toString()).toBe('0_1');
    expect(run.head).toBe(2);
  });
});

describe('stepBack', () => {
  it('restores the tape, head, state, step count and status', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '1', write: '0', move: 'R', next: 'qA' }], { input: '1' })));
    step(run);
    expect(stepBack(run)).toBe(true);
    expect(run).toMatchObject({ state: 'q0', head: 0, steps: 0, status: 'running', reason: null });
    expect(run.tape.toString()).toBe('1');
  });

  it('undoes a halt caused by a missing rule', () => {
    const run = createRun(compiled(machine([], { input: '1' })));
    step(run);
    stepBack(run);
    expect(run).toMatchObject({ status: 'running', reason: null, steps: 0 });
  });

  it('returns false when there is nothing to undo', () => {
    expect(stepBack(createRun(compiled(machine([]))))).toBe(false);
  });
});

describe('runUntilHalt', () => {
  it('stops at the step limit and can continue afterwards', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '_', write: '_', move: 'R', next: 'q0' }])));
    expect(runUntilHalt(run, 100)).toBe('limit');
    expect(run).toMatchObject({ steps: 100, status: 'running' });
    expect(runUntilHalt(run, 50)).toBe('limit');
    expect(run.steps).toBe(150);
  });

  it('returns halted when the machine halts', () => {
    const run = createRun(compiled(machine([{ state: 'q0', read: '_', write: '_', move: 'S', next: 'qA' }])));
    expect(runUntilHalt(run)).toBe('halted');
    expect(run.status).toBe('accepted');
  });
});
