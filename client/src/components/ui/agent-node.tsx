import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface AgentNodeProps {
    icon: LucideIcon;
    name: string;
    status?: "active" | "idle" | "error";
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function AgentNode({
    icon: Icon,
    name,
    status = "idle",
    className,
    size = "md",
}: AgentNodeProps) {
    const sizeClasses = {
        sm: "w-12 h-12",
        md: "w-16 h-16",
        lg: "w-20 h-20",
    };

    const iconSizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
    };

    const statusColors = {
        active: "bg-emerald-500 shadow-sm animate-pulse",
        idle: "bg-muted-foreground",
        error: "bg-destructive shadow-sm", 
    };

    return (
        <div className={cn("relative group flex flex-col items-center", className)}>
            {/* Main Node Circle */}
            <div
                className={cn(
                    "relative flex items-center justify-center rounded-full transition-all duration-300",
                    "bg-card border-2 border-border shadow-sm",
                    sizeClasses[size],
                    // Hover Effects
                    "group-hover:border-primary/50 group-hover:shadow-md group-hover:scale-105",
                    // Active State
                    status === "active" && "border-primary shadow-md ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                )}
            >
                {/* Icon */}
                <Icon
                    className={cn(
                        "transition-colors duration-300",
                        iconSizeClasses[size],
                        status === "active" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                />

                {/* Status Indicator (Orbiting/Attached) */}
                <div
                    className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background z-10",
                        statusColors[status] || "bg-muted"
                    )}
                />

                {/* Shockwave Effect (Active Only) */}
                {status === "active" && (
                    <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20 pointer-events-none" />
                )}
            </div>

            {/* Label (Always visible) */}
            <div className="mt-2 px-2 py-0.5 rounded-md bg-card/80 backdrop-blur-sm text-[11px] font-medium text-foreground whitespace-nowrap border border-border shadow-sm">
                {name}
            </div>
        </div>
    );
}
