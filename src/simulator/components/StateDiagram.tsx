'use client';

import '@xyflow/react/dist/base.css';
import { ReactFlow, ReactFlowProvider, useReactFlow, useStore, type FitViewOptions } from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Run } from '@/engines/turing';
import { FIT_MAX_ZOOM, FIT_PADDING, FOLLOW_SLIDE_MS, followMove, followsRun, followViewport, MIN_ZOOM } from '../diagram-follow';
import { edgeLabel, layoutDiagram, NODE_RADIUS, type DiagramLayout } from '../diagram-layout';
import { SPEEDS } from '../speed';
import { currentRuleIndex } from '../store';
import { DiagramButtons } from './DiagramButtons';
import { RuleEdgeView, StateNodeView, type RuleEdge, type StateNode } from './diagram-parts';
import { useSimulator } from './store-context';
import { useReducedMotion } from './use-reduced-motion';

const nodeTypes = { state: StateNodeView };
const edgeTypes = { rule: RuleEdgeView };
const wholeMachine: FitViewOptions = { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM };
/** Zoom in stops at twice the normal size. */
const MAX_ZOOM = 2;

/** How the view is set: it follows the run, it shows the whole machine, or the visitor moved it by hand. */
type ViewMode = 'follow' | 'whole' | 'hand';

/**
 * The state diagram drawn with React Flow (spec 5.1), with the buttons above it. A new set of states
 * and edges draws a new React Flow, so the view and the "moved by hand" mark start again.
 */
export default function StateDiagram() {
  const machine = useSimulator((s) => s.machine);
  const layout = useMemo(() => layoutDiagram(machine), [machine]);
  const shape = useMemo(() => JSON.stringify([layout.nodes.map((n) => n.id), layout.edges.map((e) => [e.source, e.target])]), [layout]);
  return (
    <ReactFlowProvider key={shape}>
      <Diagram layout={layout} />
    </ReactFlowProvider>
  );
}

/**
 * The view follows the run when the whole machine would draw its arrow text smaller than 11 px
 * (spec section 2). Zoom in, Zoom out and Whole machine stop following until the next run: Reset,
 * a new machine, an edit or an example make a new run. The diagram takes no keys.
 */
function Diagram({ layout }: { layout: DiagramLayout }) {
  const t = useTranslations('simulator.diagram');
  const machine = useSimulator((s) => s.machine);
  const run = useSimulator((s) => s.run);
  const state = useSimulator((s) => s.run?.state ?? null);
  const rule = useSimulator(currentRuleIndex);
  const fast = useSimulator((s) => SPEEDS[s.speed].slideMs === 0);
  useSimulator((s) => s.version);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const { fitView, setViewport, zoomIn, zoomOut } = useReactFlow();
  const reducedMotion = useReducedMotion();

  // The run on which the visitor moved the view by hand. A new run follows again.
  const [movedByHand, setMovedByHand] = useState<{ run: Run | null } | null>(null);
  const canFollow = followsRun(layout, { width, height });
  const mode: ViewMode = movedByHand !== null && movedByHand.run === run ? 'hand' : canFollow ? 'follow' : 'whole';
  const slide = reducedMotion ? 0 : FOLLOW_SLIDE_MS;
  const stopFollowing = () => setMovedByHand({ run });

  useEffect(() => {
    if (mode === 'whole' && width > 0 && height > 0) void fitView(wholeMachine);
  }, [mode, width, height, fitView]);

  const target = useMemo(
    () => (mode === 'follow' && state !== null ? followViewport(layout, state, { width, height }) : null),
    [mode, layout, state, width, height],
  );
  const lastMoveAt = useRef<number | null>(null);
  useEffect(() => {
    if (target === null) return;
    const move = followMove({ now: performance.now(), lastMoveAt: lastMoveAt.current, fast, reducedMotion });
    const go = () => {
      lastMoveAt.current = performance.now();
      void setViewport(target, { duration: move.duration });
    };
    if (move.wait === 0) {
      go();
      return;
    }
    const timer = setTimeout(go, move.wait);
    return () => clearTimeout(timer);
  }, [target, fast, reducedMotion, setViewport]);

  const words = { any: t('any'), blank: t('blank') };
  const fraktur = machine.notation === 'turing1936';
  const nodes: StateNode[] = layout.nodes.map((node) => ({
    id: node.id,
    type: 'state',
    position: { x: node.x - NODE_RADIUS, y: node.y - NODE_RADIUS },
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    data: { label: node.id, start: node.start, accept: node.accept, reject: node.reject, current: node.id === state, fraktur },
  }));
  const centre = new Map(layout.nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
  const edges: RuleEdge[] = layout.edges.map((edge) => ({
    id: edge.id,
    type: 'rule',
    source: edge.source,
    target: edge.target,
    data: {
      label: edgeLabel(edge.ruleIndexes.map((index) => machine.rules[index]), words),
      from: centre.get(edge.source)!,
      to: centre.get(edge.target)!,
      loop: edge.loop,
      bend: edge.bend,
      current: rule !== null && edge.ruleIndexes.includes(rule),
    },
  }));

  return (
    <>
      <DiagramButtons
        canFollow={canFollow}
        following={mode === 'follow'}
        onZoomIn={() => {
          stopFollowing();
          void zoomIn({ duration: slide });
        }}
        onZoomOut={() => {
          stopFollowing();
          void zoomOut({ duration: slide });
        }}
        onWholeMachine={() => {
          stopFollowing();
          void fitView({ ...wholeMachine, duration: slide });
        }}
        onToggleFollow={() => (mode === 'follow' ? stopFollowing() : setMovedByHand(null))}
      />
      <div
        role="img"
        aria-label={t('label', { name: machine.name })}
        aria-describedby="diagram-hint"
        data-testid="state-diagram"
        className="h-[220px] sm:h-[320px]"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          zoomActivationKeyCode={null}
          preventScrolling={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          panActivationKeyCode={null}
          disableKeyboardA11y
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </>
  );
}
