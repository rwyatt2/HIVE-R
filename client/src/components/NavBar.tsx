/**
 * NavBar — Glassmorphic Floating Navigation
 * 
 * Award-winning navigation with blur backdrop, animated states,
 * and scroll-aware sticky behavior. Pure Tailwind.
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
        `relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-md ${isActive(path)
            ? 'text-white'
            : 'text-starlight-400 hover:text-white'
        }`;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-void-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
                : 'bg-transparent'
            }`}>
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <Hexagon className="w-7 h-7 text-electric-violet fill-electric-violet/10 transition-all group-hover:fill-electric-violet/20" strokeWidth={1.5} />
                            <span className="absolute inset-0 flex items-center justify-center text-xs">🐝</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight">
                            HIVE<span className="text-electric-violet">-R</span>
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {user ? (
                            <>
                                <Link to="/app" className={navLinkClass('/app')}>
                                    Studio
                                    {isActive('/app') && <span className="absolute bottom-0 left-3 right-3 h-px bg-electric-violet" />}
                                </Link>
                                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                                    Dashboard
                                    {isActive('/dashboard') && <span className="absolute bottom-0 left-3 right-3 h-px bg-electric-violet" />}
                                </Link>
                                <Link to="/plugins" className={navLinkClass('/plugins')}>
                                    Plugins
                                    {isActive('/plugins') && <span className="absolute bottom-0 left-3 right-3 h-px bg-electric-violet" />}
                                </Link>
                                <Link to="/docs" className={navLinkClass('/docs')}>
                                    Docs
                                    {isActive('/docs') && <span className="absolute bottom-0 left-3 right-3 h-px bg-electric-violet" />}
                                </Link>
                            </>
                        ) : (
                            <>
                                <a href="#features" className="px-3 py-1.5 text-sm text-starlight-400 hover:text-white transition-colors rounded-md">
                                    Features
                                </a>
                                <a href="#how-it-works" className="px-3 py-1.5 text-sm text-starlight-400 hover:text-white transition-colors rounded-md">
                                    How It Works
                                </a>
                                <Link to="/docs" className="px-3 py-1.5 text-sm text-starlight-400 hover:text-white transition-colors rounded-md">
                                    Docs
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    to="/settings"
                                    className="p-2 text-starlight-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
                                    title="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-starlight-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-violet to-[#8B5CF6] flex items-center justify-center text-xs font-bold ml-1">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <Link
                                    to="/demo"
                                    className="px-4 py-2 text-sm text-starlight-400 hover:text-white transition-colors"
                                >
                                    Try Demo
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-5 py-2 text-sm font-medium bg-electric-violet hover:bg-electric-indigo text-white rounded-lg shadow-neon-violet transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {/* Mobile toggle */}
                        <button
                            className="md:hidden p-2 text-starlight-400 hover:text-white transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-void-950/95 backdrop-blur-2xl border-b border-white/[0.06] animate-in slide-in-from-top-2 duration-200">
                    <div className="px-6 py-6 space-y-3">
                        {user ? (
                            <>
                                <Link to="/app" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Studio</Link>
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Dashboard</Link>
                                <Link to="/plugins" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Plugins</Link>
                                <Link to="/docs" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Docs</Link>
                                <Link to="/settings" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Settings</Link>
                                <div className="pt-3 border-t border-white/[0.06]">
                                    <button onClick={handleLogout} className="text-sm text-reactor-red hover:text-red-300 transition-colors">Logout</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/demo" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Try Demo</Link>
                                <Link to="/docs" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-starlight-400 hover:text-white transition-colors">Docs</Link>
                                <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-center bg-electric-violet hover:bg-electric-indigo text-white rounded-lg transition-colors mt-3">Sign In</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
