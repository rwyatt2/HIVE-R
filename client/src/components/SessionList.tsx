/**
 * Session List Component
 * 
 * Sidebar list of chat sessions with search and management.
 */

import { useState } from 'react';
import { Search, MoreVertical, Trash2, Edit3, MessageSquare } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { LoadingSpinner } from './LoadingSpinner';
import type { ChatSession } from '../types/history';

// ─── Props ──────────────────────────────────────────────────────────────────

interface SessionListProps {
    selectedId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SessionList({ selectedId, onSelectSession, onNewChat }: SessionListProps) {
    const {
        sessions,
        loading,
        searchQuery,
        setSearchQuery,
        deleteSession,
        renameSession,
    } = useHistory();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const handleRename = async (sessionId: string) => {
        if (editTitle.trim()) {
            await renameSession(sessionId, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleDelete = async (sessionId: string) => {
        if (confirm('Delete this conversation?')) {
            await deleteSession(sessionId);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold text-white">History</h3>
                {onNewChat && (
                    <button
                        onClick={onNewChat}
                        className="px-3 py-1.5 text-sm bg-electric-violet hover:bg-electric-violet/80 text-white rounded-lg transition-colors"
                    >
                        New Chat
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-starlight-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-void-800 border border-white/10 rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none focus:border-electric-violet"
                    />
                </div>
            </div>

            {/* Session List */}
            {loading && sessions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner label="Loading..." />
                </div>
            ) : (
                <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map(session => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            isSelected={session.id === selectedId}
                            isEditing={session.id === editingId}
                            editTitle={editTitle}
                            onSelect={() => onSelectSession(session.id)}
                            onEditStart={() => {
                                setEditingId(session.id);
                                setEditTitle(session.title);
                            }}
                            onEditChange={setEditTitle}
                            onEditSave={() => handleRename(session.id)}
                            onEditCancel={() => setEditingId(null)}
                            onDelete={() => handleDelete(session.id)}
                        />
                    ))}

                    {sessions.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 mx-auto text-starlight-500 mb-3" />
                            <p className="text-starlight-400">No conversations yet</p>
                            <p className="text-sm text-starlight-500 mt-1">Start a new chat!</p>
                        </div>
                    )}
                </ul>
            )}
        </div>
    );
}

// ─── Session Item ───────────────────────────────────────────────────────────

interface SessionItemProps {
    session: ChatSession;
    isSelected: boolean;
    isEditing: boolean;
    editTitle: string;
    onSelect: () => void;
    onEditStart: () => void;
    onEditChange: (value: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onDelete: () => void;
}

function SessionItem({
    session,
    isSelected,
    isEditing,
    editTitle,
    onSelect,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onDelete,
}: SessionItemProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <li>
            <button
                className={`
                    w-full text-left p-3 rounded-lg transition-colors
                    ${isSelected ? 'bg-electric-violet/20 border border-electric-violet/30' : 'hover:bg-void-700'}
                `}
                onClick={onSelect}
            >
                <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={e => onEditChange(e.target.value)}
                            onBlur={onEditSave}
                            onKeyDown={e => {
                                if (e.key === 'Enter') onEditSave();
                                if (e.key === 'Escape') onEditCancel();
                            }}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            className="flex-1 bg-void-800 border border-electric-violet rounded px-2 py-1 text-sm text-white"
                        />
                    ) : (
                        <h4 className="font-medium text-white text-sm truncate flex-1">
                            {session.title}
                        </h4>
                    )}

                    <div className="relative">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setMenuOpen(!menuOpen);
                            }}
                            className="p-1 text-starlight-400 hover:text-white rounded"
                            aria-label="Options"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-void-800 border border-white/10 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        onEditStart();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-starlight-300 hover:bg-void-700"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Rename
                                </button>
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        onDelete();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-void-700"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {session.preview && (
                    <p className="text-xs text-starlight-400 truncate mt-1">
                        {session.preview}
                    </p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-starlight-500">
                    <span>{formatDate(session.updatedAt)}</span>
                    <span>•</span>
                    <span>{session.messageCount} messages</span>
                    {session.totalCost !== undefined && (
                        <>
                            <span>•</span>
                            <span>${session.totalCost.toFixed(3)}</span>
                        </>
                    )}
                </div>

                {session.agents.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                        {session.agents.slice(0, 3).map(agent => (
                            <span
                                key={agent}
                                className="px-1.5 py-0.5 bg-electric-violet/20 text-electric-violet text-xs rounded"
                            >
                                {agent}
                            </span>
                        ))}
                        {session.agents.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-void-700 text-starlight-400 text-xs rounded">
                                +{session.agents.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </button>
        </li>
    );
}

export default SessionList;
