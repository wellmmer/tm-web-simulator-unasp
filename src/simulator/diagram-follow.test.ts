import { describe, expect, it } from 'vitest';
import { edgesLeaving, FIT_MAX_ZOOM, followMove, followsRun, followStates, followViewport, READABLE_ZOOM, wholeMachineZoom } from './diagram-follow';
import { COLUMN_GAP, LABEL_FONT_PX, layoutDiagram, NODE_RADIUS } from './diagram-layout';
import { EXAMPLE_IDS, examples } from './examples';

/** The diagram panel's size in the browser, measured at 390 px and 1440 px wide. */
const PHONE = { width: 326, height: 220 };
const DESKTOP = { width: 503, height: 320 };
const layoutOf = (id: (typeof EXAMPLE_IDS)[number]) => layoutDiagram(examples[id].machine);

describe('wholeMachineZoom', () => {
  it('works out the zoom of "Whole machine" as React Flow does', () => {
    // React Flow drew these zooms in Chromium at 1440 px (the scale of .react-flow__viewport).
    expect(wholeMachineZoom(layoutOf('binary-plus-one'), DESKTOP)).toBe(1.1);
    expect(wholeMachineZoom(layoutOf('palindrome'), DESKTOP)).toBeCloseTo(0.8477, 4);
    expect(wholeMachineZoom(layoutOf('tcc-2016'), DESKTOP)).toBeCloseTo(0.5293, 4);
  });

  it('has no zoom before the panel has a size, or without states', () => {
    expect(wholeMachineZoom(layoutOf('tcc-2016'), { width: 0, height: 0 })).toBeNull();
    expect(wholeMachineZoom({ nodes: [], edges: [] }, DESKTOP)).toBeNull();
  });
});

describe('followsRun', () => {
  it('follows when the arrow text of the whole machine would be smaller than 11 px', () => {
    expect(READABLE_ZOOM * LABEL_FONT_PX).toBe(11);
    expect(followsRun(layoutOf('tcc-2016'), DESKTOP)).toBe(true);
    expect(followsRun(layoutOf('binary-plus-one'), DESKTOP)).toBe(false);
    expect(followsRun(layoutOf('binary-plus-one'), { width: 680, height: 320 })).toBe(false);
  });

  it('decides again for a new panel size', () => {
    // At 1440 px the 1936 machine draws its text at 10.2 px, at 768 px at 13.2 px.
    expect(followsRun(layoutOf('turing-1936'), DESKTOP)).toBe(true);
    expect(followsRun(layoutOf('turing-1936'), { width: 680, height: 320 })).toBe(false);
    expect(followsRun(layoutOf('binary-plus-one'), PHONE)).toBe(true);
  });

  it('does not follow before the panel has a size', () => {
    expect(followsRun(layoutOf('tcc-2016'), { width: 0, height: 0 })).toBe(false);
  });
});

describe('followStates', () => {
  it('lists the current state, then the states its rules go to, in rule table order', () => {
    expect(followStates(layoutOf('binary-plus-one'), 'q0')).toEqual(['q0', 'q1']);
    expect(followStates(layoutOf('tcc-2016'), 'q1')).toEqual(['q1', 'qR', 'q2', 'q3', 'q4', 'q5', 'q12']);
    expect(followStates(layoutOf('binary-plus-one'), 'qA')).toEqual(['qA']);
  });
});

