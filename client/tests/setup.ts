/**
 * Vitest Test Setup
 * 
 * Configures testing environment with:
 * - DOM matchers from @testing-library/jest-dom
 * - Axe accessibility matchers from vitest-axe
 */

import '@testing-library/jest-dom/vitest';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect with axe matchers
expect.extend(matchers);

// Mock window.matchMedia for components using media queries
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords() { return []; }
} as unknown as typeof IntersectionObserver;
