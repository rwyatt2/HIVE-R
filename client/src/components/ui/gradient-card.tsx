import { cn } from "@/lib/utils";
import { useMousePosition } from "@/hooks/use-mouse-position";
import type { ReactNode, CSSProperties, HTMLAttributes } from "react";
import React from "react";

interface GradientCardProps extends HTMLAttributes<HTMLDivElement> {
    enableGlow?: boolean;
    children?: ReactNode;
}

export const GradientCard = React.forwardRef<
    HTMLDivElement,
    GradientCardProps
>(({ className, enableGlow = false, children, ...props }, ref) => {
    const { x, y } = useMousePosition();

    return (
        <div
            ref={ref}
            className={cn(
                "glass group relative overflow-hidden rounded-lg",
                "hover:border-primary/30 transition-all duration-300",
                className
            )}
            style={
                enableGlow
                    ? ({
                        "--mouse-x": `${x}px`,
                        "--mouse-y": `${y}px`,
                    } as CSSProperties)
                    : undefined
            }
            {...props}
        >
            {enableGlow && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div
                        className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary/10 rounded-full blur-[100px]"
                        style={{
                            left: "var(--mouse-x)",
                            top: "var(--mouse-y)",
                        }}
                    />
                </div>
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );
});

GradientCard.displayName = "GradientCard";
