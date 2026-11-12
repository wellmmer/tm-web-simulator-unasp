'use client';

import '@xyflow/react/dist/base.css';
import { ReactFlow, useReactFlow, useStore, type FitViewOptions } from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { edgeLabel, layoutDiagram } from '../diagram-layout';
import { currentRuleIndex } from '../store';
import { NODE_RADIUS, RuleEdgeView, StateNodeView, type RuleEdge, type StateNode } from './diagram-parts';
import { useSimulator } from './store-context';

const nodeTypes = { state: StateNodeView };
const edgeTypes = { rule: RuleEdgeView };
const fitViewOptions: FitViewOptions = { padding: 0.12, maxZoom: 1.1 };

/**
 * Fits the view again when the panel changes size, as when a phone turns or the window crosses 1024 px.
 * React Flow fits the view on the first draw only, and the visitor cannot pan or zoom.
 */
function FitOnResize() {
  const { fitView } = useReactFlow();
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  useEffect(() => {
    void fitView(fitViewOptions);
  }, [fitView, width, height]);
  return null;
}

/**
 * The state diagram drawn with React Flow (spec 5.1). It is a picture only: nothing can be dragged,
 * selected or focused, it listens to no keys, and the page scrolls over it as over any picture.
 */
export default function StateDiagram() {
  const t = useTranslations('simulator.diagram');
  const machine = useSimulator((s) => s.machine);
  const state = useSimulator((s) => s.run?.state ?? null);
  const rule = useSimulator(currentRuleIndex);
  useSimulator((s) => s.version);

  const layout = useMemo(() => layoutDiagram(machine), [machine]);
  // A new set of states and edges draws a new React Flow, so it fits the view again.
  const shape = useMemo(() => JSON.stringify([layout.nodes.map((n) => n.id), layout.edges.map((e) => [e.source, e.target])]), [layout]);
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
    <ReactFlow
      key={shape}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={fitViewOptions}
      minZoom={0.1}
      maxZoom={1.1}
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
      preventScrolling={false}
      deleteKeyCode={null}
      selectionKeyCode={null}
      multiSelectionKeyCode={null}
      panActivationKeyCode={null}
      zoomActivationKeyCode={null}
      disableKeyboardA11y
      proOptions={{ hideAttribution: true }}
    >
      <FitOnResize />
    </ReactFlow>
  );
}
