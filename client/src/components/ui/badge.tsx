import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-hive-indigo text-white",
                secondary:
                    "border-transparent bg-hive-surface-elevated text-hive-text-secondary",
                destructive:
                    "border-transparent bg-hive-error text-white",
                outline:
                    "border-hive-border text-hive-text-secondary",
                success:
                    "border-transparent bg-hive-success-muted text-hive-success",
                warning:
                    "border-transparent bg-hive-warning-muted text-hive-warning",
                error:
                    "border-transparent bg-hive-error-muted text-hive-error",
                active:
                    "border-transparent bg-hive-cyan-muted text-hive-cyan animate-pulse-glow",
                honey:
                    "border-transparent bg-hive-honey-muted text-hive-honey",
                agent:
                    "border-transparent bg-hive-indigo-muted text-hive-indigo-light",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
