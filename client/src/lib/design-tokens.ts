/**
 * HIVE-R Design System Tokens
 * Centralized constants for spacing, typography, and animations
 */

export const componentSpacing = {
    cardPadding: "p-6",
    cardGap: "gap-4",
    sectionGap: "space-y-8",
    inputHeight: "h-10",
    buttonHeight: "h-10",
    iconSize: "w-4 h-4",
    iconSizeMd: "w-5 h-5",
    iconSizeLg: "w-6 h-6",
    avatarSm: "w-8 h-8",
    avatarMd: "w-10 h-10",
    avatarLg: "w-16 h-16",
} as const;

export const headingStyles = {
    h1: "scroll-m-20 text-5xl font-semibold tracking-tight leading-[1.1]",
    h2: "scroll-m-20 text-4xl font-semibold tracking-tight leading-[1.15]",
    h3: "scroll-m-20 text-3xl font-semibold tracking-tight leading-[1.2]",
    h4: "scroll-m-20 text-2xl font-semibold tracking-tight leading-[1.25]",
    h5: "scroll-m-20 text-xl font-semibold leading-[1.3]",
    h6: "scroll-m-20 text-lg font-semibold leading-[1.35]",
} as const;

export const bodyStyles = {
    large: "text-lg leading-7",
    base: "text-base leading-7",
    small: "text-sm leading-6",
    xsmall: "text-xs leading-5",
    muted: "text-sm text-muted-foreground leading-6",
    code: "font-mono text-sm bg-muted px-1 py-0.5 rounded",
} as const;

export const displayStyles = {
    xl: "text-7xl font-bold tracking-tighter leading-none",
    lg: "text-6xl font-bold tracking-tight leading-none",
    md: "text-5xl font-bold tracking-tight leading-tight",
} as const;

export const easings = {
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeIn: "cubic-bezier(0.87, 0, 0.13, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const durations = {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
} as const;

// Framer Motion variants
export const fadeIn = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
};

export const slideUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
};
