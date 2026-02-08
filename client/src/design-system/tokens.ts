/**
 * Design Tokens - Single source of truth for all design values
 */

export const tokens = {
    colors: {
        // Base colors
        slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
        },

        // Brand colors (Indigo)
        primary: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
        },

        // Semantic colors
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',

        // Functional
        background: {
            primary: '#0f172a',
            secondary: '#1e293b',
            tertiary: '#334155',
        },

        text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
            tertiary: '#94a3b8',
            disabled: '#64748b',
        },

        border: {
            default: '#334155',
            hover: '#475569',
            focus: '#818cf8',
        },

        // Glassmorphic overlays
        glass: {
            high: 'rgba(15, 23, 42, 0.9)',
            medium: 'rgba(30, 41, 59, 0.7)',
            low: 'rgba(51, 65, 85, 0.5)',
        },
    },

    spacing: {
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
    },

    typography: {
        fontFamily: {
            sans: 'Inter, -apple-system, sans-serif',
            mono: '"Fira Code", monospace',
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
    },

    borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
    },

    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.6)',
        glow: '0 0 20px rgba(129, 140, 248, 0.5)',
    },

    transitions: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
    },

    zIndex: {
        dropdown: 1000,
        modal: 1200,
        tooltip: 1400,
        toast: 1500,
    },
};

export type Tokens = typeof tokens;
