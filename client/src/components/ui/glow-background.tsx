import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

interface GlowBackgroundProps {
    children: ReactNode;
    variant?: "mesh" | "sunset" | "radial";
    className?: string;
}

export function GlowBackground({
    children,
    variant = "mesh",
    className,
}: GlowBackgroundProps) {
    return (
        <div className={cn("relative", className)}>
            {/* Background effects */}
            {variant === "mesh" && (
                <div className="absolute inset-0 -z-10 gradient-mesh" />
            )}

            {variant === "sunset" && (
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]">
                        <div className="absolute inset-0 bg-gradient-radial from-warm-orange/30 via-warm-amber/20 to-transparent blur-3xl" />
                    </div>
                </div>
            )}

            {variant === "radial" && (
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[128px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-purple/5 rounded-full blur-[128px]" />
                </div>
            )}

            {/* Content */}
            {children}
        </div>
    );
}
