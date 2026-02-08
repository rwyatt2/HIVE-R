/**
 * Session Sidebar — Intelligent Hive Design
 * 
 * 280px collapsible sidebar for chat history with
 * glassmorphic styling and indigo active indicators.
 */

import { PlusCircle, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ChatSession } from '../hooks/useChatPersistence';

interface SessionSidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onNewSession: () => void;
    onSelectSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

export function SessionSidebar({
    sessions,
    currentSessionId,
    onNewSession,
    onSelectSession,
    onDeleteSession,
    isCollapsed,
    onToggle
}: SessionSidebarProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    /* ── Collapsed State ── */
    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center gap-2 py-4 px-2 bg-hive-bg-dark/95 border-r border-hive-border-subtle h-full">
                <button
                    onClick={onToggle}
                    title="Expand sidebar"
                    className="p-2 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg transition-all"
                >
                    <ChevronRight size={18} />
                </button>
                <button
                    onClick={onNewSession}
                    title="New chat"
                    className="p-2 text-hive-indigo hover:bg-hive-indigo-muted rounded-lg transition-all"
                >
                    <PlusCircle size={18} />
                </button>
            </div>
        );
    }

    /* ── Expanded State ── */
    return (
        <div className="flex flex-col w-[280px] bg-hive-bg-dark/95 border-r border-hive-border-subtle h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-hive-border-subtle">
                <h3 className="text-sm font-semibold text-hive-text-primary tracking-wide">
                    Chat History
                </h3>
                <button
                    onClick={onToggle}
                    title="Collapse sidebar"
                    className="p-1.5 text-hive-text-tertiary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-md transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
            </div>

            {/* New Chat Button */}
            <div className="px-3 py-3">
                <button
                    onClick={onNewSession}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-hive-indigo bg-hive-indigo-muted hover:bg-hive-indigo/20 rounded-lg transition-all"
                >
                    <PlusCircle size={16} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin space-y-0.5">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-hive-text-tertiary">
                        <MessageSquare size={28} className="mb-3 opacity-40" />
                        <p className="text-sm">No chat history yet</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${session.id === currentSessionId
                                    ? 'bg-hive-indigo-muted border-l-[3px] border-hive-indigo text-hive-text-primary'
                                    : 'text-hive-text-secondary hover:bg-hive-surface/30 hover:text-hive-text-primary border-l-[3px] border-transparent'
                                }`}
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="flex-1 min-w-0">
                                <span className="block text-sm font-medium truncate">
                                    {session.title}
                                </span>
                                <span className="block text-xs text-hive-text-tertiary mt-0.5">
                                    {formatDate(session.updatedAt)}
                                </span>
                            </div>
                            <button
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-hive-text-tertiary hover:text-hive-error hover:bg-hive-error-muted rounded-md transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                }}
                                title="Delete session"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
