import type { FrameworkPreset } from "./design-system.js";
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
export declare function loadTokens(path: string): DesignTokens | null;
/**
 * Map tokens to Tailwind config
 */
export declare function tokensToTailwind(tokens: DesignTokens): string;
/**
 * Map tokens to CSS Variables
 */
export declare function tokensToCSSVariables(tokens: DesignTokens): string;
/**
 * Map tokens to Chakra theme
 */
export declare function tokensToChakra(tokens: DesignTokens): string;
/**
 * Map tokens to MUI theme
 */
export declare function tokensToMUI(tokens: DesignTokens): string;
/**
 * Map tokens to any framework
 */
export declare function mapTokensToFramework(tokens: DesignTokens, framework: FrameworkPreset): string;
/**
 * Format tokens for agent prompt
 */
export declare function formatTokensForPrompt(tokens: DesignTokens, framework: FrameworkPreset): string;
//# sourceMappingURL=token-mapper.d.ts.map