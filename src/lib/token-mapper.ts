import { readFileSync, existsSync } from "fs";
import type { FrameworkPreset } from "./design-system.js";
import { logger } from "./logger.js";

/**
 * Design Token Mapper
 * 
 * Define tokens once, map to any framework.
 */

export interface DesignTokens {
  brand?: string;
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background: string;
    foreground: string;
    muted?: string;
    border?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  darkColors?: {
    background?: string;
    foreground?: string;
    muted?: string;
    border?: string;
  };
  typography: {
    fontFamily: string;
    fontMono?: string;
    fontSizes?: Record<string, string>;
  };
  spacing?: {
    unit: number;
    scale?: number[];
  };
  radius?: Record<string, string>;
  shadows?: Record<string, string>;
}

/**
 * Load tokens from file
 */
export function loadTokens(path: string): DesignTokens | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as DesignTokens;
  } catch {
    logger.warn({ path }, `Failed to load tokens from ${path}`);
    return null;
  }
}

/**
 * Map tokens to Tailwind config
 */
export function tokensToTailwind(tokens: DesignTokens): string {
  return `
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '${tokens.colors.primary}',
        secondary: '${tokens.colors.secondary || tokens.colors.primary}',
        accent: '${tokens.colors.accent || tokens.colors.primary}',
        background: '${tokens.colors.background}',
        foreground: '${tokens.colors.foreground}',
        muted: '${tokens.colors.muted || "#f1f5f9"}',
        border: '${tokens.colors.border || "#e2e8f0"}',
      },
      fontFamily: {
        sans: ['${tokens.typography.fontFamily.split(",")[0]?.trim()}', 'system-ui', 'sans-serif'],
        mono: ['${tokens.typography.fontMono?.split(",")[0]?.trim() || "monospace"}'],
      },
      borderRadius: {
        ${Object.entries(tokens.radius || {}).map(([k, v]) => `'${k}': '${v}'`).join(",\n        ")}
      },
    },
  },
}`;
}

/**
 * Map tokens to CSS Variables
 */
export function tokensToCSSVariables(tokens: DesignTokens): string {
  return `
/* globals.css - Works with shadcn/ui, Radix, or any framework */
:root {
  /* Colors */
  --color-primary: ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary || tokens.colors.primary};
  --color-accent: ${tokens.colors.accent || tokens.colors.primary};
  --color-background: ${tokens.colors.background};
  --color-foreground: ${tokens.colors.foreground};
  --color-muted: ${tokens.colors.muted || "#f1f5f9"};
  --color-border: ${tokens.colors.border || "#e2e8f0"};
  
  /* Typography */
  --font-sans: ${tokens.typography.fontFamily};
  --font-mono: ${tokens.typography.fontMono || "monospace"};
  
  /* Radius */
  ${Object.entries(tokens.radius || {}).map(([k, v]) => `--radius-${k}: ${v};`).join("\n  ")}
  
  /* Shadows */
  ${Object.entries(tokens.shadows || {}).map(([k, v]) => `--shadow-${k}: ${v};`).join("\n  ")}
}

.dark {
  --color-background: ${tokens.darkColors?.background || "#0f172a"};
  --color-foreground: ${tokens.darkColors?.foreground || "#f8fafc"};
  --color-muted: ${tokens.darkColors?.muted || "#1e293b"};
  --color-border: ${tokens.darkColors?.border || "#334155"};
}`;
}

/**
 * Map tokens to Chakra theme
 */
export function tokensToChakra(tokens: DesignTokens): string {
  return `
// theme.ts - Chakra UI theme extension
import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  colors: {
    brand: {
      50: '${lighten(tokens.colors.primary, 0.9)}',
      100: '${lighten(tokens.colors.primary, 0.7)}',
      500: '${tokens.colors.primary}',
      600: '${darken(tokens.colors.primary, 0.1)}',
      700: '${darken(tokens.colors.primary, 0.2)}',
    },
  },
  fonts: {
    heading: '${tokens.typography.fontFamily}',
    body: '${tokens.typography.fontFamily}',
    mono: '${tokens.typography.fontMono || "monospace"}',
  },
  radii: {
    ${Object.entries(tokens.radius || {}).map(([k, v]) => `${k}: '${v}'`).join(",\n    ")}
  },
})`;
}

/**
 * Map tokens to MUI theme
 */
export function tokensToMUI(tokens: DesignTokens): string {
  return `
// theme.ts - Material UI theme
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '${tokens.colors.primary}' },
    secondary: { main: '${tokens.colors.secondary || tokens.colors.primary}' },
    background: {
      default: '${tokens.colors.background}',
      paper: '${tokens.colors.muted || "#f1f5f9"}',
    },
    text: {
      primary: '${tokens.colors.foreground}',
    },
  },
  typography: {
    fontFamily: '${tokens.typography.fontFamily}',
  },
  shape: {
    borderRadius: ${parseInt(tokens.radius?.md || "8")},
  },
});`;
}

/**
 * Map tokens to any framework
 */
export function mapTokensToFramework(
  tokens: DesignTokens,
  framework: FrameworkPreset
): string {
  switch (framework) {
    case "tailwind":
    case "shadcn":
      return `${tokensToCSSVariables(tokens)}\n\n${tokensToTailwind(tokens)}`;
    case "chakra":
      return tokensToChakra(tokens);
    case "mui":
      return tokensToMUI(tokens);
    case "radix":
    case "custom":
      return tokensToCSSVariables(tokens);
    default:
      return tokensToCSSVariables(tokens);
  }
}

/**
 * Format tokens for agent prompt
 */
export function formatTokensForPrompt(tokens: DesignTokens, framework: FrameworkPreset): string {
  const frameworkConfig = mapTokensToFramework(tokens, framework);

  return `
## 🎨 Design Tokens (${tokens.brand || "Custom"})

**Apply these exact tokens when building UI.**

### Quick Reference
- Primary: \`${tokens.colors.primary}\`
- Background: \`${tokens.colors.background}\`
- Foreground: \`${tokens.colors.foreground}\`
- Font: \`${tokens.typography.fontFamily.split(",")[0]}\`
- Radius: ${tokens.radius?.md || "0.5rem"}

### Framework Config
\`\`\`
${frameworkConfig}
\`\`\`

**Use these tokens exactly. Do not invent new color values or spacing.**
`;
}

// Helper functions
function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
