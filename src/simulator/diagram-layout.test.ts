import { describe, expect, it } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { COLUMN_GAP, layoutDiagram, ROW_GAP, ruleLabel } from './diagram-layout';
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
