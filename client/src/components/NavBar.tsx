/**
 * NavBar — Intelligent Hive Navigation
 * 
 * 72px glassmorphic sticky navigation with HIVE-R wordmark,
 * scroll-aware backdrop, and responsive mobile drawer.
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, Menu, X, Hexagon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function NavBar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navLinkClass = (path: string) =>
        `relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${isActive(path)
            ? 'text-hive-text-primary'
            : 'text-hive-text-secondary hover:text-hive-text-primary'
        }`;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'glass-nav shadow-glass-heavy'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-[72px]">

                    {/* ── Logo ── */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <Hexagon
                                className="w-8 h-8 text-hive-indigo fill-hive-indigo/10 transition-all duration-300 group-hover:fill-hive-indigo/20 group-hover:scale-105"
                                strokeWidth={1.5}
                            />
                            <Hexagon
                                className="absolute inset-0 w-8 h-8 text-hive-indigo/60 m-auto scale-50"
                                strokeWidth={2}
                            />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-hive-text-primary">
                            HIVE<span className="text-hive-indigo">-R</span>
                        </span>
                    </Link>

                    {/* ── Desktop Nav Links ── */}
                    <div className="hidden md:flex items-center gap-1">
                        {user ? (
                            <>
                                <Link to="/app" className={navLinkClass('/app')}>
                                    Studio
                                    {isActive('/app') && (
                                        <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-hive-honey rounded-full" />
                                    )}
                                </Link>
                                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                                    Dashboard
                                    {isActive('/dashboard') && (
                                        <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-hive-honey rounded-full" />
                                    )}
                                </Link>
                                <Link to="/plugins" className={navLinkClass('/plugins')}>
                                    Plugins
                                    {isActive('/plugins') && (
                                        <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-hive-honey rounded-full" />
                                    )}
                                </Link>
                                <Link to="/docs" className={navLinkClass('/docs')}>
                                    Docs
                                    {isActive('/docs') && (
                                        <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-hive-honey rounded-full" />
                                    )}
                                </Link>
                            </>
                        ) : (
                            <>
                                <a
                                    href="#features"
                                    className="px-4 py-2 text-sm text-hive-text-secondary hover:text-hive-text-primary transition-colors rounded-md"
                                >
                                    Features
                                </a>
                                <a
                                    href="#how-it-works"
                                    className="px-4 py-2 text-sm text-hive-text-secondary hover:text-hive-text-primary transition-colors rounded-md"
                                >
                                    How It Works
                                </a>
                                <Link
                                    to="/docs"
                                    className="px-4 py-2 text-sm text-hive-text-secondary hover:text-hive-text-primary transition-colors rounded-md"
                                >
                                    Docs
                                </Link>
                            </>
                        )}
                    </div>

                    {/* ── Right Side ── */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    to="/settings"
                                    className="p-2.5 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg transition-all"
                                    title="Settings"
                                >
                                    <Settings className="w-[18px] h-[18px]" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut className="w-[18px] h-[18px]" />
                                </button>
                                {/* User Avatar */}
                                <div className="w-10 h-10 rounded-full bg-indigo-gradient flex items-center justify-center text-sm font-bold text-white ml-1 ring-2 ring-hive-indigo/30 hover:ring-hive-indigo/60 transition-all cursor-pointer">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <Link
                                    to="/demo"
                                    className="px-4 py-2.5 text-sm text-hive-text-secondary hover:text-hive-text-primary transition-colors"
                                >
                                    Try Demo
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-6 py-2.5 text-sm font-semibold bg-hive-indigo hover:bg-hive-indigo-dark text-white rounded-lg shadow-neon-indigo/50 hover:shadow-neon-indigo transition-all duration-300"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {/* Mobile toggle */}
                        <button
                            className="md:hidden p-2.5 text-hive-text-secondary hover:text-hive-text-primary transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Menu ── */}
            {mobileOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-hive-bg-dark/95 backdrop-blur-2xl border-b border-hive-border-subtle animate-fade-in-up">
                    <div className="px-6 py-6 space-y-1">
                        {user ? (
                            <>
                                <Link to="/app" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Studio</Link>
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Dashboard</Link>
                                <Link to="/plugins" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Plugins</Link>
                                <Link to="/docs" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Docs</Link>
                                <Link to="/settings" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Settings</Link>
                                <div className="pt-3 mt-3 border-t border-hive-border-subtle">
                                    <button onClick={handleLogout} className="text-sm text-hive-error hover:text-hive-error/80 transition-colors px-3 py-2">
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/demo" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Try Demo</Link>
                                <Link to="/docs" onClick={() => setMobileOpen(false)} className="block py-3 px-3 text-sm text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30 rounded-lg transition-all">Docs</Link>
                                <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-center bg-hive-indigo hover:bg-hive-indigo-dark text-white rounded-lg transition-colors mt-3 font-semibold">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
