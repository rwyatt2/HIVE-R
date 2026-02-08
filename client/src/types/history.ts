/**
 * Chat History Types
 */

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    agents: string[];
    totalCost?: number;
    preview?: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    agent?: string;
    createdAt: string;
}

export interface SessionFilters {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    agents?: string[];
}

export interface PaginatedResponse<T> {
    data: T[];
    nextCursor?: string;
    hasMore: boolean;
}