describe('followViewport', () => {
  it('shows the current state and the states its rules go to, never larger than small machines today', () => {
    const view = followViewport(layoutOf('tcc-2016'), 'q0', DESKTOP);
    expect(view?.zoom).toBe(FIT_MAX_ZOOM);
  });

  it('keeps the arrow text readable when those states do not fit, and keeps the current state in the panel', () => {
    const view = followViewport(layoutOf('tcc-2016'), 'q1', DESKTOP);
    expect(view?.zoom).toBe(READABLE_ZOOM);
  });

  it('has no view for a state that is not in the diagram, or before the panel has a size', () => {
    expect(followViewport(layoutOf('tcc-2016'), 'q99', DESKTOP)).toBeNull();
    expect(followViewport(layoutOf('tcc-2016'), 'q1', { width: 0, height: 0 })).toBeNull();
  });

  it('for every state of every example, draws readable text and the whole circle of the current state', () => {
    for (const id of EXAMPLE_IDS) {
      const layout = layoutOf(id);
      for (const panel of [PHONE, DESKTOP, { width: 680, height: 320 }]) {
        for (const node of layout.nodes) {
          const view = followViewport(layout, node.id, panel);
          if (view === null) throw new Error(`no view for ${id} ${node.id}`);
          expect(view.zoom).toBeGreaterThanOrEqual(READABLE_ZOOM);
          expect(view.zoom).toBeLessThanOrEqual(FIT_MAX_ZOOM);
          const left = (node.x - NODE_RADIUS) * view.zoom + view.x;
          const top = (node.y - NODE_RADIUS) * view.zoom + view.y;
          const size = 2 * NODE_RADIUS * view.zoom;
          expect([left >= 0, top >= 0, left + size <= panel.width, top + size <= panel.height]).toEqual([true, true, true, true]);
        }
      }
    }
  });
});

describe('followViewport and the arrows of the current state', () => {
  it('keeps half a column on each side of the current state in the panel, where the text of its arrows stands', () => {
    for (const id of EXAMPLE_IDS) {
      const layout = layoutOf(id);
      for (const panel of [PHONE, DESKTOP]) {
        for (const node of layout.nodes) {
          const view = followViewport(layout, node.id, panel);
          if (view === null) throw new Error(`no view for ${id} ${node.id}`);
          const left = (node.x - COLUMN_GAP / 2) * view.zoom + view.x;
          const right = (node.x + COLUMN_GAP / 2) * view.zoom + view.x;
          expect([id, node.id, left >= 0, right <= panel.width]).toEqual([id, node.id, true, true]);
        }
      }
    }
  });
});

describe('followMove', () => {
  it('slides for 300 ms, and jumps with reduced motion', () => {
    expect(followMove({ now: 5000, lastMoveAt: 4000, fast: false, reducedMotion: false })).toEqual({ wait: 0, duration: 300 });
    expect(followMove({ now: 5000, lastMoveAt: 4000, fast: false, reducedMotion: true })).toEqual({ wait: 0, duration: 0 });
  });

  it('jumps on the first move, so a new machine does not slide in', () => {
    expect(followMove({ now: 5000, lastMoveAt: null, fast: false, reducedMotion: false })).toEqual({ wait: 0, duration: 0 });
  });

  it('at the top speed, jumps at most twice a second', () => {
    expect(followMove({ now: 5200, lastMoveAt: 5000, fast: true, reducedMotion: false })).toEqual({ wait: 300, duration: 0 });
    expect(followMove({ now: 5600, lastMoveAt: 5000, fast: true, reducedMotion: false })).toEqual({ wait: 0, duration: 0 });
  });
});

describe('edgesLeaving', () => {
  const pairs = (id: (typeof EXAMPLE_IDS)[number], state: string | null) =>
    edgesLeaving(layoutOf(id), state).map((edge) => `${edge.source}→${edge.target}`);

  it('lists the arrows that leave the current state, its loop included, in rule table order', () => {
    expect(pairs('binary-plus-one', 'q0')).toEqual(['q0→q0', 'q0→q1']);
    expect(pairs('tcc-2016', 'q1')).toEqual(['q1→qR', 'q1→q2', 'q1→q3', 'q1→q4', 'q1→q5', 'q1→q1', 'q1→q12']);
  });

  it('lists no arrow for a state without rules, or before the machine has a state', () => {
    expect(pairs('binary-plus-one', 'qA')).toEqual([]);
    expect(pairs('binary-plus-one', null)).toEqual([]);
  });
});
