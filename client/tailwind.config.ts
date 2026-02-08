import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class", ".dark"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1280px",
            },
        },
        extend: {
            // ─── Colors ─────────────────────────────────────────────────
            colors: {
                // Shadcn/ui CSS variable integration
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },

                // ── Intelligent Hive: Base Palette (90%) ──
                "hive-bg": {
                    dark: "#0A0E14",
                    light: "#FAFAF9",
                },
                "hive-surface": {
                    DEFAULT: "#1A1F2E",
                    elevated: "#232838",
                },
                "hive-border": {
                    DEFAULT: "#2D3748",
                    subtle: "rgba(255, 255, 255, 0.05)",
                    light: "rgba(255, 255, 255, 0.1)",
                    medium: "rgba(255, 255, 255, 0.15)",
                    bright: "rgba(255, 255, 255, 0.2)",
                },
                "hive-text": {
                    primary: "#F7FAFC",
                    secondary: "#A0AEC0",
                    tertiary: "#718096",
                },

                // ── Intelligent Hive: Signature Accents (10%) ──
                "hive-indigo": {
                    DEFAULT: "#6366F1",
                    light: "#818CF8",
                    dark: "#4F46E5",
                    muted: "rgba(99, 102, 241, 0.1)",
                    glow: "rgba(99, 102, 241, 0.3)",
                },
                "hive-honey": {
                    DEFAULT: "#F59E0B",
                    light: "#FBBF24",
                    dark: "#D97706",
                    muted: "rgba(245, 158, 11, 0.1)",
                    glow: "rgba(245, 158, 11, 0.3)",
                },
                "hive-cyan": {
                    DEFAULT: "#06B6D4",
                    light: "#22D3EE",
                    dark: "#0891B2",
                    muted: "rgba(6, 182, 212, 0.1)",
                    glow: "rgba(6, 182, 212, 0.3)",
                },
                "hive-success": {
                    DEFAULT: "#10B981",
                    muted: "rgba(16, 185, 129, 0.1)",
                },
                "hive-warning": {
                    DEFAULT: "#F97316",
                    muted: "rgba(249, 115, 22, 0.1)",
                },
                "hive-error": {
                    DEFAULT: "#EF4444",
                    muted: "rgba(239, 68, 68, 0.1)",
                },

                // ── Studio / Void palette (dark surfaces) ──
                "void": {
                    700: "#1E293B",
                    800: "#1A1F2E",
                    900: "#151922",
                    950: "#0D1117",
                },
                "starlight": {
                    50: "#F7FAFC",
                    100: "#EDF2F7",
                    200: "#E2E8F0",
                    300: "#CBD5E0",
                    400: "#A0AEC0",
                    500: "#718096",
                    600: "#4A5568",
                    700: "#2D3748",
                },
                "electric-violet": "#8B5CF6",
                "electric-indigo": "#6366F1",
                "cyber-cyan": "#06B6D4",
                "reactor-red": "#EF4444",
                "plasma-green": "#10B981",
                "reactor-core": "#06B6D4",
                "honey": "#F59E0B",
                "honey-glow": "rgba(245, 158, 11, 0.5)",
                "background-elevated": "hsl(var(--card))",

                // ── Agent Signature Colors ──
                "agent-router": "#6366F1",
                "agent-founder": "#8B5CF6",
                "agent-pm": "#A78BFA",
                "agent-designer": "#C084FC",
                "agent-builder": "#3B82F6",
                "agent-tester": "#10B981",
                "agent-security": "#EF4444",
                "agent-devops": "#F97316",
                "agent-docs": "#06B6D4",
                "agent-monitor": "#14B8A6",
                "agent-sre": "#F59E0B",
                "agent-analyst": "#EC4899",
                "agent-reviewer": "#6EE7B7",
            },

            // ─── Border Radius ──────────────────────────────────────────
            borderRadius: {
                xs: "0.25rem",   // 4px
                sm: "0.5rem",    // 8px
                md: "0.75rem",   // 12px
                lg: "1rem",      // 16px
                xl: "1.5rem",    // 24px
                "2xl": "2rem",   // 32px
                pill: "9999px",
            },

            // ─── Typography ─────────────────────────────────────────────
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            fontSize: {
                "hero": ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
                "h2": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.02em" }],
                "h3": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.3", fontWeight: "600" }],
                "h4": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
                "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
                "body": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
                "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
                "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
            },

            // ─── Spacing (extending default) ────────────────────────────
            spacing: {
                "18": "4.5rem",
                "22": "5.5rem",
                "26": "6.5rem",
                "30": "7.5rem",
            },

            // ─── Shadows ────────────────────────────────────────────────
            boxShadow: {
                "glass": "0 4px 30px rgba(0, 0, 0, 0.1)",
                "glass-heavy": "0 8px 32px rgba(0, 0, 0, 0.4)",
                "neon-indigo": "0 0 20px rgba(99, 102, 241, 0.3)",
                "neon-indigo-lg": "0 0 40px rgba(99, 102, 241, 0.4)",
                "neon-honey": "0 0 20px rgba(245, 158, 11, 0.3)",
                "neon-cyan": "0 0 20px rgba(6, 182, 212, 0.3)",
                "neon-violet": "0 0 20px rgba(139, 92, 246, 0.35)",
                "card": "0 2px 8px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.05)",
                "card-hover": "0 8px 24px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1)",
                "float": "0 20px 60px rgba(0, 0, 0, 0.5)",
            },

            // ─── Background Images / Gradients ─────────────────────────
            backgroundImage: {
                "hero-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)",
                "indigo-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                "honey-gradient": "linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)",
                "cyan-gradient": "linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)",
                "surface-gradient": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent)",
            },

            // ─── Keyframes ──────────────────────────────────────────────
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
                    "50%": { opacity: "0.8", transform: "scale(1.05)" },
                },
                "agent-pulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 var(--agent-color, rgba(99, 102, 241, 0.4))" },
                    "50%": { boxShadow: "0 0 0 8px transparent" },
                },
                "slide-in-right": {
                    from: { transform: "translateX(100%)", opacity: "0" },
                    to: { transform: "translateX(0)", opacity: "1" },
                },
                "slide-out-right": {
                    from: { transform: "translateX(0)", opacity: "1" },
                    to: { transform: "translateX(100%)", opacity: "0" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "fade-in-up": {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "scale-in": {
                    from: { opacity: "0", transform: "scale(0.95)" },
                    to: { opacity: "1", transform: "scale(1)" },
                },
                "hex-fill": {
                    "0%": { opacity: "0", transform: "scale(0.8)" },
                    "50%": { opacity: "1" },
                    "100%": { opacity: "0.6", transform: "scale(1)" },
                },
                "honey-ripple": {
                    "0%": { transform: "scale(0)", opacity: "0.6" },
                    "100%": { transform: "scale(2.5)", opacity: "0" },
                },
                "breathe": {
                    "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
                    "50%": { transform: "scale(1.03)", opacity: "1" },
                },
                "dash-flow": {
                    to: { strokeDashoffset: "-20" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                "pulse-subtle": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.85" },
                },
                "shockwave": {
                    "0%": { transform: "scale(1)", opacity: "0.5" },
                    "100%": { transform: "scale(1.5)", opacity: "0" },
                },
            },

            // ─── Animations ─────────────────────────────────────────────
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "shimmer": "shimmer 2s linear infinite",
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "agent-pulse": "agent-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                "slide-out-right": "slide-out-right 0.3s ease-in",
                "fade-in": "fade-in 0.2s ease-out",
                "fade-in-up": "fade-in-up 0.3s ease-out",
                "scale-in": "scale-in 0.2s ease-out",
                "hex-fill": "hex-fill 0.6s ease-out forwards",
                "honey-ripple": "honey-ripple 0.8s ease-out forwards",
                "breathe": "breathe 4s ease-in-out infinite",
                "dash-flow": "dash-flow 1s linear infinite",
                "float": "float 6s ease-in-out infinite",
                "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
                "shockwave": "shockwave 0.6s ease-out forwards",
            },

            // ─── Backdrop Blur ──────────────────────────────────────────
            backdropBlur: {
                xs: "4px",
            },

            // ─── Transitions ────────────────────────────────────────────
            transitionDuration: {
                "400": "400ms",
                "600": "600ms",
            },
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;
