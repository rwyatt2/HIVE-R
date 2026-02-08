import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "glass" | "glass-elevated" | "agent" }
>(({ className, variant = "glass", ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
            variant === "glass" && "glass hover:border-white/20",
            variant === "glass-elevated" && "glass-elevated hover:shadow-glow-sm",
            variant === "agent" && "glass border-primary/20 hover:border-primary/50 hover:shadow-glow-sm",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

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

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

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

// Metric Card Component
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    value: string
    icon?: React.ReactNode
    trend?: string
    trendUp?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
    ({ className, title, value, icon, trend, trendUp, ...props }, ref) => (
        <Card ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && <div className="text-primary h-4 w-4">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className={cn("text-xs flex items-center mt-1", trendUp ? "text-success" : "text-error")}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </p>
                )}
            </CardContent>
            {/* Background decoration */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        </Card>
    )
)
MetricCard.displayName = "MetricCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, MetricCard }
