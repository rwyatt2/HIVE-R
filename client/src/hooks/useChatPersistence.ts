/**
 * Chat Persistence Hook
 * 
 * Provides localStorage + API sync for chat messages.
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
    id: string;
    role: 'user' | 'agent';
    agentName?: string;
    content: string;
    timestamp?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount?: number;
}

interface UseChatPersistenceReturn {
    messages: Message[];
    sessions: ChatSession[];
    currentSessionId: string | null;
    addMessage: (role: 'user' | 'agent', content: string, agentName?: string) => void;
    createNewSession: () => void;
    switchSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    isLoading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'hive-chat-messages';
const SESSION_KEY = 'hive-current-session';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================================
// HOOK
// ============================================================================

export function useChatPersistence(): UseChatPersistenceReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetch sessions from API
     */
    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/history/sessions`);
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch {
            console.error('Failed to fetch sessions');
        }
    }, []);

    /**
     * Create a new chat session
     */
    const createNewSession = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/history/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (response.ok) {
                const session = await response.json();
                setCurrentSessionId(session.id);
                setMessages([]);
                localStorage.setItem(SESSION_KEY, session.id);

                // Refresh sessions list
                fetchSessions();
            }
        } catch {
            // Fallback to local-only session
            const localId = `local-${Date.now()}`;
            setCurrentSessionId(localId);
            setMessages([]);
            localStorage.setItem(SESSION_KEY, localId);
        }
    }, [fetchSessions]);

    /**
     * Switch to a different session
     */
    const switchSession = useCallback(async (sessionId: string) => {
        setIsLoading(true);

        try {
            // Check localStorage first
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                if (data[sessionId]) {
                    setMessages(data[sessionId]);
                    setCurrentSessionId(sessionId);
                    localStorage.setItem(SESSION_KEY, sessionId);
                    setIsLoading(false);
                    return;
                }
            }

            // Fall back to API
            const response = await fetch(`${API_BASE}/history/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                const apiMessages: Message[] = (data.messages || []).map((m: { id: string; role: 'user' | 'agent'; agent_name?: string; content: string; timestamp: string }) => ({
                    id: m.id,
                    role: m.role,
                    agentName: m.agent_name,
                    content: m.content,
                    timestamp: m.timestamp
                }));
                setMessages(apiMessages);
                setCurrentSessionId(sessionId);
                localStorage.setItem(SESSION_KEY, sessionId);
            }
        } catch {
            console.error('Failed to switch session');
        }

        setIsLoading(false);
    }, []);

    /**
     * Delete a session
     */
    const deleteSession = useCallback(async (sessionId: string) => {
        try {
            await fetch(`${API_BASE}/history/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            // Remove from localStorage
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                delete data[sessionId];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }

            // If deleting current session, create a new one
            if (sessionId === currentSessionId) {
                createNewSession();
            }

            // Refresh sessions list
            fetchSessions();
        } catch {
            console.error('Failed to delete session');
        }
    }, [currentSessionId, createNewSession, fetchSessions]);

    /**
     * Add a message to the current session
     */
    const addMessage = useCallback((role: 'user' | 'agent', content: string, agentName?: string) => {
        const message: Message = {
            id: Date.now().toString(),
            role,
            content,
            agentName,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, message]);

        // Sync to API (fire and forget)
        if (currentSessionId) {
            fetch(`${API_BASE}/history/sessions/${currentSessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, content, agentName })
            }).catch(() => console.error('Failed to sync message'));
        }
    }, [currentSessionId]);

    // Load messages from localStorage on mount
    useEffect(() => {
        const loadFromStorage = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                const sessionId = localStorage.getItem(SESSION_KEY);

                if (stored && sessionId) {
                    const data = JSON.parse(stored);
                    if (data[sessionId]) {
                        setMessages(data[sessionId]);
                        setCurrentSessionId(sessionId);
                    }
                }
                setIsLoading(false);
            } catch {
                console.error('Failed to load chat from storage');
                setIsLoading(false);
            }
        };

        loadFromStorage();
        fetchSessions();
    }, [fetchSessions]);

    // Save to localStorage whenever messages change
    useEffect(() => {
        if (currentSessionId && messages.length > 0) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                const data = stored ? JSON.parse(stored) : {};
                data[currentSessionId] = messages;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(SESSION_KEY, currentSessionId);
            } catch {
                console.error('Failed to save chat to storage');
            }
        }
    }, [messages, currentSessionId]);

    return {
        messages,
        sessions,
        currentSessionId,
        addMessage,
        createNewSession,
        switchSession,
        deleteSession,
        isLoading
    };
}
