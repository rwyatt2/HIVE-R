import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './AppRouter.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ToastProvider } from './components/Toast.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

const runId = "pre-fix"
const logVersion = "main_v2_bootstrap"
const pageId = Math.random().toString(36).slice(2)
// @ts-ignore
window.__hivePageId = pageId
// #region agent log
fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "J", location: 'main.tsx:init', message: 'main_bootstrap', data: { pageId, logVersion, path: window.location.pathname, href: window.location.href, visibility: document.visibilityState }, timestamp: Date.now() }) }).catch(() => { });
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
