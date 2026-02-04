/**
 * App Router
 * 
 * Main routing component for the unified HIVE-R frontend.
 * Handles navigation between landing, studio, dashboard, and settings.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage, DashboardPage, SettingsPage } from './pages';
import { LoginPage } from './components/LoginPage';
import { Docs } from './components/Docs';
import StudioApp from './App';
import './index.css';

// Layout wrapper that shows NavBar on most pages
function Layout({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
    return (
        <>
            {!hideNav && <NavBar />}
            {children}
        </>
    );
}

// Docs page wrapper (converts modal to page)
function DocsPage() {
    return (
        <Layout>
            <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#0a0a0a' }}>
                <Docs onClose={() => window.history.back()} />
            </div>
        </Layout>
    );
}

// Demo mode wrapper — Studio without auth
function DemoPage() {
    return (
        <Layout hideNav>
            <StudioApp demoMode />
        </Layout>
    );
}

// Main router
function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner">🐝</div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={
                isAuthenticated ? (
                    <Layout hideNav>
                        <StudioApp />
                    </Layout>
                ) : (
                    <Layout>
                        <LandingPage />
                    </Layout>
                )
            } />
            <Route path="/login" element={
                <Layout>
                    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#0a0a0a' }}>
                        <LoginPage />
                    </div>
                </Layout>
            } />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/docs" element={<DocsPage />} />

            {/* Protected routes */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <Layout hideNav>
                        <StudioApp />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout>
                        <DashboardPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute>
                    <Layout>
                        <SettingsPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/plugins" element={
                <ProtectedRoute>
                    <Layout hideNav>
                        <StudioApp showMarketplaceOnLoad />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={
                <Layout>
                    <div style={{
                        paddingTop: '100px',
                        textAlign: 'center',
                        minHeight: '100vh',
                        background: '#0a0a0a'
                    }}>
                        <h1 style={{ fontSize: '4rem', marginBottom: '16px' }}>404</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Page not found</p>
                    </div>
                </Layout>
            } />
        </Routes>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default AppRouter;
