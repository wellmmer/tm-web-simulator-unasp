export type Move = 'L' | 'R' | 'S';
export type TapeKind = 'one-sided' | 'two-way';

/** What happens when the head moves left from cell 0 on a one-sided tape. */
export type LeftEdge = 'stay' | 'reject';

/** Matchers from Turing's 1936 notation: "Any" (any symbol that is not blank) and "None" (blank). */
export type ReadMatcher = { match: 'any' } | { match: 'blank' };

/** A modern rule: print one symbol, then move once. */
export interface ModernRule {
  state: string;
  read: string;
  write: string;
  move: Move;
  next: string;
}

/** A rule in Turing's 1936 notation: a list of operations such as ["P0", "R"]. */
export interface TuringRule {
  state: string;
  read: string | ReadMatcher;
  ops: string[];
  next: string;
}

export type Rule = ModernRule | TuringRule;

export interface Machine {
  format: 'computable/machine@1';
  name: string;
  notation?: 'modern' | 'turing1936';
  tape: TapeKind;
  leftEdge?: LeftEdge;
  blank: string;
  start: string;
  accept: string[];
  reject: string[];
  input: string;
  rules: Rule[];
}

export type Op = { kind: 'print'; symbol: string } | { kind: 'erase' } | { kind: 'move'; move: Move };

export function isTuringRule(rule: Rule): rule is TuringRule {
  return 'ops' in rule;
}
