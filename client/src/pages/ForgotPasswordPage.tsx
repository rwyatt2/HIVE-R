/**
 * Forgot Password Page
 * 
 * Email input form to request password reset.
 * Shows success state after submission.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Mail, CheckCircle, Hexagon } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const { forgotPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            await forgotPassword(email);
            setIsSuccess(true);
        } catch {
            // Always show success to prevent email enumeration
            setIsSuccess(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void-950 relative overflow-hidden px-6 pt-20">
            {/* Background fx */}
            <div className="absolute inset-0 bg-neural-mesh opacity-50" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-violet/6 rounded-full blur-[150px]" />

            {/* Card */}
            <div className="relative w-full max-w-md z-10">
                <div className="absolute -inset-px bg-linear-to-b from-white/8 to-transparent rounded-2xl" />
                <div className="relative bg-void-900/80 backdrop-blur-2xl rounded-2xl border border-white/6 p-8 shadow-2xl">

                    {isSuccess ? (
                        /* Success State */
                        <div className="text-center animate-in fade-in duration-300">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                            <p className="text-sm text-starlight-400 mb-6">
                                If an account exists for <span className="text-white">{email}</span>,
                                you'll receive a password reset link shortly.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm text-electric-violet hover:text-electric-indigo transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                                    <Hexagon className="absolute w-16 h-16 text-electric-violet/30" strokeWidth={1} />
                                    <Mail className="w-6 h-6 text-electric-violet relative z-10" />
                                </div>
                                <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                                <p className="text-sm text-starlight-400 mt-1">
                                    Enter your email and we'll send you a reset link
                                </p>
                            </div>

                            {error && (
                                <div className="bg-reactor-red/10 border border-reactor-red/20 text-reactor-red text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in duration-200">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-starlight-500" />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        required
                                        className="w-full h-12 pl-11 pr-4 bg-void-800/60 border border-white/10 rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-linear-to-r from-[#6366F1] to-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send Reset Link'
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
