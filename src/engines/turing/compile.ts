import { isSingleSymbol } from './symbol';
import { isTuringRule, type Machine, type Op, type Rule } from './types';

export type MachineIssue =
  | { code: 'bad-blank' }
  | { code: 'empty-start' }
  | { code: 'empty-state'; ruleIndex: number; field: 'state' | 'next' }
  | { code: 'bad-symbol'; ruleIndex: number; field: 'read' | 'write' }
  | { code: 'bad-op'; ruleIndex: number; op: string }
  | { code: 'duplicate-rule'; ruleIndex: number; firstIndex: number; state: string; read: string };

/** A state that some rule or the start points to, but that has no rules and does not halt. */
export type MachineWarning = { code: 'state-without-rules'; state: string };

export interface CompiledRule {
  index: number;
  state: string;
  ops: Op[];
  next: string;
}

export interface CompiledMachine {
  machine: Machine;
  find(state: string, symbol: string): CompiledRule | undefined;
}

export type CompileResult =
  | { ok: true; compiled: CompiledMachine; warnings: MachineWarning[] }
  | { ok: false; issues: MachineIssue[]; warnings: MachineWarning[] };

/** The text used for "any symbol" in the duplicate-rule issue. */
export const ANY_SYMBOL_LABEL = '*any*';

function parseOp(text: string): Op | null {
  if (text === 'L' || text === 'R') return { kind: 'move', move: text };
  if (text === 'E') return { kind: 'erase' };
  const chars = [...text];
  if (chars.length === 2 && chars[0] === 'P') return { kind: 'print', symbol: chars[1] };
  return null;
}

function opsOf(rule: Rule, ruleIndex: number, issues: MachineIssue[]): Op[] {
  if (!isTuringRule(rule)) {
    if (!isSingleSymbol(rule.write)) issues.push({ code: 'bad-symbol', ruleIndex, field: 'write' });
    return [
      { kind: 'print', symbol: rule.write },
      { kind: 'move', move: rule.move },
    ];
  }
  const ops: Op[] = [];
  for (const text of rule.ops) {
    const op = parseOp(text);
    if (op === null) issues.push({ code: 'bad-op', ruleIndex, op: text });
    else ops.push(op);
  }
  return ops;
}

/** The lookup key for a rule's read field: a symbol, or ANY_SYMBOL_LABEL for "any". */
function readKey(rule: Rule, blank: string): string | null {
  if (typeof rule.read === 'string') return isSingleSymbol(rule.read) ? rule.read : null;
  return rule.read.match === 'blank' ? blank : ANY_SYMBOL_LABEL;
}

/** Checks a machine and builds a fast rule lookup. Returns every issue found, not only the first. */
export function compileMachine(machine: Machine): CompileResult {
  const issues: MachineIssue[] = [];
  if (!isSingleSymbol(machine.blank)) issues.push({ code: 'bad-blank' });
  if (machine.start.trim() === '') issues.push({ code: 'empty-start' });

  const byKey = new Map<string, CompiledRule>();
  machine.rules.forEach((rule, ruleIndex) => {
    if (rule.state.trim() === '') issues.push({ code: 'empty-state', ruleIndex, field: 'state' });
    if (rule.next.trim() === '') issues.push({ code: 'empty-state', ruleIndex, field: 'next' });
    const ops = opsOf(rule, ruleIndex, issues);
    const read = readKey(rule, machine.blank);
    if (read === null) {
      issues.push({ code: 'bad-symbol', ruleIndex, field: 'read' });
      return;
    }
    const key = `${rule.state}\u0000${read}`;
    const first = byKey.get(key);
    if (first !== undefined) {
      issues.push({ code: 'duplicate-rule', ruleIndex, firstIndex: first.index, state: rule.state, read });
      return;
    }
    byKey.set(key, { index: ruleIndex, state: rule.state, ops, next: rule.next });
  });

  const warnings = findStatesWithoutRules(machine);
  if (issues.length > 0) return { ok: false, issues, warnings };

  const find = (state: string, symbol: string): CompiledRule | undefined => {
    const exact = byKey.get(`${state}\u0000${symbol}`);
    if (exact !== undefined || symbol === machine.blank) return exact;
    return byKey.get(`${state}\u0000${ANY_SYMBOL_LABEL}`);
  };
  return { ok: true, compiled: { machine, find }, warnings };
}

function findStatesWithoutRules(machine: Machine): MachineWarning[] {
  const withRules = new Set(machine.rules.map((rule) => rule.state));
  const halting = new Set([...machine.accept, ...machine.reject]);
  const targets = [machine.start, ...machine.rules.map((rule) => rule.next)];
  const missing = new Set(targets.filter((state) => state.trim() !== '' && !withRules.has(state) && !halting.has(state)));
  return [...missing].map((state) => ({ code: 'state-without-rules', state }));
}
