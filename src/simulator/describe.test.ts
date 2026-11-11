import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { createRun, step, type Machine, type Run } from '@/engines/turing';
import { compiled, machine } from '@/engines/turing/test-helpers';
import { describeIssue, describeResult, describeStep, describeWarning, plainText, type LastStep } from './describe';
import { examples } from './examples';

const t = createTranslator({ locale: 'en', messages: en, namespace: 'simulator' });

/** Runs `count` steps and returns the last one, the way the store records it. */
function stepTimes(run: Run, count: number): LastStep {
  let last: LastStep | null = null;
  for (let i = 0; i < count; i++) {
    const from = run.state;
    const read = run.tape.read(run.head);
    const outcome = step(run);
    if (outcome === null) throw new Error('the run has halted');
    last = { from, read, outcome };
  }
  if (last === null) throw new Error('no step');
  return last;
}

const binary = examples['binary-plus-one'].machine;
const turing = examples['turing-1936'].machine;
const text = (m: Parameters<typeof plainText>[1]) => plainText(t, m);
const say = (m: Machine, last: LastStep) => text(describeStep(m, { kind: 'step', last }));

describe('the step sentence', () => {
  it('says where the head starts', () => {
    expect(text(describeStep(binary, { kind: 'ready', state: 'q0', cell: 0 }))).toBe(
      'Ready. The head starts on cell 0 in state q0.',
    );
  });

  it('explains a modern rule: write, move, go to', () => {
    const run = createRun(compiled(binary));
    expect(say(binary, stepTimes(run, 1))).toBe('In q0 reading 1: write 1, move right, go to q0.');
    expect(say(binary, stepTimes(run, 5))).toBe('In q1 reading 1: write 0, move left, go to q1.');
  });

  it('says "stay" for an S move', () => {
    const run = createRun(compiled(binary));
    expect(say(binary, stepTimes(run, 8))).toBe('In q1 reading 0: write 1, stay, go to qA.');
  });

  it("lists the operations of a Turing 1936 rule in Turing's state letters", () => {
    const run = createRun(compiled(turing));
    expect(say(turing, stepTimes(run, 1))).toBe('In 𝔟 reading _: print 0, move right, go to 𝔠.');
    expect(say(turing, stepTimes(run, 1))).toBe('In 𝔠 reading _: move right, go to 𝔢.');
  });

  it('says "erase" and handles a rule with no operations', () => {
    const m = machine(
      [
        { state: 'b', read: 'x', ops: ['E'], next: 'c' },
        { state: 'c', read: { match: 'blank' }, ops: [], next: 'qA' },
      ],
      { start: 'b', input: 'x' },
    );
    const run = createRun(compiled(m));
    expect(say(m, stepTimes(run, 1))).toBe('In b reading x: erase, go to c.');
    expect(say(m, stepTimes(run, 1))).toBe('In c reading _: go to qA.');
  });

  it('says that no rule matches', () => {
    const m = machine([{ state: 'q0', read: '0', write: '0', move: 'R', next: 'q0' }], { input: '1' });
    const run = createRun(compiled(m));
    expect(say(m, stepTimes(run, 1))).toBe('In q0 reading 1: no rule matches, so the machine stops.');
  });

  it('says where a step back leaves the head', () => {
    expect(text(describeStep(binary, { kind: 'back', state: 'q1', cell: 3 }))).toBe('Stepped back. State q1, head on cell 3.');
  });
});

describe('the result line', () => {
  it('says nothing while the machine runs', () => {
    expect(describeResult(createRun(compiled(binary)), false)).toBeNull();
  });

  it('gives the steps and the tape when Binary +1 accepts', () => {
    const run = createRun(compiled(binary));
    stepTimes(run, 8);
    expect(text(describeResult(run, false)!)).toBe('Accepted after 8 steps. The tape now reads 1100.');
  });

  it('says when the tape is blank', () => {
    const m = machine([{ state: 'q0', read: '_', write: '_', move: 'S', next: 'qA' }]);
    const run = createRun(compiled(m));
    stepTimes(run, 1);
    expect(text(describeResult(run, false)!)).toBe('Accepted after 1 step. The tape is now blank.');
  });

  it('names the state and symbol that have no rule', () => {
    const m = machine([{ state: 'q0', read: '0', write: '0', move: 'R', next: 'q3' }], { input: '01' });
    const run = createRun(compiled(m));
    stepTimes(run, 2);
    expect(text(describeResult(run, false)!)).toBe('Rejected: no rule for q3 reading 1.');
  });

  it('names the reject state', () => {
    const m = machine([{ state: 'q0', read: '1', write: '1', move: 'R', next: 'qR' }], { input: '1' });
    const run = createRun(compiled(m));
    stepTimes(run, 1);
    expect(text(describeResult(run, false)!)).toBe('Rejected: the machine reached qR after 1 step.');
  });

  it('explains the 2016 left-edge rule', () => {
    const m = machine([{ state: 'q0', read: '_', write: '_', move: 'L', next: 'q0' }], { leftEdge: 'reject' });
    const run = createRun(compiled(m));
    stepTimes(run, 1);
    expect(text(describeResult(run, false)!)).toBe('Rejected: the head tried to move left of cell 0 in q0.');
  });

  it('asks to continue after the step limit', () => {
    expect(text(describeResult(createRun(compiled(turing)), true)!)).toBe(
      'Paused after 10,000 steps. This machine may never halt. Continue?',
    );
  });
});

describe('issues and warnings', () => {
  it('explains two rules for the same state and symbol', () => {
    expect(text(describeIssue({ code: 'duplicate-rule', ruleIndex: 1, firstIndex: 0, state: 'q1', read: '1' }))).toBe(
      'Rules 1 and 2: two rules for q1 reading 1. A Turing machine needs exactly one.',
    );
  });

  it('explains a state that is both accept and reject', () => {
    expect(text(describeIssue({ code: 'accept-and-reject', state: 'qH' }))).toBe(
      'qH is both an accept state and a reject state. A state can only be one.',
    );
  });

  it('explains a next state without rules', () => {
    expect(text(describeWarning({ code: 'state-without-rules', state: 'q5' }))).toBe(
      'q5 has no rules yet. The machine will stop there and reject.',
    );
  });

  it('explains which of two 2016 rows the machine uses', () => {
    expect(text(describeWarning({ code: 'legacy-duplicate-row', row: 3, keptRow: 5, state: 'q0', read: '1' }))).toBe(
      'Lines 3 and 5 both give a rule for q0 reading 1. The machine uses line 5, as the 2016 app did.',
    );
  });
});
