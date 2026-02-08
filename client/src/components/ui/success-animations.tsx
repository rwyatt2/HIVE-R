/**
 * Success Animations
 * ═══════════════════════════════════════════════════════════════
 *
 * CheckmarkDraw — SVG path animation (honey gold)
 * HoneyWave     — Expanding ripple circle (deployment success)
 * CelebrationBurst — Radial glow burst (project deploy)
 */

import { motion, useReducedMotion } from "framer-motion";
import { easing } from "../../lib/animations";
import { cn } from "../../lib/utils";

// ═══════════════════════════════════════════════════════════════
// CHECKMARK DRAW
// ═══════════════════════════════════════════════════════════════

interface CheckmarkDrawProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
    className?: string;
}

/**
 * Animated SVG checkmark using stroke-dashoffset technique.
 * Draws a honey-gold checkmark when mounted.
 */
export function CheckmarkDraw({
    size = 48,
    color = "#F59E0B",
    strokeWidth = 3,
    className,
}: CheckmarkDrawProps) {
    const prefersReduced = useReducedMotion();

    // Checkmark path — tuned for a clean ✓ shape
    const checkPath = "M6 13l4 4L18 7";
    const pathLength = 28; // approximate measured length

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: easing.spring }}
            className={cn("inline-flex items-center justify-center", className)}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                className="drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
            >
                {/* Background circle */}
                <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    opacity="0.2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        duration: prefersReduced ? 0 : 0.4,
                        ease: easing.enter,
                    }}
                />
                {/* Checkmark stroke */}
                <motion.path
                    d={checkPath}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        pathLength: {
                            duration: prefersReduced ? 0 : 0.5,
                            ease: easing.enter,
                            delay: 0.2,
                        },
                        opacity: { duration: 0.1, delay: 0.2 },
                    }}
                    style={{
                        strokeDasharray: pathLength,
                        strokeDashoffset: 0,
                    }}
                />
            </svg>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HONEY WAVE — Expanding ripple on deployment success
// ═══════════════════════════════════════════════════════════════

interface HoneyWaveProps {
    /** Number of ripple rings */
    rings?: number;
    className?: string;
}

/**
 * Expanding concentric circles that ripple outward in honey gold.
 * Used for deployment success celebrations.
 */
export function HoneyWave({ rings = 3, className }: HoneyWaveProps) {
    const prefersReduced = useReducedMotion();

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            {Array.from({ length: rings }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full border-2 border-hive-honey"
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{
                        scale: prefersReduced ? 2.5 : 2.5,
                        opacity: 0,
                    }}
                    transition={{
                        duration: prefersReduced ? 0 : 0.8,
                        delay: i * 0.15,
                        ease: easing.exit,
                    }}
                    style={{
                        width: 40,
                        height: 40,
                    }}
                />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CELEBRATION BURST — Radial glow on project deploy
// ═══════════════════════════════════════════════════════════════

interface CelebrationBurstProps {
    className?: string;
}

/**
 * Radial glow burst — 6 small dots expand outward from center
 * then fade. Used when a project deploys successfully.
 */
export function CelebrationBurst({ className }: CelebrationBurstProps) {
    const prefersReduced = useReducedMotion();
    const colors = ["#6366F1", "#F59E0B", "#06B6D4", "#10B981", "#8B5CF6", "#FBBF24"];

    if (prefersReduced) return null;

    return (
        <div className={cn("relative w-16 h-16", className)}>
            {colors.map((color, i) => {
                const angle = (i * 60) * (Math.PI / 180);
                return (
                    <motion.div
                        key={i}
                        className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{
                            x: 0,
                            y: 0,
                            scale: 0,
                            opacity: 1,
                        }}
                        animate={{
                            x: Math.cos(angle) * 32,
                            y: Math.sin(angle) * 32,
                            scale: [0, 1.5, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 0.7,
                            delay: i * 0.05,
                            ease: easing.exit,
                        }}
                    />
                );
            })}
            {/* Central flash */}
            <motion.div
                className="absolute inset-0 rounded-full bg-hive-honey/20"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.5, ease: easing.exit }}
            />
        </div>
    );
}
