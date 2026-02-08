/**
 * Card Skeleton
 * 
 * Loading placeholder for dashboard cards.
 */

interface CardSkeletonProps {
    className?: string;
}

export function CardSkeleton({ className = '' }: CardSkeletonProps) {
    return (
        <div
            className={`bg-void-900/40 backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 animate-pulse ${className}`}
            aria-label="Loading content"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="w-24 h-4 bg-void-700 rounded" />
                <div className="w-8 h-8 bg-void-700 rounded-lg" />
            </div>
            <div className="w-32 h-8 bg-void-700 rounded mb-2" />
            <div className="w-20 h-3 bg-void-800 rounded" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-void-950 pt-24 pb-16 px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className="w-48 h-8 bg-void-800 rounded animate-pulse" />
                    <div className="w-64 h-4 bg-void-900 rounded animate-pulse" />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>

                {/* Two column row */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <CardSkeleton className="h-48" />
                    <CardSkeleton className="h-48" />
                </div>

                {/* Table skeleton */}
                <div className="bg-void-900/40 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
                    <div className="p-6 border-b border-white/[0.06]">
                        <div className="w-32 h-5 bg-void-700 rounded" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-void-700 rounded-full" />
                                <div className="flex-1 h-4 bg-void-800 rounded" />
                                <div className="w-16 h-4 bg-void-800 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CardSkeleton;
