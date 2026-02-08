/**
 * Contrast Checker Utility
 * 
 * Check color contrast ratios for WCAG compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContrastResult {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
    level: 'normal' | 'large';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1] ?? '0', 16),
        g: parseInt(result[2] ?? '0', 16),
        b: parseInt(result[3] ?? '0', 16),
    } : null;
}

function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }) as [number, number, number];
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ─── Main Function ──────────────────────────────────────────────────────────

export function getContrastRatio(foreground: string, bgnd: string): number {
    const fg = hexToRgb(foreground);
    const bg = hexToRgb(bgnd);

    if (!fg || !bg) return 0;

    const l1 = getLuminance(fg.r, fg.g, fg.b);
    const l2 = getLuminance(bg.r, bg.g, bg.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(
    foreground: string,
    background: string,
    isLargeText = false
): ContrastResult {
    const ratio = getContrastRatio(foreground, background);

    // WCAG AA: 4.5:1 normal, 3:1 large
    // WCAG AAA: 7:1 normal, 4.5:1 large
    const minAA = isLargeText ? 3 : 4.5;
    const minAAA = isLargeText ? 4.5 : 7;

    return {
        ratio,
        passesAA: ratio >= minAA,
        passesAAA: ratio >= minAAA,
        level: isLargeText ? 'large' : 'normal',
    };
}

// ─── Audit Function ─────────────────────────────────────────────────────────

export function auditColorPalette(): Array<{
    name: string;
    ratio: string;
    passesAA: boolean;
}> {
    const darkBg = '#0f172a';

    const tests = [
        { fg: '#f1f5f9', name: 'Primary text' },
        { fg: '#cbd5e1', name: 'Secondary text' },
        { fg: '#94a3b8', name: 'Tertiary text' },
        { fg: '#6366f1', name: 'Primary brand' },
        { fg: '#10b981', name: 'Success' },
        { fg: '#ef4444', name: 'Error' },
        { fg: '#f59e0b', name: 'Warning' },
        { fg: '#3b82f6', name: 'Info' },
    ];

    return tests.map(({ fg, name }) => {
        const result = checkContrast(fg, darkBg);
        return {
            name,
            ratio: result.ratio.toFixed(2) + ':1',
            passesAA: result.passesAA,
        };
    });
}

export default checkContrast;
