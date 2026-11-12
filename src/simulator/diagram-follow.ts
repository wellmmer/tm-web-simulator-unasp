import { getViewportForBounds, type Rect } from '@xyflow/react';
import { LABEL_FONT_PX, NODE_RADIUS, type DiagramLayout } from './diagram-layout';

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
