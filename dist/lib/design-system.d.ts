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
declare const UNIVERSAL_DESIGN_PRINCIPLES = "\n## \uD83C\uDFAF Universal Design Principles\n\n### Visual Hierarchy\n- Use size, weight, and color to establish clear hierarchy\n- Most important element should be most prominent\n- Limit to 3 levels of visual importance per screen\n\n### Spacing & Rhythm\n- Use consistent spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48, 64)\n- Group related items closer together\n- More space around more important elements\n\n### Typography\n- Limit to 2 font families maximum (sans + mono)\n- Use font weight and size for hierarchy, not multiple fonts\n- Line height: 1.5 for body, 1.25 for headings\n\n### Color\n- Use semantic colors (success, warning, error, info)\n- Primary color for primary actions only\n- Neutral palette for most UI chrome\n- Ensure 4.5:1 contrast ratio minimum\n\n### Accessibility (Non-Negotiable)\n- All interactive elements keyboard accessible\n- Focus states visible (2px ring, offset)\n- Color never the only indicator\n- Respect prefers-reduced-motion\n- WCAG AA compliance minimum\n\n### Responsive Design\n- Mobile-first approach\n- Touch targets minimum 44x44px\n- Fluid typography where appropriate\n- Breakpoints: 640, 768, 1024, 1280, 1536\n\n### Interaction Patterns\n- Loading states for async operations\n- Hover/focus/active states for all interactives\n- Feedback for all user actions\n- Optimistic UI where safe\n\n### Dark Mode\n- Support dark mode via class or media query\n- Test contrast in both modes\n- Avoid pure black (#000) - use near-black (#0a0a0a)\n";
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