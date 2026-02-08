import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AgentNode as AgentNodeUI } from './ui/agent-node';
import { Bot, User, BrainCircuit, ShieldCheck, Wrench, Search, Pencil, BarChart3, Binary, LayoutTemplate, Palette, Globe, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

// Map labels to icons
const iconMap: Record<string, LucideIcon> = {
    'Router': Globe,
    'Founder': User,
    'PM': LayoutTemplate, // Product Manager
    'UX Researcher': Search,
    'Designer': Palette,
    'A11y': User, // Accessibility
    'Planner': BrainCircuit,
    'Security': ShieldCheck,
    'Builder': Wrench,
    'Reviewer': Search,
    'Tester': Binary,
    'Tech Writer': Pencil,
    'SRE': BarChart3,
    'Data Analyst': BarChart3,
};

interface AgentNodeData extends Record<string, unknown> {
    label: string;
    isActive?: boolean;
    isThinking?: boolean;
    status?: 'active' | 'idle' | 'error';
}

function AgentNodeComponent({ data, selected }: NodeProps) {
    // Cast data to our expected type
    const nodeData = data as AgentNodeData;
    const isActive = nodeData.isActive || false;
    const isThinking = nodeData.isThinking || false;

    // Determine status
    let status: 'active' | 'idle' | 'error' = 'idle';
    if (isActive) status = 'active';
    if (nodeData.status) status = nodeData.status;

    // Get icon based on label (strip emoji if present)
    const cleanLabel = nodeData.label.replace(/^[^\w\s]+/, '').trim();
    // Simple matching logic
    const IconComponent = Object.entries(iconMap).find(([key]) => cleanLabel.includes(key))?.[1] || Bot;

    return (
        <div className={cn("relative", selected && "z-50")}>
            <Handle
                type="target"
                position={Position.Top}
                className={cn("!bg-primary/50 !w-3 !h-3 !-top-3 transition-opacity", !selected && !isActive && "opacity-0")}
            />

            <AgentNodeUI
                icon={IconComponent}
                name={nodeData.label}
                status={status}
                size="md"
                className={cn(
                    "transition-transform duration-300",
                    isActive && "scale-110 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full"
                )}
            />

            {isThinking && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap animate-in fade-in zoom-in slide-in-from-bottom-2">
                    Thinking...
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className={cn("!bg-primary/50 !w-3 !h-3 !-bottom-3 transition-opacity", !selected && !isActive && "opacity-0")}
            />
        </div>
    );
}

export const AgentNode = memo(AgentNodeComponent);
