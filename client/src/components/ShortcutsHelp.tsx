/**
 * Shortcuts Help Modal
 * 
 * Shows keyboard shortcuts when ? is pressed.
 */

import { useState, useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useFocusTrap, useFocusReturn } from '../lib/focus';
import type { Shortcut } from '../hooks/useKeyboardShortcuts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShortcutsHelpProps {
    shortcuts: Shortcut[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShortcutsHelp({ shortcuts }: ShortcutsHelpProps) {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(modalRef, isOpen);
    useFocusReturn();

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        const handleClose = () => setIsOpen(false);

        window.addEventListener('open-shortcuts-help', handleOpen);
        window.addEventListener('close-modal', handleClose);

        return () => {
            window.removeEventListener('open-shortcuts-help', handleOpen);
            window.removeEventListener('close-modal', handleClose);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!isOpen) return null;

    // Group by category
    const grouped = shortcuts.reduce<Record<string, Shortcut[]>>((acc, s) => {
        const category = s.category;
        const existing = acc[category];
        acc[category] = existing ? [...existing, s] : [s];
        return acc;
    }, {});

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
        >
            <div
                ref={modalRef}
                className="bg-void-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-labelledby="shortcuts-title"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 id="shortcuts-title" className="text-lg font-semibold text-white flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-electric-violet" />
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-starlight-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-xs font-medium text-starlight-400 uppercase tracking-wider mb-3">
                                {category}
                            </h3>
                            <dl className="space-y-2">
                                {items.map((shortcut, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <dt className="text-sm text-starlight-300">{shortcut.description}</dt>
                                        <dd>
                                            <KeyCombo shortcut={shortcut} />
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                    <p className="text-xs text-starlight-500">
                        Press <kbd className="px-1.5 py-0.5 bg-void-800 rounded text-starlight-300">?</kbd> anytime to view shortcuts
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Key Combo Display ──────────────────────────────────────────────────────

function KeyCombo({ shortcut }: { shortcut: Shortcut }) {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
    const modKey = isMac ? '⌘' : 'Ctrl';

    return (
        <span className="flex items-center gap-1">
            {shortcut.ctrlKey && (
                <kbd className="px-1.5 py-0.5 bg-void-800 border border-white/10 rounded text-xs text-starlight-300">
                    {modKey}
                </kbd>
            )}
            {shortcut.shiftKey && (
                <kbd className="px-1.5 py-0.5 bg-void-800 border border-white/10 rounded text-xs text-starlight-300">
                    Shift
                </kbd>
            )}
            <kbd className="px-1.5 py-0.5 bg-void-800 border border-white/10 rounded text-xs text-starlight-300">
                {shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase()}
            </kbd>
        </span>
    );
}

export default ShortcutsHelp;
