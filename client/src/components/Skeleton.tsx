import './Skeleton.css';

interface SkeletonProps {
    variant?: 'text' | 'title' | 'avatar' | 'card' | 'button' | 'circle';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export function Skeleton({
    variant = 'text',
    width,
    height,
    className = '',
}: SkeletonProps) {
    return (
        <div
            className={`skeleton skeleton--${variant} ${className}`}
            style={{ width, height }}
            aria-label="Loading..."
            aria-busy="true"
        />
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="skeleton-text">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    width={i === lines - 1 ? '70%' : '100%'}
                />
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <Skeleton variant="title" />
            <SkeletonText lines={3} />
            <div className="skeleton-card__footer">
                <Skeleton variant="button" />
            </div>
        </div>
    );
}
