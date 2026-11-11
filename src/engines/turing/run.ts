import type { CompiledMachine, CompiledRule } from './compile';
import { Tape } from './tape';

export const DEFAULT_STEP_LIMIT = 10_000;

export type RunStatus = 'running' | 'accepted' | 'rejected';

export type HaltReason =
  | { kind: 'accept-state'; state: string }
  | { kind: 'reject-state'; state: string }
  | { kind: 'no-rule'; state: string; symbol: string }
  | { kind: 'left-edge'; state: string };

/** What one step changed, so the step can be undone exactly. */
export interface StepRecord {
  ruleIndex: number | null;
  fromState: string;
  fromHead: number;
  fromStatus: RunStatus;
  fromReason: HaltReason | null;
  writes: Array<{ cell: number; before: string }>;
}

export interface Run {
  readonly compiled: CompiledMachine;
  readonly tape: Tape;
  state: string;
  head: number;
  /** The number of rules applied. A halt because no rule matches does not count. */
  steps: number;
  status: RunStatus;
  reason: HaltReason | null;
  readonly history: StepRecord[];
}

export interface StepOutcome {
  /** The rule that was applied, or null when the machine halted because no rule matches. */
  rule: CompiledRule | null;
  /** True when the head tried to move left from cell 0 on a one-sided tape. */
  hitLeftEdge: boolean;
}

function haltCheck(compiled: CompiledMachine, state: string): { status: RunStatus; reason: HaltReason | null } {
  if (compiled.machine.accept.includes(state)) return { status: 'accepted', reason: { kind: 'accept-state', state } };
  if (compiled.machine.reject.includes(state)) return { status: 'rejected', reason: { kind: 'reject-state', state } };
  return { status: 'running', reason: null };
}

/** Starts a run at cell 0 in the start state. `input` defaults to the machine's own input. */
export function createRun(compiled: CompiledMachine, input: string = compiled.machine.input): Run {
  const { start, blank } = compiled.machine;
  return {
    compiled,
    tape: new Tape(blank, input),
    state: start,
    head: 0,
    steps: 0,
    ...haltCheck(compiled, start),
    history: [],
  };
}

/** Applies one rule. Does nothing and returns null when the run has already halted. */
export function step(run: Run): StepOutcome | null {
  if (run.status !== 'running') return null;
  const record: StepRecord = {
    ruleIndex: null,
    fromState: run.state,
    fromHead: run.head,
    fromStatus: run.status,
    fromReason: run.reason,
    writes: [],
  };
  run.history.push(record);

  const symbol = run.tape.read(run.head);
  const rule = run.compiled.find(run.state, symbol);
  if (rule === undefined) {
    run.status = 'rejected';
    run.reason = { kind: 'no-rule', state: run.state, symbol };
    return { rule: null, hitLeftEdge: false };
  }

  record.ruleIndex = rule.index;
  run.steps += 1;
  const { tape: tapeKind, leftEdge = 'stay' } = run.compiled.machine;
  let hitLeftEdge = false;
  for (const op of rule.ops) {
    if (op.kind === 'print' || op.kind === 'erase') {
      record.writes.push({ cell: run.head, before: run.tape.read(run.head) });
      run.tape.write(run.head, op.kind === 'print' ? op.symbol : run.tape.blank);
    } else if (op.move === 'R') {
      run.head += 1;
    } else if (op.move === 'L') {
      if (tapeKind === 'one-sided' && run.head === 0) {
        hitLeftEdge = true;
      } else {
        run.head -= 1;
      }
    }
  }
  const halt = haltCheck(run.compiled, rule.next);
  // The 2016 rule rejects a move off the left edge, but only when this same rule does not
  // already enter an accept or reject state: the 2016 app checked the edge on the next step.
  if (hitLeftEdge && leftEdge === 'reject' && halt.status === 'running') {
    run.status = 'rejected';
    run.reason = { kind: 'left-edge', state: run.state };
    return { rule, hitLeftEdge };
  }
  run.state = rule.next;
  run.status = halt.status;
  run.reason = halt.reason;
  return { rule, hitLeftEdge };
}

/** Undoes the last step. Returns false when there is nothing to undo. */
export function stepBack(run: Run): boolean {
  const record = run.history.pop();
  if (record === undefined) return false;
  for (let i = record.writes.length - 1; i >= 0; i--) {
    const { cell, before } = record.writes[i];
    run.tape.write(cell, before);
  }
  if (record.ruleIndex !== null) run.steps -= 1;
  run.state = record.fromState;
  run.head = record.fromHead;
  run.status = record.fromStatus;
  run.reason = record.fromReason;
  return true;
}

/**
 * Steps until the machine halts or `limit` more steps have run.
 * Returns 'limit' when it stopped because of the limit; the run can then continue.
 */
export function runUntilHalt(run: Run, limit: number = DEFAULT_STEP_LIMIT): 'halted' | 'limit' {
  for (let count = 0; count < limit; count++) {
    if (step(run) === null) return 'halted';
    if (run.status !== 'running') return 'halted';
  }
  return run.status === 'running' ? 'limit' : 'halted';
}
