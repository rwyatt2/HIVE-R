/**
 * HIVE-R Animation Language
 * ═══════════════════════════════════════════════════════════════
 *
 * Organic, purposeful animations that reinforce the "Living Hive" narrative.
 *
 * Rules:
 *   1. Animate only transform & opacity (GPU compositing).
 *   2. Respect prefers-reduced-motion (use `useReducedMotion()`).
 *   3. Organic cubic-bezier curves, never linear (except ambient).
 *   4. Every animation must serve UX — never purely decorative.
 *   5. 60 fps or nothing.
 *
 * @module lib/animations
 */

import type { Transition, Variants } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// 1. CORE VALUES
// ═══════════════════════════════════════════════════════════════

/** Organic cubic-bezier easing curves */
export const easing = {
    /** Elements entering the viewport — decelerates to rest */
    enter: [0.22, 1, 0.36, 1] as [number, number, number, number],
    /** Elements leaving — accelerates away */
    exit: [0.55, 0, 1, 0.45] as [number, number, number, number],
    /** Interactive micro-feedback */
    hover: [0.4, 0, 0.2, 1] as [number, number, number, number],
    /** Natural spring-like overshoot */
    spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    /** Smooth in-out for state changes */
    smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

/** Duration tokens in seconds */
export const duration = {
    /** Hover, active states */
    micro: 0.15,
    /** State changes, toggles */
    standard: 0.3,
    /** Page transitions, modals */
    large: 0.5,
    /** Ambient breathing/floating */
    ambient: 2.0,
    /** Agent handoff sequence */
    handoff: 2.5,
} as const;

/** Stagger delay tokens in seconds */
export const stagger = {
    /** List items */
    list: 0.05,
    /** Agent nodes in graph */
    agent: 0.08,
    /** Card grids */
    card: 0.1,
    /** Feature sections */
    section: 0.15,
} as const;

/** Spring presets for Framer Motion */
export const spring = {
    /** Snappy response — buttons, toggles */
    snappy: { type: "spring" as const, stiffness: 500, damping: 30 },
    /** Bouncy entrance — cards, modals */
    bouncy: { type: "spring" as const, stiffness: 300, damping: 20 },
    /** Gentle — page transitions */
    gentle: { type: "spring" as const, stiffness: 150, damping: 25 },
    /** Toasts — slide in with overshoot */
    toast: { type: "spring" as const, stiffness: 400, damping: 25 },
} as const;

// ═══════════════════════════════════════════════════════════════
// 2. TRANSITION PRESETS
// ═══════════════════════════════════════════════════════════════

export const transition = {
    /** Micro interactions — hover, active */
    micro: {
        duration: duration.micro,
        ease: easing.hover,
    } satisfies Transition,

    /** Standard state changes */
    standard: {
        duration: duration.standard,
        ease: easing.smooth,
    } satisfies Transition,

    /** Large transitions — pages, modals */
    large: {
        duration: duration.large,
        ease: easing.enter,
    } satisfies Transition,

    /** Enter transitions */
    enter: {
        duration: duration.standard,
        ease: easing.enter,
    } satisfies Transition,

    /** Exit transitions */
    exit: {
        duration: duration.standard * 0.8,
        ease: easing.exit,
    } satisfies Transition,
} as const;

// ═══════════════════════════════════════════════════════════════
// 3. VARIANT PRESETS
// ═══════════════════════════════════════════════════════════════

/** Fade in from nothing */
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: duration.standard, ease: easing.enter },
    },
    exit: {
        opacity: 0,
        transition: { duration: duration.micro, ease: easing.exit },
    },
};

/** Fade + slide from bottom */
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.standard, ease: easing.enter },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: duration.micro, ease: easing.exit },
    },
};

/** Fade + slide from left */
export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: duration.standard, ease: easing.enter },
    },
};

/** Fade + slide from right */
export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: duration.standard, ease: easing.enter },
    },
};

/** Scale up from center */
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: duration.standard, ease: easing.enter },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: duration.micro, ease: easing.exit },
    },
};

// ═══════════════════════════════════════════════════════════════
// 4. PAGE TRANSITIONS
// ═══════════════════════════════════════════════════════════════

/** Page enter/exit variants */
export const pageTransition: Variants = {
    initial: {
        opacity: 0,
        y: 12,
        scale: 0.99,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: duration.large,
            ease: easing.enter,
            staggerChildren: stagger.section,
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: duration.standard,
            ease: easing.exit,
        },
    },
};

