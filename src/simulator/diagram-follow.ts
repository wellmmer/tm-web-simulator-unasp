import { getViewportForBounds, type Rect, type Viewport } from '@xyflow/react';
import { COLUMN_GAP, LABEL_FONT_PX, NODE_RADIUS, type DiagramLayout } from './diagram-layout';

/** The smallest arrow text on screen, in pixels. With smaller text the diagram follows the run (spec section 2). */
export const MIN_LABEL_PX = 11;

/** The zoom at which the arrow text is MIN_LABEL_PX on screen. */
export const READABLE_ZOOM = MIN_LABEL_PX / LABEL_FONT_PX;

/** "Whole machine" as today: a margin of 12% of the panel, never larger than 1.1, never smaller than 0.1. */
export const FIT_PADDING = 0.12;
export const FIT_MAX_ZOOM = 1.1;
export const MIN_ZOOM = 0.1;

/** The size of the diagram panel on screen, in pixels. Zero before React Flow has measured it. */
export interface PanelSize {
  width: number;
  height: number;
}

/** The box around the circles of `states`, or of every state, in diagram pixels. Null when there is no circle. */
export function circlesBounds(layout: DiagramLayout, states?: readonly string[]): Rect | null {
  const nodes = states === undefined ? layout.nodes : layout.nodes.filter((node) => states.includes(node.id));
  if (nodes.length === 0) return null;
  const left = Math.min(...nodes.map((node) => node.x)) - NODE_RADIUS;
  const top = Math.min(...nodes.map((node) => node.y)) - NODE_RADIUS;
  const right = Math.max(...nodes.map((node) => node.x)) + NODE_RADIUS;
  const bottom = Math.max(...nodes.map((node) => node.y)) + NODE_RADIUS;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * The zoom of "Whole machine": the zoom at which React Flow's fitView shows every state in the panel.
 * It uses React Flow's own function, so the two always agree. Null before the panel has a size.
 */
export function wholeMachineZoom(layout: DiagramLayout, panel: PanelSize): number | null {
  const bounds = circlesBounds(layout);
  if (bounds === null || panel.width <= 0 || panel.height <= 0) return null;
  return getViewportForBounds(bounds, panel.width, panel.height, MIN_ZOOM, FIT_MAX_ZOOM, FIT_PADDING).zoom;
}

/** True when the arrow text of the whole machine would be smaller than MIN_LABEL_PX: the diagram then follows the run. */
export function followsRun(layout: DiagramLayout, panel: PanelSize): boolean {
  const zoom = wholeMachineZoom(layout, panel);
  return zoom !== null && zoom * LABEL_FONT_PX < MIN_LABEL_PX;
}

/** The states the view shows while following: the current state, then the states its rules go to, in rule table order. */
export function followStates(layout: DiagramLayout, state: string): string[] {
  const states = [state];
  for (const edge of layout.edges) {
    if (edge.source === state && !states.includes(edge.target)) states.push(edge.target);
  }
  return states;
}

/**
 * The room the view keeps around the current state, in diagram pixels: half a column on each side,
 * where the text of the arrows into the next and from the previous column stands, and the loop and
 * its text above the state.
 */
const KEEP_SIDE = COLUMN_GAP / 2 + NODE_RADIUS;
const KEEP_ABOVE = 3 * NODE_RADIUS;
const KEEP_BELOW = 2 * NODE_RADIUS;

/**
 * Moves `offset` as little as possible, so that the span from `start` to `end` fits in `size`.
 * `start` and `end` are screen pixels before the offset. A span larger than `size` is centred.
 */
function keepInside(offset: number, start: number, end: number, size: number): number {
  if (end - start > size) return size / 2 - (start + end) / 2;
  return Math.min(Math.max(offset, -start), size - end);
}

/**
 * The view while following (spec section 2): the current state and the states its rules go to,
 * never larger than FIT_MAX_ZOOM. When they do not fit with readable text, the zoom stays at
 * READABLE_ZOOM, and the view moves just enough to keep the current state and its loop in the panel.
 * Null for a state that is not in the diagram, or before the panel has a size.
 */
export function followViewport(layout: DiagramLayout, state: string, panel: PanelSize): Viewport | null {
  const current = layout.nodes.find((node) => node.id === state);
  const bounds = circlesBounds(layout, followStates(layout, state));
  if (current === undefined || bounds === null || panel.width <= 0 || panel.height <= 0) return null;
  const view = getViewportForBounds(bounds, panel.width, panel.height, READABLE_ZOOM, FIT_MAX_ZOOM, FIT_PADDING);
  const zoom = view.zoom;
  return {
    x: keepInside(view.x, (current.x - KEEP_SIDE) * zoom, (current.x + KEEP_SIDE) * zoom, panel.width),
    y: keepInside(view.y, (current.y - KEEP_ABOVE) * zoom, (current.y + KEEP_BELOW) * zoom, panel.height),
    zoom,
  };
}

/** How long the view slides to the next current state. */
export const FOLLOW_SLIDE_MS = 300;
/** At the top speed the view moves at most twice a second. */
export const FAST_FOLLOW_GAP_MS = 500;

export interface FollowMoveInput {
  /** The time now, and the time of the last move or null before the first move, in milliseconds. */
  now: number;
  lastMoveAt: number | null;
  /** True at the top speed, where the tape jumps too. */
  fast: boolean;
  /** True when the visitor asks the system for reduced motion. */
  reducedMotion: boolean;
}

export interface FollowMove {
  /** How long to wait before the move, in milliseconds. */
  wait: number;
  /** How long the view slides, in milliseconds. 0 is a jump. */
  duration: number;
}

/** When the view moves to the next current state, and how long it slides (spec section 2). */
export function followMove({ now, lastMoveAt, fast, reducedMotion }: FollowMoveInput): FollowMove {
  if (lastMoveAt === null) return { wait: 0, duration: 0 };
  if (fast) return { wait: Math.max(0, lastMoveAt + FAST_FOLLOW_GAP_MS - now), duration: 0 };
  return { wait: 0, duration: reducedMotion ? 0 : FOLLOW_SLIDE_MS };
}
