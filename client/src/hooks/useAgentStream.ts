/**
 * Agent Stream Hook
 * 
 * Connects to SSE stream and parses agent activity events.
 */

import { useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamEvent {
    type: 'thread' | 'agent_start' | 'agent_end' | 'handoff' | 'chunk' | 'done' | 'error';
    agent?: string;
    from?: string;
    to?: string;
    content?: string;
    threadId?: string;
    timestamp?: number;
}

interface UseAgentStreamOptions {
    onEvent: (event: StreamEvent) => void;
    onMessage: (content: string, agent: string) => void;
}

interface UseAgentStreamReturn {
    connect: (message: string, threadId?: string) => Promise<void>;
    disconnect: () => void;
    isStreaming: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================================
// HOOK
// ============================================================================

export function useAgentStream({ onEvent, onMessage }: UseAgentStreamOptions): UseAgentStreamReturn {
    const abortControllerRef = useRef<AbortController | null>(null);
    const isStreamingRef = useRef(false);

    /**
     * Connect to the SSE stream
     */
    const connect = useCallback(async (message: string, threadId?: string) => {
        // Cancel any existing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        isStreamingRef.current = true;

        try {
            const response = await fetch(`${API_BASE}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, threadId }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentAgent = 'Router';
            let messageBuffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Flush any remaining message
                    if (messageBuffer.trim()) {
                        onMessage(messageBuffer.trim(), currentAgent);
                    }
                    onEvent({ type: 'done' });
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        const eventType = line.slice(6).trim();

                        // Handle agent events
                        if (eventType === 'agent_start' || eventType === 'agent_end' || eventType === 'handoff') {
                            // Flush message buffer when agent changes
                            if (messageBuffer.trim() && eventType !== 'agent_end') {
                                onMessage(messageBuffer.trim(), currentAgent);
                                messageBuffer = '';
                            }
                        }
                    } else if (line.startsWith('data:')) {
                        const dataStr = line.slice(5).trim();
                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);

                            // Handle different event types
                            switch (data.type) {
                                case 'thread':
                                    onEvent({ type: 'thread', threadId: data.threadId });
                                    break;

                                case 'agent_start':
                                    currentAgent = data.agent || 'Router';
                                    onEvent({
                                        type: 'agent_start',
                                        agent: currentAgent,
                                        timestamp: data.timestamp
                                    });
                                    break;

                                case 'agent_end': {
                                    const agentName = data.agent || currentAgent;
                                    onEvent({
                                        type: 'agent_end',
                                        agent: agentName,
                                        timestamp: data.timestamp
                                    });
                                    currentAgent = agentName;
                                    break;
                                }

                                case 'handoff':
                                    onEvent({
                                        type: 'handoff',
                                        from: data.from,
                                        to: data.to,
                                        timestamp: data.timestamp
                                    });
                                    currentAgent = data.to || currentAgent;
                                    break;

                                case 'chunk':
                                    if (data.content) {
                                        messageBuffer += data.content;
                                        onEvent({ type: 'chunk', content: data.content, agent: currentAgent });
                                    }
                                    break;
                                case 'complete':
                                    if (messageBuffer.trim()) {
                                        onMessage(messageBuffer.trim(), currentAgent);
                                        messageBuffer = '';
                                    }
                                    onEvent({ type: 'done' });
                                    abortControllerRef.current?.abort();
                                    break;

                                default:
                                    // Legacy format - just content
                                    if (data.content) {
                                        messageBuffer += data.content;
                                    }
                            }
                        } catch {
                            // Might be plain text chunk
                            if (dataStr && !dataStr.startsWith('{')) {
                                messageBuffer += dataStr;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Stream error:', error);
                onEvent({ type: 'error', content: error.message });
            }
        } finally {
            isStreamingRef.current = false;
        }
    }, [onEvent, onMessage]);

    /**
     * Disconnect from the stream
     */
    const disconnect = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        isStreamingRef.current = false;
    }, []);

    return {
        connect,
        disconnect,
        isStreaming: isStreamingRef.current
    };
}