// ═══════════════════════════════════════════════════════════════
// 5. STAGGERED CONTAINERS
// ═══════════════════════════════════════════════════════════════

/** Parent container that staggers children */
export const staggerContainer = (
    delayChildren: number = 0.1,
    staggerAmount: number = stagger.card
): Variants => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren,
            staggerChildren: staggerAmount,
        },
    },
});

/** Child items for staggered lists */
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: duration.standard,
            ease: easing.enter,
        },
    },
};

/** Agent node stagger container */
export const agentStagger: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren: 0.2,
            staggerChildren: stagger.agent,
        },
    },
};

/** Individual agent node animation */
export const agentNodeVariant: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: duration.standard,
            ease: easing.spring,
        },
    },
};

// ═══════════════════════════════════════════════════════════════
// 6. INTERACTIVE ANIMATIONS
// ═══════════════════════════════════════════════════════════════

/** Card hover animation values */
export const cardHover = {
    initial: { y: 0, scale: 1 },
    whileHover: {
        y: -4,
        scale: 1.01,
        transition: { duration: duration.micro, ease: easing.hover },
    },
    whileTap: {
        scale: 0.98,
        transition: { duration: 0.1 },
    },
};

/** Button hover/tap values */
export const buttonHover = {
    whileHover: {
        scale: 1.02,
        transition: { duration: duration.micro, ease: easing.hover },
    },
    whileTap: {
        scale: 0.98,
        transition: { duration: 0.08 },
    },
};

// ═══════════════════════════════════════════════════════════════
// 7. TOAST / NOTIFICATION
// ═══════════════════════════════════════════════════════════════

export const toastVariants: Variants = {
    initial: { x: 400, opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: spring.toast,
    },
    exit: {
        x: 400,
        opacity: 0,
        transition: { duration: 0.2, ease: easing.exit },
    },
};

// ═══════════════════════════════════════════════════════════════
// 8. MODAL / OVERLAY
// ═══════════════════════════════════════════════════════════════

/** Backdrop fade */
export const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: duration.micro },
    },
    exit: {
        opacity: 0,
        transition: { duration: duration.micro, delay: 0.1 },
    },
};

/** Modal content scale-in */
export const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: spring.bouncy,
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        y: 5,
        transition: { duration: duration.micro, ease: easing.exit },
    },
};

// ═══════════════════════════════════════════════════════════════
// 9. SCROLL HELPERS (for use with useScroll/useTransform)
// ═══════════════════════════════════════════════════════════════

/** Hero parallax ranges — Y offset & opacity */
export const heroParallax = {
    scrollRange: [0, 500],
    yOutputRange: [0, 150],
    opacityScrollRange: [0, 300],
    opacityOutputRange: [1, 0],
} as const;

// ═══════════════════════════════════════════════════════════════
// 10. AGENT HANDOFF SEQUENCE (timings)
// ═══════════════════════════════════════════════════════════════

/** Agent handoff animation stage timings (seconds) */
export const handoffTimings = {
    /** Stage 1 — Source agent completes, glow + scale down */
    sourceComplete: 0.3,
    /** Stage 2 — Checkmark appears (honey gold SVG path draw) */
    checkmark: 0.4,
    /** Stage 3 — Connection line draws (SVG stroke-dashoffset) */
    lineDrawDelay: 0.5,
    lineDraw: 0.6,
    /** Stage 4 — Particles flow along the line */
    particleDelay: 0.8,
    particleDuration: 0.8,
    /** Stage 5 — Target agent activates (pulse + border glow) */
    targetActivateDelay: 1.4,
    targetActivate: 0.4,
    /** Total sequence duration */
    total: 2.5,
} as const;

// ═══════════════════════════════════════════════════════════════
// 11. REDUCED MOTION
// ═══════════════════════════════════════════════════════════════

/** Instantly resolve — no animation. For prefers-reduced-motion. */
export const reducedMotion: Variants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

/**
 * Choose between two variant sets based on reduced motion preference.
 * Usage:
 *   const variants = useMotionVariants(fadeInUp);
 */
export function pickVariants(
    full: Variants,
    prefersReduced: boolean
): Variants {
    return prefersReduced ? reducedMotion : full;
}
