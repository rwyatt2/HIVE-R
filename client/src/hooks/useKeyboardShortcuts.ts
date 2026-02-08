/**
 * Keyboard Shortcuts Hook
 * 
 * Global keyboard shortcuts for power user navigation.
 */

import { useEffect, useCallback, useMemo } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Shortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    description: string;
    action: () => void;
    category: string;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
    onNavigate?: (path: string) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
    const { enabled = true, onNavigate } = options;

    const shortcuts: Shortcut[] = useMemo(() => [
        // Navigation
        {
            key: 'g',
            description: 'Go to Dashboard',
            action: () => onNavigate?.('/dashboard'),
            category: 'Navigation',
        },
        {
            key: 'c',
            description: 'Go to Chat/Studio',
            action: () => onNavigate?.('/app'),
            category: 'Navigation',
        },
        {
            key: 'b',
            description: 'Go to Billing',
            action: () => onNavigate?.('/billing'),
            category: 'Navigation',
        },

        // Actions
        {
            key: 'n',
            ctrlKey: true,
            description: 'New Chat',
            action: () => {
                onNavigate?.('/app');
                window.dispatchEvent(new CustomEvent('new-chat'));
            },
            category: 'Actions',
        },
        {
            key: '/',
            description: 'Focus Chat Input',
            action: () => {
                const input = document.querySelector('[data-chat-input]') as HTMLElement;
                input?.focus();
            },
            category: 'Actions',
        },

        // UI
        {
            key: 'k',
            ctrlKey: true,
            description: 'Command Palette',
            action: () => {
                window.dispatchEvent(new CustomEvent('open-command-palette'));
            },
            category: 'UI',
        },
        {
            key: '?',
            description: 'Keyboard Shortcuts Help',
            action: () => {
                window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
            },
            category: 'Help',
        },
        {
            key: 'Escape',
            description: 'Close Modal/Dismiss',
            action: () => {
                window.dispatchEvent(new CustomEvent('close-modal'));
            },
            category: 'UI',
        },

        // Settings
        {
            key: ',',
            ctrlKey: true,
            description: 'Open Settings',
            action: () => onNavigate?.('/settings'),
            category: 'Settings',
        },
    ], [onNavigate]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger when typing (except Escape)
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        if (isTyping && e.key !== 'Escape') return;

        // Find matching shortcut
        const shortcut = shortcuts.find(s => {
            const keyMatches = s.key.toLowerCase() === e.key.toLowerCase();
            const ctrlMatches = s.ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
            const shiftMatches = s.shiftKey ? e.shiftKey : !e.shiftKey;
            return keyMatches && ctrlMatches && shiftMatches;
        });

        if (shortcut) {
            e.preventDefault();
            shortcut.action();
        }
    }, [shortcuts]);

    useEffect(() => {
        if (!enabled) return;
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);

    return shortcuts;
}

export default useKeyboardShortcuts;
