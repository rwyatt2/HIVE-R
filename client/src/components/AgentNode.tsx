/**
 * Custom Agent Node Component
 * 
 * Displays agent with active/inactive state and pulse animation.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import './AgentNode.css';

interface AgentNodeData {
    label: string;
    isActive?: boolean;
    isThinking?: boolean;
}

function AgentNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as AgentNodeData;
    const isActive = nodeData.isActive || false;
    const isThinking = nodeData.isThinking || false;

    return (
        <div className={`agent-node ${isActive ? 'active' : ''} ${isThinking ? 'thinking' : ''} ${selected ? 'selected' : ''}`}>
            <Handle type="target" position={Position.Top} />
            <div className="agent-content">
                <span className="agent-label">{nodeData.label}</span>
                {isThinking && (
                    <span className="thinking-indicator">
                        <span></span><span></span><span></span>
                    </span>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export const AgentNode = memo(AgentNodeComponent);
