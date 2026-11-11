import {
  DEFAULT_STEP_LIMIT,
  isTuringRule,
  type LegacyWarning,
  type Machine,
  type MachineIssue,
  type MachineWarning,
  type Op,
  type Run,
  type StepOutcome,
} from '@/engines/turing';

/** Every key this file uses, in the "simulator" namespace of messages/en.json. */
export type SimKey =
  | 'step.ready'
  | 'step.write'
  | 'step.ops'
  | 'step.noOps'
  | 'step.noRule'
  | 'step.back'
  | 'op.print'
  | 'op.erase'
  | 'op.left'
  | 'op.right'
  | 'op.stay'
  | 'op.separator'
  | 'result.accepted'
  | 'result.acceptedBlank'
  | 'result.rejectState'
  | 'result.noRule'
  | 'result.leftEdge'
  | 'result.limit'
  | 'issue.badBlank'
  | 'issue.emptyStart'
  | 'issue.acceptAndReject'
  | 'issue.emptyState'
  | 'issue.badSymbol'
  | 'issue.badOp'
  | 'issue.duplicateRule'
  | 'warning.stateWithoutRules'
  | 'warning.legacyDuplicateRow';

type Values = Record<string, string | number>;

/** A message key with its values. `ops` holds the phrases of a 1936 rule, joined into {ops}. */
export interface SimMessage {
  key: SimKey;
  values: Values;
  ops?: SimMessage[];
}

/** The parts of next-intl's translator for the "simulator" namespace that this file needs. */
export interface SimTranslator {
  (key: SimKey, values?: Values): string;
  markup(key: SimKey, values?: Record<string, string | number | ((chunks: string) => string)>): string;
}

/** The values of a message, with a 1936 rule's operations joined into one phrase. */
export function messageValues(t: SimTranslator, message: SimMessage): Values {
  if (message.ops === undefined) return message.values;
  const ops = message.ops.map((op) => t(op.key, op.values)).join(t('op.separator'));
  return { ...message.values, ops };
}

/** The message as plain text, without the <b> marks: for the live region and for tests. */
export function plainText(t: SimTranslator, message: SimMessage): string {
  return t.markup(message.key, { ...messageValues(t, message), b: (chunks) => chunks });
}

/** One step as the store records it: the state and symbol before the step, and what happened. */
export interface LastStep {
  from: string;
  read: string;
  outcome: StepOutcome;
}

export type StepEvent =
  | { kind: 'ready'; state: string; cell: number }
  | { kind: 'step'; last: LastStep }
  | { kind: 'back'; state: string; cell: number };

function opMessage(op: Op): SimMessage {
  if (op.kind === 'print') return { key: 'op.print', values: { symbol: op.symbol } };
  if (op.kind === 'erase') return { key: 'op.erase', values: {} };
  if (op.move === 'L') return { key: 'op.left', values: {} };
  if (op.move === 'R') return { key: 'op.right', values: {} };
  return { key: 'op.stay', values: {} };
}

/** The sentence under the tape (spec 5.1): "In q1 reading 1: write 0, move left, go to q1." */
export function describeStep(machine: Machine, event: StepEvent): SimMessage {
  if (event.kind !== 'step') {
    return { key: event.kind === 'ready' ? 'step.ready' : 'step.back', values: { state: event.state, cell: event.cell } };
  }
  const { from, read, outcome } = event.last;
  const where = { state: from, symbol: read };
  if (outcome.rule === null) return { key: 'step.noRule', values: where };
  const { index, ops, next } = outcome.rule;
  const source = machine.rules[index];
  if (!isTuringRule(source)) {
    return { key: 'step.write', values: { ...where, write: source.write, move: source.move, next } };
  }
  if (ops.length === 0) return { key: 'step.noOps', values: { ...where, next } };
  return { key: 'step.ops', values: { ...where, next }, ops: ops.map(opMessage) };
}

/**
 * The result line (spec 5.1), or null while the machine can still run.
 * `pausedAtLimit` is true when the run loop stopped at the step limit.
 */
export function describeResult(run: Run, pausedAtLimit: boolean, limit: number = DEFAULT_STEP_LIMIT): SimMessage | null {
  const steps = run.steps;
  if (run.status === 'running') return pausedAtLimit ? { key: 'result.limit', values: { limit } } : null;
  if (run.status === 'accepted') {
    const tape = run.tape.toString();
    return tape === '' ? { key: 'result.acceptedBlank', values: { steps } } : { key: 'result.accepted', values: { steps, tape } };
  }
  const reason = run.reason;
  if (reason?.kind === 'no-rule') return { key: 'result.noRule', values: { state: reason.state, symbol: reason.symbol } };
  if (reason?.kind === 'left-edge') return { key: 'result.leftEdge', values: { state: reason.state } };
  return { key: 'result.rejectState', values: { state: run.state, steps } };
}

/** A compile issue as text. Rule numbers start at 1, as in the rule table. */
export function describeIssue(issue: MachineIssue): SimMessage {
  switch (issue.code) {
    case 'bad-blank':
      return { key: 'issue.badBlank', values: {} };
    case 'empty-start':
      return { key: 'issue.emptyStart', values: {} };
    case 'accept-and-reject':
      return { key: 'issue.acceptAndReject', values: { state: issue.state } };
    case 'empty-state':
      return { key: 'issue.emptyState', values: { rule: issue.ruleIndex + 1, field: issue.field } };
    case 'bad-symbol':
      return { key: 'issue.badSymbol', values: { rule: issue.ruleIndex + 1, field: issue.field } };
    case 'bad-op':
      return { key: 'issue.badOp', values: { rule: issue.ruleIndex + 1, op: issue.op } };
    case 'duplicate-rule':
      return {
        key: 'issue.duplicateRule',
        values: { first: issue.firstIndex + 1, rule: issue.ruleIndex + 1, state: issue.state, symbol: issue.read },
      };
  }
}

/** A compile warning or a 2016 import warning as text. */
export function describeWarning(warning: MachineWarning | LegacyWarning): SimMessage {
  if (warning.code === 'state-without-rules') return { key: 'warning.stateWithoutRules', values: { state: warning.state } };
  return {
    key: 'warning.legacyDuplicateRow',
    values: { row: warning.row, keptRow: warning.keptRow, state: warning.state, symbol: warning.read },
  };
}
