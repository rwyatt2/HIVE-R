import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, MessageSquare, Users, Settings, BarChart2 } from 'lucide-react';
import { useIsMobile } from '../hooks/useBreakpoint';

const navItems = [
    { path: '/app', icon: Home, label: 'Dashboard' },
    { path: '/app/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/app/agents', icon: Users, label: 'Agents' },
    { path: '/app/costs', icon: BarChart2, label: 'Costs' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const isMobile = useIsMobile();

    if (!isMobile) return null;

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-hive-surface rounded-lg md:hidden"
                aria-label="Menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        />

                        {/* Slide-out Menu */}
                        <motion.nav
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed top-0 left-0 bottom-0 w-64 bg-hive-surface z-50 p-6 md:hidden"
                        >
                            <div className="text-xl font-bold mb-8 mt-12">🐝 HIVE-R</div>

                            <ul className="space-y-2">
                                {navItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                                    ? 'bg-hive-indigo/20 text-hive-indigo'
                                                    : 'hover:bg-hive-surface-light'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export function BottomNav() {
    const location = useLocation();
    const isMobile = useIsMobile();

    if (!isMobile) return null;

    const bottomItems = navItems.slice(0, 4); // Show first 4 items

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-hive-surface border-t border-hive-border z-40 md:hidden safe-area-bottom">
            <ul className="flex justify-around">
                {bottomItems.map((item) => (
                    <li key={item.path} className="flex-1">
                        <Link
                            to={item.path}
                            className={`flex flex-col items-center py-3 min-h-[56px] ${location.pathname === item.path
                                    ? 'text-hive-indigo'
                                    : 'text-hive-text-muted'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
