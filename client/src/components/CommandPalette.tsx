/**
 * Command Palette
 * 
 * Quick command access with Cmd/Ctrl+K.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Home, MessageSquare, Settings, CreditCard, Users } from 'lucide-react';
import { useFocusTrap, useFocusReturn } from '../lib/focus';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Command {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    keywords?: string[];
}

interface CommandPaletteProps {
    onNavigate?: (path: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const paletteRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useFocusTrap(paletteRef, isOpen);
    useFocusReturn();

    const commands: Command[] = [
        { id: 'dashboard', label: 'Go to Dashboard', icon: <Home className="w-4 h-4" />, action: () => onNavigate?.('/dashboard'), keywords: ['home'] },
        { id: 'studio', label: 'Go to Studio', icon: <MessageSquare className="w-4 h-4" />, action: () => onNavigate?.('/app'), keywords: ['chat', 'agents'] },
        { id: 'billing', label: 'Billing & Plans', icon: <CreditCard className="w-4 h-4" />, action: () => onNavigate?.('/billing'), keywords: ['payment', 'subscribe'] },
        { id: 'organization', label: 'Organization Settings', icon: <Users className="w-4 h-4" />, action: () => onNavigate?.('/organization'), keywords: ['team', 'members'] },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, action: () => onNavigate?.('/settings'), keywords: ['preferences', 'config'] },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
    );

    const executeCommand = useCallback((command: Command) => {
        command.action();
        setIsOpen(false);
        setSearch('');
        setSelectedIndex(0);
    }, []);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
        };
        const handleClose = () => setIsOpen(false);

        window.addEventListener('open-command-palette', handleOpen);
        window.addEventListener('close-modal', handleClose);

        return () => {
            window.removeEventListener('open-command-palette', handleOpen);
            window.removeEventListener('close-modal', handleClose);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = filteredCommands[selectedIndex];
                if (cmd) executeCommand(cmd);
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, executeCommand]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
        >
            <div
                ref={paletteRef}
                className="bg-void-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                    <Search className="w-5 h-5 text-starlight-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Type a command..."
                        className="flex-1 bg-transparent text-white placeholder-starlight-500 outline-none"
                        autoComplete="off"
                    />
                </div>

                {/* Commands List */}
                <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
                    {filteredCommands.map((command, index) => (
                        <li
                            key={command.id}
                            className={`
                                flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                                ${index === selectedIndex ? 'bg-electric-violet/20 text-white' : 'text-starlight-300 hover:bg-white/5'}
                            `}
                            onClick={() => executeCommand(command)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            <span className="text-starlight-400">{command.icon}</span>
                            <span>{command.label}</span>
                        </li>
                    ))}
                    {filteredCommands.length === 0 && (
                        <li className="px-4 py-8 text-center text-starlight-500">
                            No commands found
                        </li>
                    )}
                </ul>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-3 border-t border-white/10 text-xs text-starlight-500">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-void-800 rounded">↑↓</kbd> Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-void-800 rounded">Enter</kbd> Execute
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-void-800 rounded">Esc</kbd> Close
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
