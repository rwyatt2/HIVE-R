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
            "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
            variant === "glass" && "bg-background/60 backdrop-blur-lg border-border/50",
            variant === "glassmorphic" && "bg-background/60 backdrop-blur-lg border-border/50",
            variant === "agent" && "hover:border-primary/20",
            variant === "metric" && "bg-card relative overflow-hidden",
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
            "text-lg font-semibold leading-none tracking-tight",
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
        className={cn("text-sm text-muted-foreground", className)}
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && (
                    <div className="text-muted-foreground h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity">
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {value}
                </div>
                {trend && (
                    <p
                        className={cn(
                            "text-xs flex items-center gap-1 mt-1 font-medium",
                            trendUp ? "text-emerald-500" : "text-rose-500"
                        )}
                    >
                        {trendUp ? "↑" : "↓"} {trend}
                    </p>
                )}
            </CardContent>
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
