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
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
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
                // HIVE-R Bionic Minimalism Palette
                void: {
                    950: "#020202", // Canvas
                    900: "#09090B", // Surface
                    800: "#18181B", // Elevated
                },
                glass: {
                    10: "rgba(255, 255, 255, 0.1)",
                    20: "rgba(255, 255, 255, 0.2)",
                },
                starlight: {
                    50: "#FAFAFA", // Text Primary
                    400: "#A1A1AA", // Text Secondary
                    700: "#52525B", // Text Tertiary
                },
                electric: {
                    violet: "#6366F1",
                    indigo: "#4338ca",
                },
                cyber: {
                    cyan: "#06B6D4",
                },
                reactor: {
                    red: "#EF4444",
                },
                honey: {
                    DEFAULT: "#F59E0B",
                    glow: "rgba(245, 158, 11, 0.4)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "pulse-border": {
                    "0%, 100%": { borderColor: "rgba(99, 102, 241, 0.5)" },
                    "50%": { borderColor: "rgba(99, 102, 241, 1)" },
                },
                "dash": {
                    to: { strokeDashoffset: "-100" },
                },
                "shockwave": {
                    "0%": { transform: "scale(1)", opacity: "0" },
                    "50%": { opacity: "0.5" },
                    "100%": { transform: "scale(2)", opacity: "0" },
                },
                "aurora": {
                    "0%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                    "100%": { backgroundPosition: "0% 50%" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-border": "pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "dash": "dash 1s linear infinite",
                "shockwave": "shockwave 1s ease-out forwards",
                "aurora": "aurora 5s ease infinite",
            },
            backgroundImage: {
                "electric-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                "honey-gradient": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
            },
            boxShadow: {
                "neon-violet": "0 0 20px rgba(99, 102, 241, 0.3)",
                "neon-honey": "0 0 20px rgba(245, 158, 11, 0.3)",
                "glass": "0 4px 30px rgba(0, 0, 0, 0.1)",
            }
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;
