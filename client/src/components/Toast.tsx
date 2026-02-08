/**
 * Toast Notification System
 * 
 * Context-based toast notifications with error translation.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { translateError, type ErrorMessage } from '../lib/errorMessages';
import type { ApiError } from '../types/errors';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Toast {
    id: string;
    type: 'error' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
    icon?: string;
    actions?: ErrorMessage['actions'];
    duration?: number;
}

interface ToastContextValue {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    showError: (error: ApiError | string) => void;
    showSuccess: (message: string, title?: string) => void;
    dismissToast: (id: string) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
    showToast: () => { },
    showError: () => { },
    showSuccess: () => { },
    dismissToast: () => { },
});

export const useToast = () => useContext(ToastContext);

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString();
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss
        if (toast.duration !== 0) {
            setTimeout(() => dismissToast(id), toast.duration ?? 5000);
        }
    }, [dismissToast]);

    const showError = useCallback((error: ApiError | string) => {
        const apiError: ApiError = typeof error === 'string'
            ? { error, code: 'INTERNAL_ERROR' as ApiError['code'] }
            : error;

        const translated = translateError(apiError);
        showToast({
            type: 'error',
            title: translated.title,
            message: translated.message,
            icon: translated.icon,
            actions: translated.actions,
            duration: 6000,
        });
    }, [showToast]);

    const showSuccess = useCallback((message: string, title = 'Success') => {
        showToast({
            type: 'success',
            title,
            message,
            icon: '✅',
            duration: 3000,
        });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess, dismissToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}

// ─── Toast Container ────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-[400px]">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

// ─── Toast Item ─────────────────────────────────────────────────────────────

const typeStyles = {
    error: 'border-l-red-500 bg-red-500/10',
    success: 'border-l-plasma-green bg-plasma-green/10',
    warning: 'border-l-amber-500 bg-amber-500/10',
    info: 'border-l-electric-violet bg-electric-violet/10',
};

const typeIcons = {
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    success: <CheckCircle2 className="w-5 h-5 text-plasma-green" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-electric-violet" />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    return (
        <div
            className={`
                flex gap-3 p-4 rounded-xl border-l-4 backdrop-blur-xl shadow-2xl
                bg-void-900/90 border border-white/10
                animate-in slide-in-from-right-full fade-in duration-300
                ${typeStyles[toast.type]}
            `}
        >
            {/* Icon */}
            <div className="shrink-0">
                {toast.icon ? (
                    <span className="text-xl">{toast.icon}</span>
                ) : (
                    typeIcons[toast.type]
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm">{toast.title}</h4>
                <p className="text-sm text-starlight-300 mt-0.5">{toast.message}</p>

                {/* Actions */}
                {toast.actions && toast.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                        {toast.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (action.href) {
                                        window.location.href = action.href;
                                    } else if (action.onClick) {
                                        action.onClick();
                                    }
                                    onDismiss(toast.id);
                                }}
                                className="px-3 py-1 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Close */}
            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-starlight-400 hover:text-white transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default ToastProvider;
