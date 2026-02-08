/**
 * HIVE-R Design System Tokens
 * Centralized constants for spacing, typography, and animations
 */

/**
 * 4pt Grid Spacing System
 * All spacing values are multiples of 4px for consistent rhythm
 */
export const spacing = {
    none: '0',
    xs: '4px',      // 1 unit - tight internal spacing
    sm: '8px',      // 2 units - small gaps, inline elements
    md: '12px',     // 3 units - compact sections, list items
    base: '16px',   // 4 units - default element padding
    lg: '20px',     // 5 units - enhanced breathing room
    xl: '24px',     // 6 units - card padding, section gaps
    '2xl': '32px',  // 8 units - large section separations
    '3xl': '40px',  // 10 units - major layout divisions
    '4xl': '48px',  // 12 units - panel/viewport margins
} as const;

/**
 * Tailwind class mappings for 4pt grid
 * Use these semantic tokens for consistent spacing
 */
export const spacingClasses = {
    // Gaps (flexbox/grid)
    gapTight: 'gap-1',      // 4px
    gapSmall: 'gap-2',      // 8px
    gapDefault: 'gap-3',    // 12px
    gapMedium: 'gap-4',     // 16px
    gapLarge: 'gap-6',      // 24px
    gapSection: 'gap-8',    // 32px

    // Padding
    padTight: 'p-1',        // 4px
    padSmall: 'p-2',        // 8px
    padDefault: 'p-3',      // 12px
    padMedium: 'p-4',       // 16px
    padLarge: 'p-5',        // 20px
    padXLarge: 'p-6',       // 24px

    // Margins
    marginTight: 'm-1',     // 4px
    marginSmall: 'm-2',     // 8px
    marginDefault: 'm-3',   // 12px
    marginMedium: 'm-4',    // 16px
} as const;

export const componentSpacing = {
    // Container/Layout spacing
    viewportPadding: 'p-2 md:p-3',
    layoutGap: 'gap-2 md:gap-3',
    containerPadding: 'p-4 md:p-6',
    panelPadding: 'p-4',
    cardPadding: 'p-5',
    cardGap: 'gap-4',
    sectionGap: 'space-y-6',

    // Navigation spacing
    navPadding: 'p-3',
    navItemGap: 'gap-1',
    navItemPadding: 'px-3 py-2.5',

    // Interactive elements (44px min touch target)
    inputHeight: 'h-11',
    inputPadding: 'px-3 py-2',
    buttonHeight: 'h-10',
    buttonPadding: 'px-4 py-2',
    minTouchTarget: 'min-h-11 min-w-11',

    // Icon sizes
    iconSize: 'w-4 h-4',
    iconSizeMd: 'w-5 h-5',
    iconSizeLg: 'w-6 h-6',

    // Avatar sizes
    avatarSm: 'w-8 h-8',
    avatarMd: 'w-10 h-10',
    avatarLg: 'w-16 h-16',
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
