/**
 * App Router
 * 
 * Main routing component for the unified HIVE-R frontend.
 * Handles navigation between landing, studio, dashboard, and settings.
 */

import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
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
            <div className="pt-20 min-h-screen bg-void-950">
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

function LoginPageWrapper() {
    const navigate = useNavigate();
    return <LoginPage onSuccess={() => navigate('/app')} />;
}

// Main router
function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-void-950 flex flex-col items-center justify-center gap-4 z-50">
                <div className="relative">
                    <div className="absolute -inset-4 bg-electric-violet/10 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-void-900 border border-white/10 flex items-center justify-center shadow-neon-violet">
                        <span className="text-3xl animate-bounce">🐝</span>
                    </div>
                </div>
                <p className="text-sm text-starlight-400 font-mono tracking-wide">Initializing...</p>
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
                    <div className="pt-20 min-h-screen bg-void-950">
                        <LoginPageWrapper />
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
                    <div className="pt-28 text-center min-h-screen bg-void-950">
                        <h1 className="text-7xl font-bold text-white/20 mb-4 font-mono">404</h1>
                        <p className="text-starlight-400">Page not found</p>
                        <Link to="/" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-electric-violet hover:bg-electric-indigo text-white rounded-lg transition-colors text-sm font-medium">
                            Go Home
                        </Link>
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
