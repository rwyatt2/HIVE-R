import { useState, useCallback } from 'react';
import type { TouchEvent } from 'react';

interface SwipeHandlers {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
}

export function useSwipe(
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void,
    minDistance = 50
): SwipeHandlers {
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

    const onTouchStart = useCallback((e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        });
    }, []);

    const onTouchMove = useCallback((e: TouchEvent) => {
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        });
    }, []);

    const onTouchEnd = useCallback(() => {
        if (!touchStart || !touchEnd) return;

        const distX = touchStart.x - touchEnd.x;
        const distY = touchStart.y - touchEnd.y;
        const isHorizontal = Math.abs(distX) > Math.abs(distY);

        if (isHorizontal) {
            if (distX > minDistance && onSwipeLeft) {
                onSwipeLeft();
            } else if (distX < -minDistance && onSwipeRight) {
                onSwipeRight();
            }
        } else {
            if (distY > minDistance && onSwipeUp) {
                onSwipeUp();
            } else if (distY < -minDistance && onSwipeDown) {
                onSwipeDown();
            }
        }
    }, [touchStart, touchEnd, minDistance, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    return { onTouchStart, onTouchMove, onTouchEnd };
}
