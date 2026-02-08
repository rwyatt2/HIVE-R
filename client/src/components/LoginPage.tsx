/**
 * Login Page — Glassmorphic Authentication
 * 
 * Gorgeous login/register form with the Bionic Minimalism design.
 * Pure Tailwind — no external component dependencies.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Sparkles, Hexagon } from 'lucide-react';

interface LoginPageProps {
    onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, isLoading } = useAuth();
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            onSuccess();
        } catch {
            setLocalError('Authentication failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void-950 relative overflow-hidden px-6">
            {/* Background fx */}
            <div className="absolute inset-0 bg-neural-mesh opacity-50" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-violet/[0.06] rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyber-cyan/[0.04] rounded-full blur-[120px]" />

            {/* Card */}
            <div className="relative w-full max-w-md z-10">
                <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl" />
                <div className="relative bg-void-900/80 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                            <Hexagon className="absolute w-16 h-16 text-electric-violet/30" strokeWidth={1} />
                            <span className="text-3xl relative z-10">🐝</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            HIVE<span className="text-electric-violet">-R</span>
                        </h1>
                        <p className="text-sm text-starlight-400 mt-1">Your Portable AI Software Team</p>
                    </div>

                    {/* Error message */}
                    {localError && (
                        <div className="bg-reactor-red/10 border border-reactor-red/20 text-reactor-red text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in duration-200">
                            {localError}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-11 px-4 bg-void-800/60 border border-white/[0.08] rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 transition-all"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-11 px-4 bg-void-800/60 border border-white/[0.08] rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-electric-violet hover:bg-electric-indigo disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-neon-violet hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Please wait...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Divider + Social */}
                    <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-3">
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
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>

                    {/* Demo shortcut */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={onSuccess}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-honey/80 hover:text-honey bg-honey/[0.06] hover:bg-honey/[0.1] border border-honey/10 rounded-lg transition-all"
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
