import { cn } from "@/lib/utils";
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
        active: "bg-success border-success",
        idle: "bg-foreground-muted border-foreground-muted",
        error: "bg-error border-error",
    };

    return (
        <div className={cn("relative group", className)}>
            {/* Hexagon container */}
            <div
                className={cn(
                    "relative clip-path-hexagon",
                    sizeClasses[size],
                    "bg-gradient-to-br from-primary/20 to-gradient-purple/20",
                    "backdrop-blur-sm",
                    "border-2 border-primary/30",
                    "group-hover:border-primary/60",
                    "group-hover:shadow-glow",
                    "transition-all duration-300"
                )}
            >
                {/* Icon */}
                <div className="flex items-center justify-center h-full">
                    <Icon className={cn(iconSizeClasses[size], "text-primary")} />
                </div>
            </div>

            {/* Status indicator */}
            {status === "active" && (
                <div
                    className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                        statusColors[status],
                        "animate-pulse"
                    )}
                />
            )}

            {/* Name label (shown on hover) */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-muted-foreground">{name}</span>
            </div>
        </div>
    );
}
