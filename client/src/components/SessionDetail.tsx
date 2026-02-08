/**
 * Session Detail Component
 * 
 * Shows conversation messages with infinite scroll.
 */

import { useRef, useEffect } from 'react';
import { MessageSquare, Play, Download, Loader2 } from 'lucide-react';
import { useSessionMessages } from '../hooks/useHistory';
import type { ChatMessage } from '../types/history';

// ─── Props ──────────────────────────────────────────────────────────────────

interface SessionDetailProps {
    sessionId: string | null;
    onResume?: (sessionId: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SessionDetail({ sessionId, onResume }: SessionDetailProps) {
    const { messages, loading, hasMore, loadMore } = useSessionMessages(sessionId);
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on initial load
    useEffect(() => {
        if (messages.length > 0 && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages.length]);

    if (!sessionId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-starlight-400">
                <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm text-starlight-500 mt-1">Choose from your history on the left</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
            >
                {/* Load More */}
                {hasMore && (
                    <div className="text-center py-4">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-void-700 hover:bg-void-600 text-starlight-300 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading...
                                </span>
                            ) : (
                                'Load older messages'
                            )}
                        </button>
                    </div>
                )}

                {/* Messages List */}
                {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {/* Loading indicator for initial load */}
                {loading && messages.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
                    </div>
                )}

                {/* Sentinel for infinite scroll */}
                <div data-sentinel className="h-1" />
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                    onClick={() => onResume?.(sessionId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-electric-violet hover:bg-electric-violet/80 text-white rounded-xl font-medium transition-colors"
                >
                    <Play className="w-4 h-4" />
                    Resume Conversation
                </button>
                <button className="px-4 py-3 bg-void-700 hover:bg-void-600 text-starlight-300 rounded-xl transition-colors">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`
                    max-w-[80%] p-4 rounded-2xl
                    ${isUser
                        ? 'bg-electric-violet text-white'
                        : 'glass-high-contrast text-starlight-200'
                    }
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-2 text-xs opacity-70">
                    {!isUser && message.agent && (
                        <span className="font-medium">{message.agent}</span>
                    )}
                    <span>{formatTime(message.createdAt)}</span>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                </div>
            </div>
        </div>
    );
}

export default SessionDetail;
