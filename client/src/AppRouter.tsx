/**
 * App Router
 * 
 * Main routing component with code splitting and lazy loading.
 * Heavy pages are loaded on demand to reduce initial bundle size.
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './components/LoginPage';
import { KeyboardManager } from './components/KeyboardManager';
import './index.css';

// ─── Lazy Loaded Pages ──────────────────────────────────────────────────────
// These pages are split into separate chunks and loaded on demand
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage').then(m => ({ default: m.OrganizationPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const Docs = lazy(() => import('./components/Docs').then(m => ({ default: m.Docs })));

// StudioApp contains ReactFlow - the heaviest dependency
const StudioApp = lazy(() => import('./App'));

// ─── Suspense Wrapper ───────────────────────────────────────────────────────
function PageSuspense({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen label="Loading..." />}>
            {children}
        </Suspense>
    );
}

// Layout wrapper that shows NavBar on most pages
function Layout({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            {!hideNav && <NavBar />}
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        </>
    );
}

// Docs page wrapper (converts modal to page)
function DocsPage() {
    return (
        <Layout>
            <div className="pt-20 min-h-screen bg-hive-bg-dark">
                <PageSuspense>
                    <Docs onClose={() => window.history.back()} />
                </PageSuspense>
            </div>
        </Layout>
    );
}

// Demo mode wrapper — Studio without auth
function DemoPage() {
    return (
        <Layout hideNav>
            <PageSuspense>
                <StudioApp demoMode />
            </PageSuspense>
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
        return <LoadingSpinner fullScreen label="Initializing..." />;
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={
                isAuthenticated ? (
                    <Layout hideNav>
                        <PageSuspense>
                            <StudioApp />
                        </PageSuspense>
                    </Layout>
                ) : (
                    <Layout>
                        <PageSuspense>
                            <LandingPage />
                        </PageSuspense>
                    </Layout>
                )
            } />
            <Route path="/login" element={
                <Layout>
                    <div className="pt-20 min-h-screen bg-hive-bg-dark">
                        <LoginPageWrapper />
                    </div>
                </Layout>
            } />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/forgot-password" element={
                <Layout>
                    <PageSuspense>
                        <ForgotPasswordPage />
                    </PageSuspense>
                </Layout>
            } />
            <Route path="/reset-password" element={
                <Layout>
                    <PageSuspense>
                        <ResetPasswordPage />
                    </PageSuspense>
                </Layout>
            } />

            {/* Protected routes */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <Layout hideNav>
                        <PageSuspense>
                            <StudioApp />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout>
                        <PageSuspense>
                            <DashboardPage />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/history" element={
                <ProtectedRoute>
                    <Layout>
                        <PageSuspense>
                            <HistoryPage />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute>
                    <Layout>
                        <PageSuspense>
                            <SettingsPage />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/plugins" element={
                <ProtectedRoute>
                    <Layout hideNav>
                        <PageSuspense>
                            <StudioApp showMarketplaceOnLoad />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/billing" element={
                <ProtectedRoute>
                    <Layout>
                        <PageSuspense>
                            <BillingPage />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/organization" element={
                <ProtectedRoute>
                    <Layout>
                        <PageSuspense>
                            <OrganizationPage />
                        </PageSuspense>
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={
                <Layout>
                    <div className="pt-28 text-center min-h-screen bg-hive-bg-dark">
                        <h1 className="text-7xl font-bold text-hive-text-primary/20 mb-4 font-mono">404</h1>
                        <p className="text-hive-text-secondary">Page not found</p>
                        <Link to="/" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-hive-indigo hover:bg-hive-indigo-dark text-white rounded-lg transition-colors text-sm font-medium">
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
            <KeyboardManager>
                <AppRoutes />
            </KeyboardManager>
        </BrowserRouter>
    );
}

export default AppRouter;
