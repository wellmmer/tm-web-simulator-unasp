'use client';

import { BaseEdge, Handle, Position, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react';
import { LABEL_FONT_PX, NODE_RADIUS } from '../diagram-layout';

export type StateNodeData = {
  label: string;
  start: boolean;
  accept: boolean;
  reject: boolean;
  /** True for the state the machine is in now. */
  current: boolean;
  /** Fraktur letters are drawn larger. */
  fraktur: boolean;
};
export type StateNode = Node<StateNodeData, 'state'>;

export type RuleEdgeData = {
  label: string;
  /** The centres of the two states, from the layout. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  loop: boolean;
  bend: number;
  /** True when the last step applied one of this edge's rules. */
  current: boolean;
  /** True while following, for an arrow that does not leave the current state: light grey, without text. */
  faded: boolean;
};
export type RuleEdge = Edge<RuleEdgeData, 'rule'>;

/**
 * A state: a circle, a double circle for an accept state, a dashed circle for a reject state, and an
 * arrow on the left of the start state. The current state is pencil red.
 */
export function StateNodeView({ data }: NodeProps<StateNode>) {
  const tone = data.current ? 'border-pencil border-4 text-pencil' : 'border-ink border-2 text-ink';
  return (
    <div
      data-current={data.current || undefined}
      className={`relative grid size-[52px] place-items-center rounded-full bg-cell font-mono font-semibold ${tone} ${data.reject ? 'border-dashed' : ''}`}
    >
      {data.accept && <span className="absolute inset-[3px] rounded-full border-2 border-current" />}
      {data.start && (
        <svg viewBox="0 0 30 12" className="absolute top-1/2 right-full mr-1 h-3 w-[30px] -translate-y-1/2 text-ink">
          <path d="M0 6h22" stroke="currentColor" strokeWidth="2" />
          <path d="M21 1l9 5-9 5z" fill="currentColor" />
        </svg>
      )}
      <span className={data.fraktur ? 'text-xl/none' : 'text-sm'}>{data.label}</span>
      {/* React Flow draws an edge only between handles. The edge itself starts at the circle's edge. */}
      <Handle type="target" position={Position.Left} isConnectable={false} className="opacity-0" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="opacity-0" />
    </div>
  );
}

const unit = (dx: number, dy: number) => {
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
};

/** The SVG path of an edge and the point for its label. */
export function edgePath({ from, to, loop, bend }: Pick<RuleEdgeData, 'from' | 'to' | 'loop' | 'bend'>) {
  const r = NODE_RADIUS;
  if (loop) {
    // A loop above the state, from 30° left of the top to 30° right of it.
    const x1 = from.x - r * 0.5;
    const x2 = from.x + r * 0.5;
    const y = from.y - r * 0.87;
    return { path: `M${x1},${y} C${x1 - 22},${y - 52} ${x2 + 22},${y - 52} ${x2},${y - 3}`, labelX: from.x, labelY: y - 46 };
  }
  // A quadratic curve. The normal points down for an edge that goes left, so back edges pass below.
  const along = unit(to.x - from.x, to.y - from.y);
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const control = { x: middle.x + along.y * bend * 2, y: middle.y - along.x * bend * 2 };
  const out = unit(control.x - from.x, control.y - from.y);
  const into = unit(control.x - to.x, control.y - to.y);
  const start = { x: from.x + out.x * r, y: from.y + out.y * r };
  const end = { x: to.x + into.x * (r + 3), y: to.y + into.y * (r + 3) };
  return {
    path: `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`,
    labelX: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
    labelY: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y - 12,
  };
}

/**
 * The rules from one state to another, as one arrow with every rule in its label. The arrow of the
 * last step is pencil red. A faded arrow is light grey and has no text, so it hides no other text.
 */
export function RuleEdgeView({ id, source, target, data }: EdgeProps<RuleEdge>) {
  if (data === undefined) return null;
  const { path, labelX, labelY } = edgePath(data);
  const color = data.current ? 'var(--pencil)' : data.faded ? 'var(--soft)' : 'var(--ink)';
  const marker = `arrow-${id}`;
  return (
    <g data-edge={`${source}→${target}`} data-current={data.current || undefined} data-faded={data.faded || undefined}>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={color} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={`url(#${marker})`}
        style={{ stroke: color, strokeWidth: data.current ? 3.5 : 2 }}
        label={data.faded ? undefined : data.label}
        labelX={labelX}
        labelY={labelY}
        labelStyle={{ fill: data.current ? 'var(--pencil)' : 'var(--muted)', fontFamily: 'var(--font-jetbrains-mono), var(--font-math), monospace', fontSize: LABEL_FONT_PX, fontWeight: 500 }}
        labelShowBg
        labelBgStyle={{ fill: 'var(--cell)' }}
        labelBgPadding={[3, 1]}
      />
    </g>
  );
}
