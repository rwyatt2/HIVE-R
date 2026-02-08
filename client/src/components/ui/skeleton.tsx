import * as React from "react"
import { cn } from "../../lib/utils"

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-md bg-hive-surface skeleton-shimmer",
                className
            )}
            {...props}
        />
    )
}

/* ─── SkeletonText ────────────────────────────────────────────────────────── */

function SkeletonText({
    lines = 3,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                />
            ))}
        </div>
    )
}

/* ─── SkeletonCard ────────────────────────────────────────────────────────── */

function SkeletonCard({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "glass-card rounded-xl p-6 space-y-4",
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <SkeletonText lines={2} />
        </div>
    )
}

export { Skeleton, SkeletonText, SkeletonCard }
