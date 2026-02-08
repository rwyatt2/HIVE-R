/**
 * Reusable Motion Wrappers
 * ═══════════════════════════════════════════════════════════════
 *
 * Drop-in animated containers powered by Framer Motion.
 * Automatically respect prefers-reduced-motion.
 *
 * Usage:
 *   <FadeInUp>  <Card>…</Card>  </FadeInUp>
 *   <StaggerGrid> {cards.map(c => <StaggerItem><Card/></StaggerItem>)} </StaggerGrid>
 *   <PageTransition> <DashboardPage/> </PageTransition>
 */

import { type ReactNode, forwardRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
    fadeIn,
    fadeInUp,
    fadeInLeft,
    fadeInRight,
    scaleIn,
    staggerContainer,
    staggerItem as staggerItemVariant,
    pageTransition,
    cardHover,
    buttonHover,
    stagger,
    reducedMotion,
} from "../../lib/animations";
import { cn } from "../../lib/utils";

// ─── Shared types ────────────────────────────────────────────
interface MotionWrapperProps {
    children: ReactNode;
    /** Extra delay before the animation starts (sec) */
    delay?: number;
    /** Override viewport trigger amount (0-1) */
    viewportAmount?: number;
    /** Animate only once when entering viewport */
    once?: boolean;
    className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function withDelay(variants: Variants, delay?: number): Variants {
    if (!delay) return variants;
    const visible = variants.visible;
    if (typeof visible !== "object" || visible === null) return variants;
    const vis = visible as Record<string, unknown>;
    const trans = (vis.transition as Record<string, unknown>) ?? {};
    return {
        ...variants,
        visible: {
            ...vis,
            transition: { ...trans, delay },
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// FADE IN
// ═══════════════════════════════════════════════════════════════

export function FadeIn({
    children,
    delay,
    once = true,
    viewportAmount = 0.3,
    className,
}: MotionWrapperProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={withDelay(prefersReduced ? reducedMotion : fadeIn, delay)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: viewportAmount }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FADE IN UP (most common)
// ═══════════════════════════════════════════════════════════════

export function FadeInUp({
    children,
    delay,
    once = true,
    viewportAmount = 0.2,
    className,
}: MotionWrapperProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={withDelay(prefersReduced ? reducedMotion : fadeInUp, delay)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: viewportAmount }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FADE IN LEFT / RIGHT
// ═══════════════════════════════════════════════════════════════

export function FadeInLeft({
    children,
    delay,
    once = true,
    className,
}: MotionWrapperProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={withDelay(prefersReduced ? reducedMotion : fadeInLeft, delay)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: 0.3 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function FadeInRight({
    children,
    delay,
    once = true,
    className,
}: MotionWrapperProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={withDelay(prefersReduced ? reducedMotion : fadeInRight, delay)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: 0.3 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SCALE IN
// ═══════════════════════════════════════════════════════════════

export function ScaleIn({
    children,
    delay,
    once = true,
    className,
}: MotionWrapperProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={withDelay(prefersReduced ? reducedMotion : scaleIn, delay)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: 0.3 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// STAGGER GRID — parent container
// ═══════════════════════════════════════════════════════════════

interface StaggerGridProps extends MotionWrapperProps {
    /** Delay before children start appearing (sec) */
    delayChildren?: number;
    /** Stagger time between each child (sec) */
    staggerAmount?: number;
}

export function StaggerGrid({
    children,
    delayChildren = 0.1,
    staggerAmount = stagger.card,
    once = true,
    className,
}: StaggerGridProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={
                prefersReduced
                    ? reducedMotion
                    : staggerContainer(delayChildren, staggerAmount)
            }
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount: 0.15 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// STAGGER ITEM — child of StaggerGrid
// ═══════════════════════════════════════════════════════════════

export function StaggerItem({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={prefersReduced ? reducedMotion : staggerItemVariant}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// PAGE TRANSITION WRAPPER
// ═══════════════════════════════════════════════════════════════

export function PageTransition({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            variants={prefersReduced ? reducedMotion : pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED CARD (with hover lift)
// ═══════════════════════════════════════════════════════════════

export const AnimatedCard = forwardRef<
    HTMLDivElement,
    { children: ReactNode; className?: string }
>(({ children, className }, ref) => {
    const prefersReduced = useReducedMotion();
    if (prefersReduced) {
        return (
            <div ref={ref} className={className}>
                {children}
            </div>
        );
    }
    return (
        <motion.div
            ref={ref}
            {...cardHover}
            className={cn("will-change-transform", className)}
        >
            {children}
        </motion.div>
    );
});
AnimatedCard.displayName = "AnimatedCard";

// ═══════════════════════════════════════════════════════════════
// ANIMATED BUTTON (with scale hover)
// ═══════════════════════════════════════════════════════════════

export const AnimatedButton = forwardRef<
    HTMLButtonElement,
    {
        children: ReactNode;
        className?: string;
        onClick?: () => void;
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
    }
>(({ children, className, ...props }, ref) => {
    const prefersReduced = useReducedMotion();
    if (prefersReduced) {
        return (
            <button ref={ref} className={className} {...props}>
                {children}
            </button>
        );
    }
    return (
        <motion.button
            ref={ref}
            {...buttonHover}
            className={cn("will-change-transform", className)}
            {...props}
        >
            {children}
        </motion.button>
    );
});
AnimatedButton.displayName = "AnimatedButton";

// ═══════════════════════════════════════════════════════════════
// ANIMATE PRESENCE WRAPPER (convenience)
// ═══════════════════════════════════════════════════════════════

export function AnimatedPresence({
    children,
    mode = "wait",
}: {
    children: ReactNode;
    mode?: "sync" | "wait" | "popLayout";
}) {
    return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}
