import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const listener = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    return prefersReducedMotion;
}

// Animation config that respects reduced motion
export function useAnimationConfig() {
    const prefersReducedMotion = useReducedMotion();

    return {
        prefersReducedMotion,
        duration: prefersReducedMotion ? 0 : 0.3,
        springConfig: prefersReducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 500, damping: 30 },
    };
}
