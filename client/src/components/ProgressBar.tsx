import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number;
    animated?: boolean;
    className?: string;
    showLabel?: boolean;
}

export function ProgressBar({
    progress,
    animated = true,
    className = '',
    showLabel = false,
}: ProgressBarProps) {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
        <div className={`progress-bar ${className}`}>
            <div className="progress-bar__track">
                <motion.div
                    className="progress-bar__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedProgress}%` }}
                    transition={{ duration: animated ? 0.5 : 0, ease: 'easeOut' }}
                />
            </div>
            {showLabel && (
                <span className="progress-bar__label">{Math.round(clampedProgress)}%</span>
            )}
        </div>
    );
}

interface CircularProgressProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function CircularProgress({
    progress,
    size = 48,
    strokeWidth = 4,
    className = '',
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className={`circular-progress ${className}`}
            style={{ transform: 'rotate(-90deg)' }}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--color-bg-tertiary)"
                strokeWidth={strokeWidth}
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--color-primary-600)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
        </svg>
    );
}

// Loading spinner
export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={`animate-spin ${className}`}
            style={{ color: 'currentColor' }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
            />
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M12 2a10 10 0 0 1 10 10"
            />
        </svg>
    );
}
