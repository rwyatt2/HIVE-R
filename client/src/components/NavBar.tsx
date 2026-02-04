/**
 * NavBar Component
 * 
 * Shared navigation across all pages in the unified HIVE-R app.
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './NavBar.css';

export function NavBar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <span className="logo-emoji">🐝</span>
                    <span className="logo-text">HIVE-R</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links">
                    {user ? (
                        <>
                            <Link to="/app" className={`nav-link ${isActive('/app') ? 'active' : ''}`}>
                                Studio
                            </Link>
                            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                                Dashboard
                            </Link>
                            <Link to="/plugins" className={`nav-link ${isActive('/plugins') ? 'active' : ''}`}>
                                Plugins
                            </Link>
                            <Link to="/docs" className={`nav-link ${isActive('/docs') ? 'active' : ''}`}>
                                Docs
                            </Link>
                        </>
                    ) : (
                        <>
                            <a href="#features" className="nav-link">Features</a>
                            <a href="#how-it-works" className="nav-link">How It Works</a>
                            <Link to="/docs" className={`nav-link ${isActive('/docs') ? 'active' : ''}`}>
                                Docs
                            </Link>
                            <Link to="/demo" className="nav-link nav-cta">
                                Try Demo
                            </Link>
                        </>
                    )}
                </div>

                {/* User Menu */}
                <div className="navbar-user">
                    {user ? (
                        <div className="user-menu">
                            <Link to="/settings" className="user-menu-btn" title="Settings">
                                <Settings size={18} />
                            </Link>
                            <button onClick={handleLogout} className="user-menu-btn" title="Logout">
                                <LogOut size={18} />
                            </button>
                            <div className="user-avatar">
                                <User size={18} />
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="btn-login">
                            Login
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu">
                    {user ? (
                        <>
                            <Link to="/app" onClick={() => setMobileMenuOpen(false)}>Studio</Link>
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                            <Link to="/plugins" onClick={() => setMobileMenuOpen(false)}>Plugins</Link>
                            <Link to="/docs" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                            <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/demo" onClick={() => setMobileMenuOpen(false)}>Try Demo</Link>
                            <Link to="/docs" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
