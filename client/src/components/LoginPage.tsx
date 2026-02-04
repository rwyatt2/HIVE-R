/**
 * Login Page Component
 * 
 * Handles user login and registration with a beautiful UI.
 */

import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

interface LoginPageProps {
    onSuccess?: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
    const { login, register, isLoading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setConfirmPassword('');
    };

    if (authLoading) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-loading">
                        <span className="typing-indicator">
                            <span></span><span></span><span></span>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">🐝</div>
                    <h1>HIVE-R Studio</h1>
                    <p>{isLogin ? 'Welcome back!' : 'Create your account'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            disabled={isSubmitting}
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="typing-indicator">
                                <span></span><span></span><span></span>
                            </span>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <button
                            type="button"
                            className="toggle-mode"
                            onClick={toggleMode}
                            disabled={isSubmitting}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>

                <div className="login-demo">
                    <p>Or continue without an account</p>
                    <button
                        type="button"
                        className="demo-btn"
                        onClick={() => onSuccess?.()}
                    >
                        Try Demo Mode
                    </button>
                </div>
            </div>
        </div>
    );
}
