/**
 * Reset Password Page
 * 
 * Form to set new password using reset token from URL.
 * Includes password strength indicator.
 */

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PasswordStrength, usePasswordStrength } from '../components/PasswordStrength';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Hexagon, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const { isValid: passwordValid } = usePasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!passwordValid) {
            setError('Password does not meet requirements');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reset password');
            }

            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setIsSubmitting(false);
        }
    };

    // No token - show error state
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-void-950 relative overflow-hidden px-6 pt-20">
                <div className="absolute inset-0 bg-neural-mesh opacity-50" />

                <div className="relative w-full max-w-md z-10">
                    <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl" />
                    <div className="relative bg-void-900/80 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-reactor-red/10 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-reactor-red" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
                        <p className="text-sm text-starlight-400 mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-electric-violet hover:bg-electric-indigo text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-void-950 relative overflow-hidden px-6 pt-20">
            {/* Background fx */}
            <div className="absolute inset-0 bg-neural-mesh opacity-50" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-violet/[0.06] rounded-full blur-[150px]" />

            {/* Card */}
            <div className="relative w-full max-w-md z-10">
                <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl" />
                <div className="relative bg-void-900/80 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 shadow-2xl">

                    {isSuccess ? (
                        /* Success State */
                        <div className="text-center animate-in fade-in duration-300">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
                            <p className="text-sm text-starlight-400 mb-6">
                                Your password has been updated successfully. Redirecting to login...
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm text-electric-violet hover:text-electric-indigo transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Go to login now
                            </Link>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                                    <Hexagon className="absolute w-16 h-16 text-electric-violet/30" strokeWidth={1} />
                                    <Lock className="w-6 h-6 text-electric-violet relative z-10" />
                                </div>
                                <h1 className="text-2xl font-bold text-white">Set New Password</h1>
                                <p className="text-sm text-starlight-400 mt-1">
                                    Choose a strong password for your account
                                </p>
                            </div>

                            {error && (
                                <div className="bg-reactor-red/10 border border-reactor-red/20 text-reactor-red text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in duration-200">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* New Password */}
                                <div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-starlight-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="New password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full h-12 pl-10 pr-12 bg-void-800/60 border border-white/10 rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-starlight-500 hover:text-starlight-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                </div>

                                {/* Confirm Password */}
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-starlight-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`w-full h-12 pl-10 pr-4 bg-void-800/60 border rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none transition-all ${confirmPassword && password !== confirmPassword
                                            ? 'border-reactor-red/50 focus:border-reactor-red focus:ring-1 focus:ring-reactor-red/30'
                                            : 'border-white/10 focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30'
                                            }`}
                                    />
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-reactor-red animate-in fade-in duration-200">
                                        Passwords do not match
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !passwordValid || password !== confirmPassword}
                                    className="w-full h-12 bg-electric-violet hover:bg-electric-indigo disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-neon-violet transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Updating...
                                        </span>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm text-starlight-400 hover:text-electric-violet transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
