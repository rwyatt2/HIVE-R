/**
 * Graph Layout Utilities
 * 
 * Uses Dagre for automatic graph layout of agent nodes.
 * Creates hierarchical, readable layouts for the agent workflow graph.
 */

import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

interface LayoutOptions {
    direction?: 'TB' | 'LR' | 'BT' | 'RL';
    nodeWidth?: number;
    nodeHeight?: number;
    rankSep?: number;
    nodeSep?: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
    direction: 'TB',
    nodeWidth: 150,
    nodeHeight: 60,
    rankSep: 80,
    nodeSep: 40,
};

/**
 * Apply Dagre auto-layout to ReactFlow nodes and edges
 */
export function getLayoutedElements(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure layout
    dagreGraph.setGraph({
        rankdir: opts.direction,
        ranksep: opts.rankSep,
        nodesep: opts.nodeSep,
        marginx: 40,
        marginy: 40,
    });

    // Add nodes to dagre
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: opts.nodeWidth!,
            height: opts.nodeHeight!,
        });
    });

    // Add edges to dagre
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run layout algorithm
    dagre.layout(dagreGraph);

    // Apply positions back to nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - opts.nodeWidth! / 2,
                y: nodeWithPosition.y - opts.nodeHeight! / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}

/**
 * Get initial HIVE-R agent graph data with auto-layout
 */
export function getAgentGraphData(): { nodes: Node[]; edges: Edge[] } {
    const rawNodes: Node[] = [
        { id: 'Router', data: { label: 'Router', icon: '🧭' }, type: 'agent', position: { x: 0, y: 0 } },
        // Discovery Phase
        { id: 'Founder', data: { label: 'Founder', icon: '👔' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'ProductManager', data: { label: 'PM', icon: '📋' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'UXResearcher', data: { label: 'UX Research', icon: '🔬' }, type: 'agent', position: { x: 0, y: 0 } },
        // Design Phase
        { id: 'Designer', data: { label: 'Designer', icon: '🎨' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'Accessibility', data: { label: 'A11y', icon: '♿' }, type: 'agent', position: { x: 0, y: 0 } },
        // Planning Phase
        { id: 'Planner', data: { label: 'Planner', icon: '📐' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'Security', data: { label: 'Security', icon: '🔒' }, type: 'agent', position: { x: 0, y: 0 } },
        // Build Phase
        { id: 'Builder', data: { label: 'Builder', icon: '🛠️' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'Reviewer', data: { label: 'Reviewer', icon: '👀' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'Tester', data: { label: 'Tester', icon: '🧪' }, type: 'agent', position: { x: 0, y: 0 } },
        // Support
        { id: 'TechWriter', data: { label: 'Docs', icon: '✍️' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'SRE', data: { label: 'SRE', icon: '🚀' }, type: 'agent', position: { x: 0, y: 0 } },
        { id: 'DataAnalyst', data: { label: 'Analytics', icon: '📊' }, type: 'agent', position: { x: 0, y: 0 } },
    ];

    const rawEdges: Edge[] = [
        // Router to all agents
        { id: 'e-router-founder', source: 'Router', target: 'Founder', type: 'custom-edge' },
        { id: 'e-router-pm', source: 'Router', target: 'ProductManager', type: 'custom-edge' },
        { id: 'e-router-ux', source: 'Router', target: 'UXResearcher', type: 'custom-edge' },
        { id: 'e-router-designer', source: 'Router', target: 'Designer', type: 'custom-edge' },
        { id: 'e-router-a11y', source: 'Router', target: 'Accessibility', type: 'custom-edge' },
        { id: 'e-router-planner', source: 'Router', target: 'Planner', type: 'custom-edge' },
        { id: 'e-router-security', source: 'Router', target: 'Security', type: 'custom-edge' },
        { id: 'e-router-builder', source: 'Router', target: 'Builder', type: 'custom-edge' },
        { id: 'e-router-reviewer', source: 'Router', target: 'Reviewer', type: 'custom-edge' },
        { id: 'e-router-tester', source: 'Router', target: 'Tester', type: 'custom-edge' },
        { id: 'e-router-techwriter', source: 'Router', target: 'TechWriter', type: 'custom-edge' },
        { id: 'e-router-sre', source: 'Router', target: 'SRE', type: 'custom-edge' },
        { id: 'e-router-dataanalyst', source: 'Router', target: 'DataAnalyst', type: 'custom-edge' },
        // Workflow handoffs
        { id: 'e-founder-pm', source: 'Founder', target: 'ProductManager', type: 'custom-edge', data: { variant: 'gradient' } },
        { id: 'e-pm-designer', source: 'ProductManager', target: 'Designer', type: 'custom-edge', data: { variant: 'gradient' } },
        { id: 'e-designer-builder', source: 'Designer', target: 'Builder', type: 'custom-edge', data: { variant: 'gradient' } },
        { id: 'e-builder-tester', source: 'Builder', target: 'Tester', type: 'custom-edge', data: { variant: 'gradient' } },
        { id: 'e-tester-reviewer', source: 'Tester', target: 'Reviewer', type: 'custom-edge', data: { variant: 'gradient' } },
    ];

    // Apply auto-layout
    return getLayoutedElements(rawNodes, rawEdges, { direction: 'TB', rankSep: 100, nodeSep: 60 });
}
