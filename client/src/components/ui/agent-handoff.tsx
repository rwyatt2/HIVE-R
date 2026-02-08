/**
 * AgentHandoff — Signature "Living Hive" Animation
 * ═══════════════════════════════════════════════════════════════
 *
 * THE showstopper. Five-stage sequence that visualizes work
 * flowing from one agent to the next.
 *
 * Stage 1: Source completes (glow + scale)          300ms
 * Stage 2: Checkmark appears (honey gold)           400ms
 * Stage 3: Connection line draws (SVG dash)         600ms
 * Stage 4: Particles flow along path                800ms
 * Stage 5: Target activates (pulse + glow)          400ms
 *
 * Usage (standalone demo):
 *   <AgentHandoff
 *     sourceColor="#6366F1"
 *     targetColor="#10B981"
 *     isActive={true}
 *   />
 *
 * In the graph view, this is triggered between ReactFlow nodes
 * via the edge animation system.
 */

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { easing, handoffTimings } from "../../lib/animations";
import { cn } from "../../lib/utils";

// ─── Types ───────────────────────────────────────────────────

interface AgentHandoffProps {
    /** Source agent color */
    sourceColor?: string;
    /** Target agent color */
    targetColor?: string;
    /** Trigger the animation sequence */
    isActive: boolean;
    /** Compact mode for inline use */
    compact?: boolean;
    className?: string;
}

// ─── Particle ────────────────────────────────────────────────

function FlowParticle({
    delay,
    color,
    pathWidth,
}: {
    delay: number;
    color: string;
    pathWidth: number;
}) {
    return (
        <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
                top: "50%",
                left: 0,
            }}
            initial={{ x: 0, opacity: 0, scale: 0 }}
            animate={{
                x: pathWidth,
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0.5],
            }}
            transition={{
                duration: handoffTimings.particleDuration,
                delay,
                ease: easing.smooth,
            }}
        />
    );
}

// ─── Component ───────────────────────────────────────────────

export function AgentHandoff({
    sourceColor = "#6366F1",
    targetColor = "#10B981",
    isActive,
    compact = false,
    className,
}: AgentHandoffProps) {
    const prefersReduced = useReducedMotion();
    const t = handoffTimings;
    const nodeSize = compact ? 40 : 56;
    const pathWidth = compact ? 120 : 200;

    if (prefersReduced) {
        return (
            <div className={cn("flex items-center gap-4", className)}>
                <div
                    className="rounded-xl border-2 flex-center"
                    style={{
                        width: nodeSize,
                        height: nodeSize,
                        borderColor: isActive ? targetColor : sourceColor,
                        backgroundColor: `${sourceColor}15`,
                    }}
                >
                    <span className="text-xl">🐝</span>
                </div>
                <div className="h-0.5 flex-1" style={{ backgroundColor: `${sourceColor}30` }} />
                <div
                    className="rounded-xl border-2 flex-center"
                    style={{
                        width: nodeSize,
                        height: nodeSize,
                        borderColor: isActive ? targetColor : "rgba(255,255,255,0.1)",
                        backgroundColor: `${targetColor}15`,
                    }}
                >
                    <span className="text-xl">🐝</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("relative flex items-center", className)}>
            {/* ── Stage 1: Source Agent ── */}
            <motion.div
                className="relative rounded-xl border-2 flex-center z-10"
                style={{
                    width: nodeSize,
                    height: nodeSize,
                    borderColor: sourceColor,
                    backgroundColor: `${sourceColor}15`,
                }}
                animate={
                    isActive
                        ? {
                            scale: [1, 1.08, 1],
                            boxShadow: [
                                `0 0 0 0 ${sourceColor}00`,
                                `0 0 24px 4px ${sourceColor}60`,
                                `0 0 8px 2px ${sourceColor}30`,
                            ],
                        }
                        : { scale: 1, boxShadow: "none" }
                }
                transition={{
                    duration: t.sourceComplete,
                    ease: easing.smooth,
                }}
            >
                <span className="text-xl">🐝</span>
            </motion.div>

            {/* ── Stage 2: Checkmark ── */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        className="absolute z-20"
                        style={{ left: nodeSize - 8, top: -4 }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            delay: t.sourceComplete,
                            duration: t.checkmark * 0.6,
                            ease: easing.spring,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="#F59E0B" opacity="0.2" />
                            <motion.path
                                d="M7 13l3 3 7-7"
                                stroke="#F59E0B"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{
                                    delay: t.sourceComplete + 0.1,
                                    duration: 0.3,
                                    ease: easing.enter,
                                }}
                            />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stage 3: Connection Line ── */}
            <div className="relative flex-1 mx-2" style={{ height: 4 }}>
                <svg
                    width="100%"
                    height="4"
                    className="absolute inset-0 overflow-visible"
                    style={{ top: 0 }}
                >
                    {/* Track */}
                    <line
                        x1="0"
                        y1="2"
                        x2="100%"
                        y2="2"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    {/* Animated fill */}
                    {isActive && (
                        <motion.line
                            x1="0"
                            y1="2"
                            x2="100%"
                            y2="2"
                            stroke={sourceColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0.5 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                                delay: t.lineDrawDelay,
                                duration: t.lineDraw,
                                ease: easing.enter,
                            }}
                            style={{
                                filter: `drop-shadow(0 0 4px ${sourceColor}80)`,
                            }}
                        />
                    )}
                </svg>

                {/* ── Stage 4: Particles ── */}
                {isActive && (
                    <div className="absolute inset-0 overflow-hidden">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <FlowParticle
                                key={i}
                                delay={t.particleDelay + i * 0.12}
                                color={sourceColor}
                                pathWidth={pathWidth}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Stage 5: Target Agent ── */}
            <motion.div
                className="relative rounded-xl border-2 flex-center z-10"
                style={{
                    width: nodeSize,
                    height: nodeSize,
                    borderColor: isActive ? targetColor : "rgba(255,255,255,0.1)",
                    backgroundColor: `${targetColor}15`,
                }}
                animate={
                    isActive
                        ? {
                            scale: [1, 1.1, 1.03, 1],
                            borderColor: targetColor,
                            boxShadow: [
                                "0 0 0 0 transparent",
                                "0 0 0 0 transparent",
                                `0 0 24px 4px ${targetColor}60`,
                                `0 0 12px 2px ${targetColor}40`,
                            ],
                        }
                        : {
                            scale: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                            boxShadow: "none",
                        }
                }
                transition={{
                    delay: isActive ? t.targetActivateDelay : 0,
                    duration: t.targetActivate,
                    ease: easing.spring,
                }}
            >
                <span className="text-xl">🐝</span>
            </motion.div>
        </div>
    );
}
