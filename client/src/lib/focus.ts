/**
 * Focus Management Utilities
 * 
 * Focus trap, restore, and utility functions for accessibility.
 */

import { useEffect, useRef, type RefObject } from 'react';

// ─── Focusable Selectors ────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

// ─── Get Focusable Elements ─────────────────────────────────────────────────

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

// ─── Focus Trap Hook ────────────────────────────────────────────────────────

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isActive: boolean): void {
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        firstElement?.focus();

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTab);
        return () => container.removeEventListener('keydown', handleTab);
    }, [containerRef, isActive]);
}

// ─── Focus Return Hook ──────────────────────────────────────────────────────

export function useFocusReturn(): void {
    const previousFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        previousFocus.current = document.activeElement as HTMLElement;

        return () => {
            previousFocus.current?.focus();
        };
    }, []);
}

// ─── Auto Focus Hook ────────────────────────────────────────────────────────

export function useAutoFocus(ref: RefObject<HTMLElement | null>, enabled = true): void {
    useEffect(() => {
        if (enabled && ref.current) {
            ref.current.focus();
        }
    }, [ref, enabled]);
}
