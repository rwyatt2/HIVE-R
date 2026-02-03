/**
 * Design Framework Presets
 *
 * Quick switching between popular CSS frameworks with world-class design
 * best practices baked in.
 */
export type FrameworkPreset = "tailwind" | "shadcn" | "chakra" | "mui" | "radix" | "ant" | "bootstrap" | "custom";
interface DesignFramework {
    name: string;
    framework: FrameworkPreset;
    description: string;
    installCommand: string;
    principles: string[];
    bestPractices: string;
}
declare const UNIVERSAL_DESIGN_PRINCIPLES: string;
declare const FRAMEWORKS: Record<FrameworkPreset, DesignFramework>;
/**
 * Get full design context for agents
 */
export declare function getDesignContext(framework?: FrameworkPreset, tokensPath?: string): string;
/**
 * Get current framework from env
 */
export declare function getActiveFramework(): FrameworkPreset;
/**
 * List available frameworks
 */
export declare function listFrameworks(): FrameworkPreset[];
/**
 * Get framework info
 */
export declare function getFrameworkInfo(framework: FrameworkPreset): DesignFramework;
export { FRAMEWORKS, UNIVERSAL_DESIGN_PRINCIPLES };
//# sourceMappingURL=design-system.d.ts.map