import * as React from "react"
import { cn } from "../../lib/utils"

/* ─── Linear Progress ─────────────────────────────────────────────────────── */

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number
    max?: number
    variant?: "default" | "honey" | "cyan" | "success"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, variant = "default", ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100))

        const fillColor = {
            default: "bg-indigo-gradient",
            honey: "bg-honey-gradient",
            cyan: "bg-cyan-gradient",
            success: "bg-hive-success",
        }[variant]

        return (
            <div
                ref={ref}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                className={cn(
                    "h-2 w-full overflow-hidden rounded-full bg-hive-border",
                    className
                )}
                {...props}
            >
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        fillColor
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        )
    }
)
Progress.displayName = "Progress"

export { Progress }
export type { ProgressProps }
