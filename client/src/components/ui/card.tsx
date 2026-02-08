import * as React from "react"
import { cn } from "../../lib/utils"

/* ─── Card ────────────────────────────────────────────────────────────────── */

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "glass" | "glassmorphic" | "agent" | "metric"
    }
>(({ className, variant = "default", ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-2xl text-white transition-all duration-300",
            variant === "default" && "bg-void-900/40 backdrop-blur-xl border border-white/6 shadow-2xl",
            variant === "glass" && "bg-void-900/40 backdrop-blur-xl border border-white/6 shadow-2xl",
            variant === "glassmorphic" && "bg-void-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl",
            variant === "agent" &&
            "bg-void-900/40 backdrop-blur-xl border border-white/6 hover:border-white/12",
            variant === "metric" && "bg-void-900/40 backdrop-blur-xl border border-white/6 relative overflow-hidden",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

/* ─── CardHeader ──────────────────────────────────────────────────────────── */

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

/* ─── CardTitle ───────────────────────────────────────────────────────────── */

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight text-hive-text-primary",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

/* ─── CardDescription ─────────────────────────────────────────────────────── */

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-hive-text-secondary", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

/* ─── CardContent ─────────────────────────────────────────────────────────── */

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/* ─── CardFooter ──────────────────────────────────────────────────────────── */

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

/* ─── MetricCard ──────────────────────────────────────────────────────────── */

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    value: string
    icon?: React.ReactNode
    trend?: string
    trendUp?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
    ({ className, title, value, icon, trend, trendUp, ...props }, ref) => (
        <Card
            ref={ref}
            variant="metric"
            className={cn("group", className)}
            {...props}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-hive-text-secondary">
                    {title}
                </CardTitle>
                {icon && (
                    <div className="text-hive-indigo h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-h3 font-bold text-hive-text-primary">
                    {value}
                </div>
                {trend && (
                    <p
                        className={cn(
                            "text-xs flex items-center gap-1 mt-1 font-medium",
                            trendUp ? "text-hive-success" : "text-hive-error"
                        )}
                    >
                        {trendUp ? "↑" : "↓"} {trend}
                    </p>
                )}
            </CardContent>
            {/* Decorative glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-hive-indigo/5 rounded-full blur-2xl group-hover:bg-hive-indigo/10 transition-colors" />
        </Card>
    )
)
MetricCard.displayName = "MetricCard"

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
    MetricCard,
}
