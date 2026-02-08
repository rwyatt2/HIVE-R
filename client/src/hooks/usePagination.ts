/**
 * Pagination Hook
 * 
 * Generic hook for paginated API requests.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
}

interface UsePaginationOptions {
    /** Items per page (default: 50, max: 100) */
    limit?: number;
    /** Additional query parameters */
    params?: Record<string, string | number | boolean>;
    /** Whether to fetch immediately on mount */
    fetchOnMount?: boolean;
}

interface UsePaginationResult<T> {
    /** Current page data */
    data: T[];
    /** Is currently loading */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** Pagination metadata */
    pagination: PaginationMeta;
    /** Current page number (0-indexed) */
    page: number;
    /** Go to next page */
    nextPage: () => void;
    /** Go to previous page */
    prevPage: () => void;
    /** Go to specific page */
    goToPage: (page: number) => void;
    /** Refresh current page */
    refresh: () => void;
}

// ─── Hook Implementation ────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || '';

export function usePagination<T>(
    endpoint: string,
    options: UsePaginationOptions = {}
): UsePaginationResult<T> {
    const { getAccessToken } = useAuth();
    const { limit = 50, params = {}, fetchOnMount = true } = options;

    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        limit,
        offset: 0,
        hasNext: false,
        hasPrev: false,
    });

    // Memoize params to prevent infinite loops
    const paramsString = useMemo(() => JSON.stringify(params), [params]);

    const fetchData = useCallback(async () => {
        const token = getAccessToken();
        if (!token && endpoint.startsWith('/api')) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const offset = page * limit;
            const queryParams = new URLSearchParams({
                limit: String(limit),
                offset: String(offset),
                ...Object.fromEntries(
                    Object.entries(params).map(([k, v]) => [k, String(v)])
                ),
            });

            const url = `${API_URL}${endpoint}?${queryParams}`;
            const response = await fetch(url, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            // Handle both paginated and non-paginated responses
            if (result.pagination) {
                setData(result.data);
                setPagination(result.pagination);
            } else if (Array.isArray(result)) {
                setData(result);
                setPagination({
                    total: result.length,
                    limit,
                    offset: 0,
                    hasNext: false,
                    hasPrev: false,
                });
            } else {
                setData(result.data || []);
            }
        } catch (err) {
            setError((err as Error).message);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, getAccessToken, page, limit, paramsString]);

    useEffect(() => {
        if (fetchOnMount) {
            fetchData();
        }
    }, [fetchData, fetchOnMount]);

    const nextPage = useCallback(() => {
        if (pagination.hasNext) {
            setPage(p => p + 1);
        }
    }, [pagination.hasNext]);

    const prevPage = useCallback(() => {
        if (pagination.hasPrev) {
            setPage(p => Math.max(0, p - 1));
        }
    }, [pagination.hasPrev]);

    const goToPage = useCallback((newPage: number) => {
        const maxPage = Math.ceil(pagination.total / limit) - 1;
        setPage(Math.max(0, Math.min(newPage, maxPage)));
    }, [pagination.total, limit]);

    return {
        data,
        isLoading,
        error,
        pagination,
        page,
        nextPage,
        prevPage,
        goToPage,
        refresh: fetchData,
    };
}

export default usePagination;
