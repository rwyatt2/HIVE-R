/**
 * Agent Status Panel
 * 
 * Real-time visualization of agent activity with progress, queue, and timeline.
 */

import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, Users, Zap, Loader2 } from 'lucide-react';
import type { ActiveAgent, QueuedTask, CompletedTask } from '../hooks/useAgentStatus';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AgentStatusPanelProps {
    activeAgent: ActiveAgent | null;
    queue: QueuedTask[];
    completed: CompletedTask[];
    isStreaming?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
}

// Agent name to emoji mapping
const agentEmojis: Record<string, string> = {
    Router: '🧭',
    Founder: '👔',
    ProductManager: '📋',
    Designer: '🎨',
    Builder: '⚙️',
    Tester: '🧪',
    Reviewer: '👓',
    SecurityEngineer: '🔒',
    SRE: '🚀',
    DataAnalyst: '📊',
    TechWriter: '📝',
    UXResearcher: '🔍',
    Planner: '📐',
    Accessibility: '♿',
};

function getAgentEmoji(name: string): string {
    return agentEmojis[name] || '🤖';
}

// ─── Components ─────────────────────────────────────────────────────────────

function ActiveAgentCard({ agent }: { agent: ActiveAgent }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - agent.startTime);
        }, 100);
        return () => clearInterval(interval);
    }, [agent.startTime]);

    // Estimate progress based on chunks (arbitrary heuristic)
    const progress = Math.min(agent.chunks * 5, 95);

    return (
        <div className="bg-electric-violet/10 border border-electric-violet/30 rounded-xl p-4 animate-pulse-subtle">
            <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                    <span className="text-2xl">{getAgentEmoji(agent.name)}</span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-plasma-green rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-plasma-green rounded-full" />
                </div>
                <div>
                    <h4 className="font-semibold text-white">{agent.name} Agent</h4>
                    <p className="text-xs text-starlight-400">Processing...</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-void-800 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full bg-gradient-to-r from-electric-violet to-reactor-core transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-starlight-400">
                <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {agent.chunks} chunks
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(elapsed)}
                </span>
            </div>
        </div>
    );
}

function QueueList({ queue }: { queue: QueuedTask[] }) {
    if (queue.length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="text-xs font-medium text-starlight-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Queue ({queue.length})
            </h4>
            <ul className="space-y-2">
                {queue.map((task, index) => (
                    <li
                        key={task.id}
                        className="flex items-center gap-2 text-sm text-starlight-300 bg-void-800/50 rounded-lg px-3 py-2"
                    >
                        <span className="w-5 h-5 flex items-center justify-center bg-void-700 rounded-full text-xs text-starlight-400">
                            {index + 1}
                        </span>
                        <span>{getAgentEmoji(task.agent)}</span>
                        <span>{task.agent}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function CompletionTimeline({ completed }: { completed: CompletedTask[] }) {
    if (completed.length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="text-xs font-medium text-starlight-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recent
            </h4>
            <ul className="space-y-2">
                {completed.slice(0, 5).map((task, index) => (
                    <li
                        key={task.id}
                        className="flex items-center gap-2 text-sm text-starlight-400 opacity-80 hover:opacity-100 transition-opacity"
                        style={{
                            animationDelay: `${index * 100}ms`,
                            animation: 'slideInLeft 0.3s ease-out forwards',
                        }}
                    >
                        <CheckCircle2 className="w-4 h-4 text-plasma-green" />
                        <span>{getAgentEmoji(task.agent)}</span>
                        <span className="flex-1">{task.agent}</span>
                        <span className="text-xs text-starlight-500">
                            {formatDuration(task.duration)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AgentStatusPanel({
    activeAgent,
    queue,
    completed,
    isStreaming = false,
}: AgentStatusPanelProps) {
    const hasActivity = activeAgent || queue.length > 0 || completed.length > 0;

    return (
        <div className="bg-void-950/95 backdrop-blur-2xl border border-white/6 rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-electric-violet" />
                    Agent Activity
                </h3>
                {isStreaming && (
                    <div className="flex items-center gap-1.5 text-xs text-plasma-green">
                        <span className="w-2 h-2 bg-plasma-green rounded-full animate-pulse" />
                        Live
                    </div>
                )}
            </div>

            {/* Content */}
            {hasActivity ? (
                <>
                    {activeAgent ? (
                        <ActiveAgentCard agent={activeAgent} />
                    ) : isStreaming ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-starlight-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Waiting for agent...</span>
                        </div>
                    ) : null}

                    <QueueList queue={queue} />
                    <CompletionTimeline completed={completed} />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-starlight-500">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.03] mb-3">
                        <Activity className="w-5 h-5 text-starlight-600" />
                    </div>
                    <p className="text-sm text-starlight-500">No agent activity</p>
                    <p className="text-xs text-starlight-600 mt-0.5">Start a conversation to see agents working</p>
                </div>
            )}
        </div>
    );
}

export default AgentStatusPanel;
