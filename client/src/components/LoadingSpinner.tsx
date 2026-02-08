/**
 * Loading Spinner
 * 
 * Glassmorphic loading spinner for Suspense fallbacks.
 */

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

export function LoadingSpinner({ fullScreen = false, size = 'md', label }: LoadingSpinnerProps) {
    const sizeMap = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeMap[size]} rounded-full border-electric-violet/30 border-t-electric-violet animate-spin`}
                role="status"
                aria-label={label || 'Loading'}
            />
            {label && <span className="text-sm text-starlight-400">{label}</span>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-void-950 z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}

export default LoadingSpinner;
