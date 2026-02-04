/**
 * Session Sidebar Component
 * 
 * Displays chat history with session list
 */

import { PlusCircle, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ChatSession } from '../hooks/useChatPersistence';
import './SessionSidebar.css';

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

    if (isCollapsed) {
        return (
            <div className="session-sidebar collapsed">
                <button className="toggle-btn" onClick={onToggle} title="Expand sidebar">
                    <ChevronRight size={20} />
                </button>
                <button className="new-session-btn icon-only" onClick={onNewSession} title="New chat">
                    <PlusCircle size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="session-sidebar">
            <div className="sidebar-header">
                <h3>Chat History</h3>
                <button className="toggle-btn" onClick={onToggle} title="Collapse sidebar">
                    <ChevronLeft size={20} />
                </button>
            </div>

            <button className="new-session-btn" onClick={onNewSession}>
                <PlusCircle size={18} />
                <span>New Chat</span>
            </button>

            <div className="session-list">
                {sessions.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={32} />
                        <p>No chat history yet</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="session-info">
                                <span className="session-title">{session.title}</span>
                                <span className="session-date">{formatDate(session.updatedAt)}</span>
                            </div>
                            <button
                                className="delete-btn"
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
