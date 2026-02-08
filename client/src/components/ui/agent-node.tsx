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
        active: "bg-electric-violet shadow-neon-violet animate-pulse",
        idle: "bg-starlight-700",
        error: "bg-reactor-red shadow-neon-red", // Assuming neon-red exists or fallback
    };

    return (
        <div className={cn("relative group flex flex-col items-center", className)}>
            {/* Main Node Circle */}
            <div
                className={cn(
                    "relative flex items-center justify-center rounded-full transition-all duration-300",
                    "bg-void-900 border-2 border-white/10",
                    sizeClasses[size],
                    // Hover Effects
                    "group-hover:border-electric-violet/50 group-hover:shadow-neon-violet group-hover:scale-105",
                    // Active State
                    status === "active" && "border-electric-violet shadow-neon-violet ring-2 ring-electric-violet/20 ring-offset-2 ring-offset-void-950"
                )}
            >
                {/* Icon */}
                <Icon
                    className={cn(
                        "transition-colors duration-300",
                        iconSizeClasses[size],
                        status === "active" ? "text-electric-violet" : "text-starlight-400 group-hover:text-starlight-50"
                    )}
                />

                {/* Status Indicator (Orbiting/Attached) */}
                <div
                    className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-void-950 z-10",
                        statusColors[status] || "bg-starlight-700"
                    )}
                />

                {/* Shockwave Effect (Active Only) */}
                {status === "active" && (
                    <div className="absolute inset-0 rounded-full border border-electric-violet animate-shockwave opacity-0 pointer-events-none" />
                )}
            </div>

            {/* Label (Always visible now, but subtle) */}
            <div className="absolute -bottom-8 px-2 py-1 rounded bg-black/50 backdrop-blur text-xs font-medium text-starlight-400 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                {name}
            </div>
        </div>
    );
}
