import { isTuringRule, type Machine, type Rule } from '@/engines/turing';

/** The distance between two columns and between two states in a column, in diagram pixels. */
export const COLUMN_GAP = 160;
export const ROW_GAP = 110;

export interface DiagramNode {
  /** The state's name. */
  id: string;
  /** The centre of the state's circle. */
  x: number;
  y: number;
  start: boolean;
  accept: boolean;
  reject: boolean;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  /** The rules from `source` to `target`, in table order. */
  ruleIndexes: number[];
  /** True when the rules stay in the same state: the edge is drawn as a loop. */
  loop: boolean;
  /** How far the middle of the edge bends away from the straight line, in diagram pixels. */
  bend: number;
}

export interface DiagramLayout {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/** The words for Turing's "any symbol" and "blank" matchers in an edge label. */
export interface MatcherWords {
  any: string;
  blank: string;
}

/** A rule on an edge: "0→1,R" for a modern rule, "blank→P0,R" for a 1936 rule. */
export function ruleLabel(rule: Rule, words: MatcherWords): string {
  return isTuringRule(rule) ? `${readLabel(rule, words)}→${rule.ops.join(',')}` : `${readLabel(rule, words)}→${rule.write},${rule.move}`;
}

function readLabel(rule: Rule, words: MatcherWords): string {
  return typeof rule.read === 'string' ? rule.read : words[rule.read.match];
}

/**
 * What a joined label ends with: the move of a modern rule that writes the symbol it reads, or the
 * operations of a 1936 rule. Null for a modern rule that writes another symbol: it never joins.
 */
function joinedEnd(rule: Rule): string | null {
  if (isTuringRule(rule)) return rule.ops.join(',');
  return rule.write === rule.read ? rule.move : null;
}

/**
 * The label of one edge (spec section 1). Rules with the same end join into one label, such as
 * "w y z x → R". A rule that joins no other keeps its full form, such as "1→0,L". The labels keep the
 * rule table's order: a joined label stands where its first rule stands.
 */
export function edgeLabel(rules: Rule[], words: MatcherWords): string {
  const groups: { end: string | null; rules: Rule[] }[] = [];
  for (const rule of rules) {
    const end = joinedEnd(rule);
    const group = end === null ? undefined : groups.find((candidate) => candidate.end === end);
    if (group === undefined) groups.push({ end, rules: [rule] });
    else group.rules.push(rule);
  }
  return groups
    .map(({ end, rules: joined }) =>
      joined.length === 1 ? ruleLabel(joined[0], words) : `${joined.map((rule) => readLabel(rule, words)).join(' ')} → ${end}`.trimEnd(),
    )
    .join('  ');
}

/**
 * A layered layout (spec 5.1): each state sits in the column of its distance from the start state,
 * found by a breadth-first search over the rules in table order. States with rules that the search
 * does not reach go in one last column. Accept and reject states that no rule reaches are left out.
 * The same machine always gives the same layout.
 */
export function layoutDiagram(machine: Machine): DiagramLayout {
  const rules = machine.rules.filter((rule) => rule.state.trim() !== '' && rule.next.trim() !== '');
  const nextStates = new Map<string, string[]>();
  for (const rule of rules) nextStates.set(rule.state, [...(nextStates.get(rule.state) ?? []), rule.next]);

  const depth = new Map<string, number>();
  const order: string[] = [];
  const visit = (state: string, level: number) => {
    if (depth.has(state)) return;
    depth.set(state, level);
    order.push(state);
  };
  if (machine.start.trim() !== '') visit(machine.start, 0);
  for (let i = 0; i < order.length; i++) {
    for (const next of nextStates.get(order[i]) ?? []) visit(next, depth.get(order[i])! + 1);
  }
  const lastColumn = order.length === 0 ? 0 : Math.max(...depth.values()) + 1;
  for (const rule of rules) {
    visit(rule.state, lastColumn);
    visit(rule.next, lastColumn);
  }

  const columns = new Map<number, string[]>();
  for (const state of order) columns.set(depth.get(state)!, [...(columns.get(depth.get(state)!) ?? []), state]);
  const nodes = order.map((id): DiagramNode => {
    const column = columns.get(depth.get(id)!)!;
    return {
      id,
      x: depth.get(id)! * COLUMN_GAP,
      y: (column.indexOf(id) - (column.length - 1) / 2) * ROW_GAP,
      start: id === machine.start,
      accept: machine.accept.includes(id),
      reject: machine.reject.includes(id),
    };
  });

  const byPair = new Map<string, DiagramEdge>();
  machine.rules.forEach((rule, index) => {
    if (rule.state.trim() === '' || rule.next.trim() === '') return;
    const key = `${rule.state}\u0000${rule.next}`;
    const edge = byPair.get(key);
    if (edge !== undefined) edge.ruleIndexes.push(index);
    else byPair.set(key, { id: `e${byPair.size}`, source: rule.state, target: rule.next, ruleIndexes: [index], loop: rule.state === rule.next, bend: 0 });
  });
  const edges = [...byPair.values()];
  for (const edge of edges) {
    if (edge.loop) continue;
    const from = depth.get(edge.source)!;
    const to = depth.get(edge.target)!;
    // Two edges that point at each other bend to opposite sides; an edge back or across a column bends away from the states.
    if (byPair.has(`${edge.target}\u0000${edge.source}`)) edge.bend = 30;
    else if (to <= from) edge.bend = 50;
    else if (to - from > 1) edge.bend = 40;
  }
  return { nodes, edges };
}
