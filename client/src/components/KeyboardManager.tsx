/**
 * Keyboard Manager
 * 
 * Wraps app with keyboard shortcuts, command palette, and shortcuts help.
 */

import { type ReactNode, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ShortcutsHelp } from './ShortcutsHelp';
import { CommandPalette } from './CommandPalette';
import { initKeyboardDetection } from '../lib/keyboardDetection';

// ─── Component ──────────────────────────────────────────────────────────────

interface KeyboardManagerProps {
    children: ReactNode;
}

export function KeyboardManager({ children }: KeyboardManagerProps) {
    const navigate = useNavigate();

    const handleNavigate = useCallback((path: string) => {
        navigate(path);
    }, [navigate]);

    const shortcuts = useKeyboardShortcuts({
        enabled: true,
        onNavigate: handleNavigate,
    });

    // Initialize keyboard detection on mount
    useEffect(() => {
        initKeyboardDetection();
    }, []);

    return (
        <>
            {children}
            <ShortcutsHelp shortcuts={shortcuts} />
            <CommandPalette onNavigate={handleNavigate} />
        </>
    );
}

export default KeyboardManager;
