/**
 * Auth Context Provider
 * 
 * Provides authentication state and methods to the app.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface User {
    id: string;
    email: string;
    role?: 'user' | 'system_owner';
    createdAt: string;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    getAccessToken: () => string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'hive-access-token';
const REFRESH_TOKEN_KEY = 'hive-refresh-token';
const USER_KEY = 'hive-user';
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (tokens expire at 15min)

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Store tokens in localStorage
     */
    const storeTokens = useCallback((tokens: AuthTokens, userData: User) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
    }, []);

    /**
     * Clear stored auth data
     */
    const clearTokens = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    /**
     * Get access token from storage
     */
    const getAccessToken = useCallback((): string | null => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }, []);

    /**
     * Try to refresh tokens
     */
    const tryRefresh = useCallback(async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                clearTokens();
                return false;
            }

            const tokens = await response.json() as AuthTokens;
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedUser) {
                localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
                localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
                return true;
            }

            return false;
        } catch {
            clearTokens();
            return false;
        }
    }, [clearTokens]);

    /**
     * Verify current token on mount
     */
    useEffect(() => {
        const verifyToken = async () => {
            const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (!accessToken || !storedUser) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else if (response.status === 401) {
                    // Try to refresh
                    const refreshed = await tryRefresh();
                    if (refreshed) {
                        setUser(JSON.parse(storedUser));
                    }
                }
            } catch {
                // Network error - use cached user if available
                setUser(JSON.parse(storedUser));
            }

            setIsLoading(false);
        };

        verifyToken();
    }, [tryRefresh]);

    /**
     * Auto-refresh tokens every 14 minutes while authenticated
     */
    useEffect(() => {
        if (!user) return;

        const intervalId = setInterval(async () => {
            const refreshed = await tryRefresh();
            if (!refreshed) {
                // Token refresh failed - user session expired
                clearTokens();
            }
        }, TOKEN_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [user, tryRefresh, clearTokens]);

    /**
     * Login with email and password
     */
    const login = useCallback(async (email: string, password: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        storeTokens(data, data.user);
    }, [storeTokens]);

    /**
     * Register new user
     */
    const register = useCallback(async (email: string, password: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await response.json();
        storeTokens(data, data.user);
    }, [storeTokens]);

    /**
     * Logout
     */
    const logout = useCallback(async (): Promise<void> => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (refreshToken) {
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });
            } catch {
                // Ignore logout errors
            }
        }

        clearTokens();
    }, [clearTokens]);

    /**
     * Request password reset email
     */
    const forgotPassword = useCallback(async (email: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send reset email');
        }
    }, []);

    const value: AuthContextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        getAccessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
