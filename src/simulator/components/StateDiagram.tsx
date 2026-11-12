'use client';

import '@xyflow/react/dist/base.css';
import { ReactFlow } from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { layoutDiagram, ruleLabel } from '../diagram-layout';
import { currentRuleIndex } from '../store';
import { NODE_RADIUS, RuleEdgeView, StateNodeView, type RuleEdge, type StateNode } from './diagram-parts';
import { useSimulator } from './store-context';

const nodeTypes = { state: StateNodeView };
const edgeTypes = { rule: RuleEdgeView };

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
      label: edge.ruleIndexes.map((index) => ruleLabel(machine.rules[index], words)).join('  '),
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
      fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
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
    />
  );
}
