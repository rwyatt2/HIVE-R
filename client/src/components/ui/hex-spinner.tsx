/**
 * HexSpinner — Hexagonal Loading Indicator
 * ═══════════════════════════════════════════════════════════════
 *
 * 6 hexagons arranged in a ring, each agent-colored,
 * sequential fade-in/out. NOT circular — hexagonal.
 *
 * Usage:
 *   <HexSpinner />
 *   <HexSpinner size={48} />
 */

import { cn } from "../../lib/utils";

const AGENT_COLORS = [
    "#6366F1", // indigo  — Router
    "#8B5CF6", // purple  — Founder
    "#3B82F6", // blue    — Builder
    "#10B981", // green   — Tester
    "#06B6D4", // cyan    — Docs
    "#F59E0B", // honey   — SRE
];

interface HexSpinnerProps {
    size?: number;
    className?: string;
}

export function HexSpinner({ size = 40, className }: HexSpinnerProps) {
    const hexSize = size * 0.22;
    const radius = size * 0.36;

    return (
        <div
            className={cn("relative inline-flex items-center justify-center", className)}
            style={{ width: size, height: size }}
            role="status"
            aria-label="Loading"
        >
            {AGENT_COLORS.map((color, i) => {
                const angle = (i * 60 - 90) * (Math.PI / 180);
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);

                return (
                    <svg
                        key={i}
                        className="absolute"
                        style={{
                            left: `calc(50% + ${x}px - ${hexSize / 2}px)`,
                            top: `calc(50% + ${y}px - ${hexSize / 2}px)`,
                            animation: `hex-spinner-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                        width={hexSize}
                        height={hexSize}
                        viewBox="0 0 24 24"
                    >
                        <polygon
                            points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
                            fill={color}
                            opacity="0.3"
                        />
                    </svg>
                );
            })}
        </div>
    );
}
