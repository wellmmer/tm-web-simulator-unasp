import { describe, expect, it } from 'vitest';
import { followsRun, READABLE_ZOOM, wholeMachineZoom } from './diagram-follow';
import { LABEL_FONT_PX, layoutDiagram } from './diagram-layout';
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
