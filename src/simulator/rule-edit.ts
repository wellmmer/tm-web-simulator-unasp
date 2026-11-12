import { isTuringRule, MACHINE_FORMAT, type Machine, type MachineIssue, type Rule } from '@/engines/turing';

/** The columns of the rule table that can hold a mistake. */
export type RuleField = 'state' | 'read' | 'write' | 'ops' | 'next';

/** The short hint next to a marked field, a key in "simulator.table.hint". */
export type FieldHint = 'emptyState' | 'badSymbol' | 'badOp';

/** What is wrong with one rule: its marked fields, and the other rule for the same state and symbol. */
export interface RuleProblem {
  fields: Partial<Record<RuleField, FieldHint>>;
  /** `isFirst` is true for the earlier of the two rules; the message sits under the later one. */
  duplicate: { state: string; symbol: string; isFirst: boolean } | null;
}

/**
 * Reads Turing's operations, such as "P0, R". Commas and spaces separate them. After P, the next
 * character is the symbol, even a comma or a space, so "P,, R" prints a comma.
 * A wrong operation stays as it is, so compileMachine can report it.
 */
export function parseOps(text: string): string[] {
  const chars = [...text];
  const ops: string[] = [];
  let i = 0;
  while (i < chars.length) {
    if (chars[i] === ',' || chars[i].trim() === '') {
      i += 1;
      continue;
    }
    if (chars[i] === 'P') {
      ops.push(chars.slice(i, i + 2).join(''));
      i += 2;
      continue;
    }
    let op = '';
    while (i < chars.length && chars[i] !== ',' && chars[i].trim() !== '') op += chars[i++];
    ops.push(op);
  }
  return ops;
}

/** A rule's operations as Turing wrote them: "P0, R". A modern rule becomes "P1, R". */
export function opsText(rule: Rule): string {
  if (isTuringRule(rule)) return rule.ops.join(', ');
  return rule.move === 'S' ? `P${rule.write}` : `P${rule.write}, ${rule.move}`;
}

/** Reads a list of states such as "qA, qB". Empty names are dropped. */
export function parseStateList(text: string): string[] {
  return text
    .split(',')
    .map((state) => state.trim())
    .filter((state) => state !== '');
}

/** True when the rule table shows Turing's 1936 columns: operations instead of write and move. */
export function isTuringTable(machine: Machine): boolean {
  return machine.notation === 'turing1936' || machine.rules.some(isTuringRule);
}

/** Adds an empty rule from the start state. Its empty symbols are marked until the visitor fills them in. */
export function addRule(machine: Machine): Machine {
  const { start } = machine;
  const rule: Rule = isTuringTable(machine)
    ? { state: start, read: '', ops: [], next: start }
    : { state: start, read: '', write: '', move: 'R', next: start };
  return { ...machine, rules: [...machine.rules, rule] };
}

export function updateRule(machine: Machine, index: number, rule: Rule): Machine {
  return { ...machine, rules: machine.rules.map((old, i) => (i === index ? rule : old)) };
}

export function deleteRule(machine: Machine, index: number): Machine {
  return { ...machine, rules: machine.rules.filter((_, i) => i !== index) };
}

/** A new machine (spec 3 and 8): one-sided, with no rules yet. */
export function newMachine(name: string): Machine {
  return {
    format: MACHINE_FORMAT,
    name,
    tape: 'one-sided',
    blank: '_',
    start: 'q0',
    accept: ['qA'],
    reject: ['qR'],
    input: '',
    rules: [],
  };
}

/** Groups the compile issues by rule, so the table can mark each field and each duplicate row. */
export function ruleProblems(issues: MachineIssue[]): Map<number, RuleProblem> {
  const problems = new Map<number, RuleProblem>();
  const problemOf = (index: number): RuleProblem => {
    let problem = problems.get(index);
    if (problem === undefined) {
      problem = { fields: {}, duplicate: null };
      problems.set(index, problem);
    }
    return problem;
  };
  for (const issue of issues) {
    if (issue.code === 'empty-state') problemOf(issue.ruleIndex).fields[issue.field] = 'emptyState';
    if (issue.code === 'bad-symbol') problemOf(issue.ruleIndex).fields[issue.field] = 'badSymbol';
    if (issue.code === 'bad-op') problemOf(issue.ruleIndex).fields.ops = 'badOp';
    if (issue.code === 'duplicate-rule') {
      problemOf(issue.firstIndex).duplicate = { state: issue.state, symbol: issue.read, isFirst: true };
      problemOf(issue.ruleIndex).duplicate = { state: issue.state, symbol: issue.read, isFirst: false };
    }
  }
  return problems;
}
