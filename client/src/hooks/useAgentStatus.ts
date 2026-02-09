/**
 * Agent Status Hook
 * 
 * Tracks agent activity state: active agent, queue, and completions.
 * Works alongside useAgentStream for SSE event processing.
 */

import { useState, useCallback, useRef } from 'react';
import type { StreamEvent } from './useAgentStream';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActiveAgent {
    name: string;
    startTime: number;
    chunks: number;
}

export interface QueuedTask {
    id: string;
    agent: string;
    timestamp: number;
}

export interface CompletedTask {
    id: string;
    agent: string;
    completedAt: number;
    duration: number;
}

export interface AgentStatusState {
    activeAgent: ActiveAgent | null;
    queue: QueuedTask[];
    completed: CompletedTask[];
    events: StreamEvent[];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAgentStatus() {
    const [activeAgent, setActiveAgent] = useState<ActiveAgent | null>(null);
    const [queue, setQueue] = useState<QueuedTask[]>([]);
    const [completed, setCompleted] = useState<CompletedTask[]>([]);
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const lastCompletionRef = useRef<Record<string, number>>({});

    /**
     * Process a stream event and update state accordingly.
     */
    const processEvent = useCallback((event: StreamEvent) => {
        // Add to event log
        setEvents(prev => [...prev.slice(-50), event]); // Keep last 50 events

        switch (event.type) {
            case 'agent_start':
                if (event.agent) {
                    setActiveAgent({
                        name: event.agent,
                        startTime: Date.now(),
                        chunks: 0,
                    });
                    // Remove from queue if present
                    setQueue(q => q.filter(t => t.agent !== event.agent));
                }
                break;

            case 'chunk':
                setActiveAgent(prev => {
                    if (!prev) return null;
                    return { ...prev, chunks: prev.chunks + 1 };
                });
                break;

            case 'agent_end':
                setActiveAgent(prev => {
                    if (!prev || prev.name !== event.agent) return null;

                    const now = Date.now();
                    const lastCompletion = lastCompletionRef.current[prev.name] || 0;
                    if (now - lastCompletion < 500) {
                        return null;
                    }
                    lastCompletionRef.current[prev.name] = now;

                    // Add to completed
                    setCompleted(prevCompleted => [
                        {
                            id: Date.now().toString(),
                            agent: prev.name,
                            completedAt: Date.now(),
                            duration: Date.now() - prev.startTime,
                        },
                        ...prevCompleted.slice(0, 9), // Keep last 10
                    ]);

                    return null;
                });
                break;

            case 'handoff':
                // Add next agent to queue
                if (event.to) {
                    setQueue(prev => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            agent: event.to!,
                            timestamp: Date.now(),
                        },
                    ]);
                }
                break;

            case 'done':
                setActiveAgent(null);
                setQueue([]);
                break;
        }
    }, []);

    /**
     * Reset all state.
     */
    const reset = useCallback(() => {
        setActiveAgent(null);
        setQueue([]);
        setCompleted([]);
        setEvents([]);
    }, []);

    return {
        activeAgent,
        queue,
        completed,
        events,
        processEvent,
        reset,
    };
}

export default useAgentStatus;
