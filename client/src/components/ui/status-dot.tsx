import * as React from "react"
import { cn } from "../../lib/utils"

/* ─── StatusDot ───────────────────────────────────────────────────────────── */

interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
    status?: "success" | "warning" | "error" | "active" | "idle"
    size?: "sm" | "md" | "lg"
    pulse?: boolean
}

function StatusDot({
    status = "idle",
    size = "md",
    pulse,
    className,
    ...props
}: StatusDotProps) {
    const shouldPulse = pulse ?? status === "active"

    const sizeClass = {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-3 h-3",
    }[size]

    const colorClass = {
        success: "bg-hive-success",
        warning: "bg-hive-warning",
        error: "bg-hive-error",
        active: "bg-hive-cyan",
        idle: "bg-hive-text-tertiary",
    }[status]

    const glowClass = {
        success: "shadow-[0_0_6px_rgba(16,185,129,0.5)]",
        warning: "shadow-[0_0_6px_rgba(249,115,22,0.5)]",
        error: "shadow-[0_0_6px_rgba(239,68,68,0.5)]",
        active: "shadow-[0_0_6px_rgba(6,182,212,0.5)]",
        idle: "",
    }[status]

    return (
        <span
            className={cn(
                "inline-block rounded-full",
                sizeClass,
                colorClass,
                glowClass,
                shouldPulse && "animate-pulse-glow",
                className
            )}
            aria-label={`Status: ${status}`}
            role="status"
            {...props}
        />
    )
}

export { StatusDot }
export type { StatusDotProps }
