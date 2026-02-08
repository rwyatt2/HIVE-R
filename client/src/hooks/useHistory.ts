/**
 * Chat History Hook
 * 
 * Manages session list and session messages with pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ChatSession, ChatMessage, PaginatedResponse } from '../types/history';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Session List Hook ──────────────────────────────────────────────────────

export function useHistory() {
    const { getAccessToken } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/api/history/sessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch sessions');

            const data: PaginatedResponse<ChatSession> = await response.json();
            setSessions(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Client-side search
    const filteredSessions = searchQuery
        ? sessions.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.preview?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : sessions;

    const deleteSession = useCallback(async (sessionId: string) => {
        const token = await getAccessToken();
        await fetch(`${API_URL}/api/history/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    }, [getAccessToken]);

    const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
        const token = await getAccessToken();
        await fetch(`${API_URL}/api/history/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: newTitle }),
        });
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, title: newTitle } : s
        ));
    }, [getAccessToken]);

    return {
        sessions: filteredSessions,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        deleteSession,
        renameSession,
        refresh: fetchSessions,
    };
}

// ─── Session Messages Hook ──────────────────────────────────────────────────

export function useSessionMessages(sessionId: string | null) {
    const { getAccessToken } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Reset when session changes
    useEffect(() => {
        setMessages([]);
        setCursor(null);
        setHasMore(true);
    }, [sessionId]);

    const loadMessages = useCallback(async () => {
        if (!sessionId || loading) return;

        setLoading(true);
        try {
            const token = await getAccessToken();
            const url = `${API_URL}/api/history/sessions/${sessionId}/messages?limit=50${cursor ? `&cursor=${cursor}` : ''}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to load messages');

            const data: PaginatedResponse<ChatMessage> = await response.json();
            setMessages(prev => [...prev, ...data.data]);
            setCursor(data.nextCursor ?? null);
            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    }, [sessionId, cursor, loading, getAccessToken]);

    // Load initial messages
    useEffect(() => {
        if (sessionId && messages.length === 0) {
            loadMessages();
        }
    }, [sessionId, messages.length, loadMessages]);

    return {
        messages,
        loading,
        hasMore,
        loadMore: loadMessages,
    };
}
