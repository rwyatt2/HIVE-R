/**
 * Infinite Scroll Hook
 * 
 * Uses Intersection Observer to trigger loading more items.
 */

import { useRef, useEffect, useCallback } from 'react';

export function useInfiniteScroll(
    onLoadMore: () => void,
    hasMore: boolean,
    loading = false
): React.RefObject<HTMLDivElement | null> {
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loading) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loading]);

    useEffect(() => {
        if (!containerRef.current) return;

        observerRef.current = new IntersectionObserver(handleIntersect, {
            threshold: 0.1,
            rootMargin: '100px',
        });

        // Observe sentinel element (last child)
        const sentinel = containerRef.current.querySelector('[data-sentinel]');
        if (sentinel) {
            observerRef.current.observe(sentinel);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [handleIntersect]);

    return containerRef;
}

export default useInfiniteScroll;
