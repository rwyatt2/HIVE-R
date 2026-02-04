/**
 * ProtectedRoute Component
 * 
 * Wrapper for routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner">
                    <span className="loading-emoji">🐝</span>
                </div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, but save the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
