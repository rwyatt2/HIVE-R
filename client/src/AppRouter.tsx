/**
 * App Router
 * 
 * Main routing component with code splitting and lazy loading.
 * Heavy pages are loaded on demand to reduce initial bundle size.
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NavBar } from './components/NavBar';
import { LayoutShell } from './components/layout/layout-shell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './components/LoginPage';
import { KeyboardManager } from './components/KeyboardManager';
import { SmoothScroll } from './components/SmoothScroll';
import './index.css';

// ─── Lazy Loaded Pages ──────────────────────────────────────────────────────
// These pages are split into separate chunks and loaded on demand
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage').then(m => ({ default: m.OrganizationPage })));
const PluginsPage = lazy(() => import('./pages/PluginsPage').then(m => ({ default: m.PluginsPage })));
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
    const navigate = useNavigate();
    return (
        <LayoutShell
            constrainWidth={false}
            sidebarProps={{
                onNavigate: (path) => navigate(path),
                activePath: 'docs',
                hideSessions: true,
                sessions: [],
                currentSessionId: null,
                onNewSession: () => { },
                onSelectSession: () => { },
            }}
        >
            <div className="h-full w-full">
                <PageSuspense>
                    <Docs variant="page" />
                </PageSuspense>
            </div>
        </LayoutShell>
    );
}

// Demo mode wrapper — Studio without auth
function DemoPage() {
    return (
        <Layout hideNav>
            <div className="fixed top-6 left-6 z-50">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-void-950/90 backdrop-blur-xl border border-white/10 px-4 py-2 text-sm text-starlight-300 hover:text-white hover:border-white/20 hover:bg-void-950/95 transition"
                >
                    <span aria-hidden="true">←</span>
                    Back to landing
                </Link>
            </div>
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
    const navigate = useNavigate();
    const location = useLocation();
    const runId = "pre-fix";

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "L", location: 'AppRouter.tsx:render', message: 'router_render', data: { path: location.pathname, href: window.location.href, isAuthenticated, isLoading }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion

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
                    <LayoutShell
                        constrainWidth={false}
                        sidebarProps={{
                            onNavigate: (path) => navigate(path),
                            activePath: 'dashboard',
                            hideSessions: true,
                            sessions: [],
                            currentSessionId: null,
                            onNewSession: () => { },
                            onSelectSession: () => { },
                        }}
                    >
                        <PageSuspense>
                            <DashboardPage />
                        </PageSuspense>
                    </LayoutShell>
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
                    <LayoutShell
                        constrainWidth={false}
                        sidebarProps={{
                            onNavigate: (path) => navigate(path),
                            activePath: 'settings',
                            hideSessions: true,
                            sessions: [],
                            currentSessionId: null,
                            onNewSession: () => { },
                            onSelectSession: () => { },
                        }}
                    >
                        <PageSuspense>
                            <SettingsPage />
                        </PageSuspense>
                    </LayoutShell>
                </ProtectedRoute>
            } />
            <Route path="/plugins" element={
                <ProtectedRoute>
                    <LayoutShell
                        constrainWidth={false}
                        sidebarProps={{
                            onNavigate: (path) => navigate(path),
                            activePath: 'plugins',
                            hideSessions: true,
                            sessions: [],
                            currentSessionId: null,
                            onNewSession: () => { },
                            onSelectSession: () => { },
                        }}
                    >
                        <PageSuspense>
                            <PluginsPage />
                        </PageSuspense>
                    </LayoutShell>
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
            <SmoothScroll>
                <KeyboardManager>
                    <AppRoutes />
                </KeyboardManager>
            </SmoothScroll>
        </BrowserRouter>
    );
}

export default AppRouter;
