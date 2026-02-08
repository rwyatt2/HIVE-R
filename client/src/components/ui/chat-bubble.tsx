import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChatBubbleProps {
    message: string | ReactNode;
    type: "user" | "agent";
    agentName?: string;
    agentAvatar?: string;
    agentModel?: string;
    timestamp?: string;
    className?: string;
}

export function ChatBubble({
    message,
    type,
    agentName,
    agentAvatar,
    agentModel,
    timestamp,
    className,
}: ChatBubbleProps) {
    if (type === "user") {
        return (
            <div className={cn("flex justify-end", className)}>
                <div
                    className={cn(
                        "max-w-[70%] rounded-2xl rounded-tr-sm",
                        "bg-primary/20 backdrop-blur-sm",
                        "border border-primary/30",
                        "px-4 py-3",
                        "text-foreground"
                    )}
                >
                    {typeof message === "string" ? <p>{message}</p> : message}
                    {timestamp && (
                        <span className="text-xs text-muted-foreground mt-1 block">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex gap-3", className)}>
            {/* Agent avatar */}
            <div className="h-8 w-8 border border-border/50 shrink-0 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                {agentAvatar ? (
                    <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-primary text-xs font-medium">
                        {agentName?.slice(0, 2).toUpperCase() || "AI"}
                    </span>
                )}
            </div>

            {/* Message bubble */}
            <div
                className={cn(
                    "max-w-[70%] rounded-2xl rounded-tl-sm",
                    "bg-background-card/60 backdrop-blur-sm",
                    "border border-border/40",
                    "px-4 py-3"
                )}
            >
                {/* Agent header */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{agentName}</span>
                    {agentModel && (
                        <span className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                            {agentModel}
                        </span>
                    )}
                </div>

                {/* Message content */}
                <div className="text-foreground">
                    {typeof message === "string" ? <p>{message}</p> : message}
                </div>

                {/* Timestamp */}
                {timestamp && (
                    <span className="text-xs text-muted-foreground mt-1 block">
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    );
}
