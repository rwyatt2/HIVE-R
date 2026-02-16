/**
 * Login Page — Enterprise Minimal Authentication
 * 
 * Clean, professional login with subtle gradient accents.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PasswordStrength, usePasswordStrength } from './PasswordStrength';
import { ArrowRight, Sparkles, Hexagon, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-6">
            {/* Subtle Gradient Mesh Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

            {/* Card */}
            <Card className="relative w-full max-w-md z-10 border-border shadow-2xl">
                <CardContent className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary/5 border border-primary/10">
                            <Hexagon className="w-6 h-6 text-primary" strokeWidth={2} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isLogin ? 'Sign in to your account' : 'Join HIVE-R today'}
                        </p>
                    </div>

                    {/* Error message */}
                    {localError && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in duration-200">
                            {localError}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div className="space-y-1">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setFieldErrors({});
                                    }}
                                    required
                                    className={`pl-9 ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                            </div>
                            {(fieldErrors.email || (!isEmailValid && email)) && (
                                <p className="text-xs text-destructive animate-in fade-in">
                                    {fieldErrors.email || 'Please enter a valid email address'}
                                </p>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="space-y-1">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors({});
                                    }}
                                    required
                                    className={`pl-9 pr-10 ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-destructive animate-in fade-in">
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
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-10 font-semibold"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    Please wait...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Divider + Social */}
                    <div className="mt-6 pt-6 border-t border-border space-y-3">
                        <Button variant="outline" className="w-full" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`}>
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </Button>

                        <button
                            className="w-full text-sm text-muted-foreground hover:text-primary py-2 transition-colors"
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
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-full transition-all"
                        >
                            <Sparkles className="h-3 w-3" />
                            Try Demo Mode
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
