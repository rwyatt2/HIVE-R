/**
 * ProtectedRoute Component
 * 
 * Wrapper for routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hexagon } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-void-950 flex flex-col items-center justify-center gap-4 z-50">
                <div className="relative">
                    <div className="absolute -inset-4 bg-electric-violet/10 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-void-900 border border-white/10 flex items-center justify-center">
                        <Hexagon className="w-8 h-8 text-electric-violet animate-pulse" strokeWidth={1.5} />
                    </div>
                </div>
                <p className="text-sm text-starlight-400 font-mono tracking-wide">Authenticating...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, but save the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

