/**
 * Login Page — Glassmorphic Authentication
 * 
 * Gorgeous login/register form with the Bionic Minimalism design.
 * Features password strength indicator and inline validation.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PasswordStrength, usePasswordStrength } from './PasswordStrength';
import { ArrowRight, Sparkles, Hexagon, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
    onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

    const { login, register } = useAuth();
    const { isValid: passwordValid } = usePasswordStrength(password);

    // Email validation
    const isEmailValid = useMemo(() => {
        if (!email) return true; // Don't show error for empty
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }, [email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setFieldErrors({});

        // Validate email
        if (!email || !isEmailValid) {
            setFieldErrors({ email: 'Please enter a valid email address' });
            return;
        }

        // Validate password for registration
        if (!isLogin && !passwordValid) {
            setFieldErrors({ password: 'Password does not meet requirements' });
            return;
        }

        if (!password) {
            setFieldErrors({ password: 'Password is required' });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            onSuccess();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setLocalError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void-950 relative overflow-hidden px-6">
            {/* Background fx */}
            <div className="absolute inset-0 bg-neural-mesh opacity-50" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-violet/6 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyber-cyan/4 rounded-full blur-[120px]" />

            {/* Card */}
            <div className="relative w-full max-w-md z-10">
                <div className="absolute -inset-px bg-linear-to-b from-white/8 to-transparent rounded-2xl" />
                <div className="relative bg-void-900/80 backdrop-blur-2xl rounded-2xl border border-white/6 p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                            <Hexagon className="absolute w-16 h-16 text-electric-violet/30" strokeWidth={1} />
                            <Hexagon className="w-8 h-8 text-electric-violet relative z-10" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-sm text-starlight-400 mt-1">
                            {isLogin ? 'Sign in to your account' : 'Join HIVE-R today'}
                        </p>
                    </div>

                    {/* Error message */}
                    {localError && (
                        <div className="bg-reactor-red/10 border border-reactor-red/20 text-reactor-red text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in duration-200">
                            {localError}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-starlight-500" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setFieldErrors({});
                                    }}
                                    required
                                    className={`w-full h-12 pl-11 pr-4 bg-void-800/60 border rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none transition-all ${fieldErrors.email || (!isEmailValid && email)
                                        ? 'border-reactor-red/50 focus:border-reactor-red focus:ring-1 focus:ring-reactor-red/30'
                                        : 'border-white/10 focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30'
                                        }`}
                                />
                            </div>
                            {(fieldErrors.email || (!isEmailValid && email)) && (
                                <p className="mt-1.5 text-xs text-reactor-red animate-in fade-in duration-200">
                                    {fieldErrors.email || 'Please enter a valid email address'}
                                </p>
                            )}
                        </div>

                        {/* Password field */}
                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-starlight-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors({});
                                    }}
                                    required
                                    className={`w-full h-12 pl-11 pr-12 bg-void-800/60 border rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none transition-all ${fieldErrors.password
                                        ? 'border-reactor-red/50 focus:border-reactor-red focus:ring-1 focus:ring-reactor-red/30'
                                        : 'border-white/10 focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-starlight-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-1.5 text-xs text-reactor-red animate-in fade-in duration-200">
                                    {fieldErrors.password}
                                </p>
                            )}

                            {/* Password strength indicator for registration */}
                            {!isLogin && <PasswordStrength password={password} />}
                        </div>

                        {/* Forgot password link (login mode only) */}
                        {isLogin && (
                            <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-starlight-400 hover:text-electric-violet transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-linear-to-r from-[#6366F1] to-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Please wait...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-5 w-5" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Divider + Social */}
                    <div className="mt-6 pt-6 border-t border-white/6 space-y-3">
                        <button
                            className="w-full h-11 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            className="w-full text-sm text-starlight-400 hover:text-electric-violet py-2 transition-colors"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setLocalError('');
                                setFieldErrors({});
                            }}
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>

                    {/* Demo shortcut */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={onSuccess}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-honey/80 hover:text-honey bg-honey/6 hover:bg-honey/10 border border-honey/10 rounded-lg transition-all"
                        >
                            <Sparkles className="h-4 w-4" />
                            Try Demo Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
