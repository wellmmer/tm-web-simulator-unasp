import { describe, expect, it } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { COLUMN_GAP, edgeLabel, layoutDiagram, ROW_GAP, ruleLabel } from './diagram-layout';
import { examples } from './examples';

const words = { any: 'any', blank: 'blank' };

describe('layoutDiagram', () => {
  it('puts each state in the column of its distance from the start state', () => {
    const { nodes } = layoutDiagram(examples['binary-plus-one'].machine);
    expect(nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: 'q0', x: 0, y: 0 },
      { id: 'q1', x: COLUMN_GAP, y: 0 },
      { id: 'qA', x: 2 * COLUMN_GAP, y: 0 },
    ]);
    expect(nodes.map((node) => [node.start, node.accept, node.reject])).toEqual([
      [true, false, false],
      [false, false, false],
      [false, true, false],
    ]);
  });

  it('draws one edge per pair of states, with every rule of the pair, and loops for rules that stay', () => {
    const { edges } = layoutDiagram(examples['binary-plus-one'].machine);
    expect(edges.map(({ source, target, ruleIndexes, loop }) => ({ source, target, ruleIndexes, loop }))).toEqual([
      { source: 'q0', target: 'q0', ruleIndexes: [0, 1], loop: true },
      { source: 'q0', target: 'q1', ruleIndexes: [2], loop: false },
      { source: 'q1', target: 'q1', ruleIndexes: [3], loop: true },
      { source: 'q1', target: 'qA', ruleIndexes: [4, 5], loop: false },
    ]);
  });

  it('centres the states of one column above each other, in the order the search finds them', () => {
    const { nodes } = layoutDiagram(examples.palindrome.machine);
    const column = (x: number) => nodes.filter((node) => node.x === x).map(({ id, y }) => [id, y]);
    expect(column(COLUMN_GAP)).toEqual([
      ['q1', -ROW_GAP],
      ['q2', 0],
      ['qA', ROW_GAP],
    ]);
    expect(nodes.find((node) => node.id === 'qR')).toMatchObject({ reject: true });
  });

  it('bends an edge that goes back, and both edges of a pair that point at each other', () => {
    const { edges } = layoutDiagram(examples['turing-1936'].machine);
    expect(edges.map(({ source, target, bend }) => [source, target, bend])).toEqual([
      ['𝔟', '𝔠', 0],
      ['𝔠', '𝔢', 0],
      ['𝔢', '𝔨', 0],
      ['𝔨', '𝔟', 50],
    ]);
    const pair = layoutDiagram(
      machine([
        { state: 'q0', read: '0', write: '0', move: 'R', next: 'q1' },
        { state: 'q1', read: '0', write: '0', move: 'L', next: 'q0' },
      ]),
    );
    expect(pair.edges.map((edge) => edge.bend)).toEqual([30, 30]);
  });

  it('leaves out halting states that no rule reaches, and puts unreachable states with rules in a last column', () => {
    const { nodes } = layoutDiagram(
      machine([
        { state: 'q0', read: '0', write: '0', move: 'R', next: 'qA' },
        { state: 'q7', read: '0', write: '0', move: 'R', next: 'q7' },
        { state: '', read: '0', write: '0', move: 'R', next: 'q0' },
      ]),
    );
    expect(nodes.map(({ id, x }) => [id, x])).toEqual([
      ['q0', 0],
      ['qA', COLUMN_GAP],
      ['q7', 2 * COLUMN_GAP],
    ]);
  });

  it('gives the same layout every time', () => {
    const tcc = examples['tcc-2016'].machine;
    expect(layoutDiagram(tcc)).toEqual(layoutDiagram(tcc));
  });
});

describe('ruleLabel', () => {
  it('writes a modern rule as read→write,move and a 1936 rule as read→operations', () => {
    expect(ruleLabel({ state: 'q0', read: '0', write: '1', move: 'R', next: 'q0' }, words)).toBe('0→1,R');
    expect(ruleLabel({ state: 'b', read: { match: 'blank' }, ops: ['P0', 'R'], next: 'c' }, words)).toBe('blank→P0,R');
    expect(ruleLabel({ state: 'b', read: { match: 'any' }, ops: [], next: 'c' }, words)).toBe('any→');
  });
});

describe('edgeLabel', () => {
  const copy = (read: string, move: 'L' | 'R' | 'S') => ({ state: 'q0', read, write: read, move, next: 'q1' });

  it('joins rules that write the symbol they read and share a move', () => {
    expect(edgeLabel([copy('w', 'R'), copy('y', 'R'), copy('z', 'R'), copy('x', 'R')], words)).toBe('w y z x → R');
  });

  it('keeps the full form for a rule that writes another symbol, and for a rule that joins no other', () => {
    expect(edgeLabel([{ state: 'q1', read: '1', write: '0', move: 'L', next: 'q1' }], words)).toBe('1→0,L');
    expect(edgeLabel([copy('0', 'R'), { state: 'q0', read: '1', write: '0', move: 'R', next: 'q1' }], words)).toBe('0→0,R  1→0,R');
  });

  it('keeps the rule table order: a joined label stands where its first rule stands', () => {
    const rules = [copy('a', 'R'), { state: 'q0', read: '1', write: '0', move: 'L', next: 'q1' } as const, copy('b', 'R'), copy('c', 'L')];
    expect(edgeLabel(rules, words)).toBe('a b → R  1→0,L  c→c,L');
  });

  it('joins 1936 rules with the same operations, and shows the blank and the matchers as today', () => {
    const turing = (read: string | { match: 'any' | 'blank' }, ops: string[]) => ({ state: 'b', read, ops, next: 'c' });
    expect(edgeLabel([turing('0', ['R']), turing('1', ['R'])], words)).toBe('0 1 → R');
    expect(edgeLabel([turing({ match: 'blank' }, ['P0', 'R']), turing({ match: 'any' }, ['P0', 'R']), turing('_', ['L'])], words)).toBe(
      'blank any → P0,R  _→L',
    );
    expect(edgeLabel([turing('0', []), turing('1', [])], words)).toBe('0 1 →');
  });

  it('keeps the full form for a new rule with an empty read or write: it joins no other', () => {
    const rules = [
      copy('0', 'R'),
      { state: 'q0', read: '1', write: '0', move: 'R', next: 'q1' } as const,
      copy('1', 'R'),
      copy('_', 'L'),
      { state: 'q0', read: '', write: '', move: 'R', next: 'q1' } as const,
    ];
    expect(edgeLabel(rules, words)).toBe('0 1 → R  1→0,R  _→_,L  →,R');
    const turing = (read: string, ops: string[]) => ({ state: 'b', read, ops, next: 'c' });
    expect(edgeLabel([turing('0', ['R']), turing('', ['R'])], words)).toBe('0→R  →R');
  });

  it('shortens the arrows of the 2016 example', () => {
    const tcc = examples['tcc-2016'].machine;
    const loop = layoutDiagram(tcc).edges.find((edge) => edge.source === 'q2' && edge.target === 'q2');
    if (loop === undefined) throw new Error('q2 has no loop');
    expect(edgeLabel(loop.ruleIndexes.map((index) => tcc.rules[index]), words)).toBe('w y z x → R');
  });
});
