/**
 * Accessibility Testing Utilities
 * 
 * Provides helpers for accessibility testing with vitest-axe.
 * All tests follow WCAG 2.1 AA guidelines.
 */

import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { axe, type AxeMatchers } from 'vitest-axe';
import type { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';

// Extend Vitest expect types
declare module 'vitest' {
    interface Assertion<T = unknown> extends AxeMatchers { }
    interface AsymmetricMatchersContaining extends AxeMatchers { }
}

/**
 * Default axe configuration for WCAG 2.1 AA compliance
 */
export const axeConfig = {
    rules: {
        // WCAG 2.1 AA required checks
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'button-name': { enabled: true },
        'image-alt': { enabled: true },
        'html-has-lang': { enabled: true },
        // Disable rules that may cause false positives in test environment
        'region': { enabled: false },
        'landmark-one-main': { enabled: false },
    },
};

/**
 * Wrapper component that provides necessary context providers
 */
function AllProviders({ children }: { children: ReactNode }) {
    return (
        <BrowserRouter>
            <AuthProvider>
                {children}
            </AuthProvider>
        </BrowserRouter>
    );
}

/**
 * Custom render function that wraps component in providers
 */
export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
    return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Render component and run axe accessibility checks
 * Returns both render result and axe results for detailed assertions
 */
export async function renderA11y(ui: ReactElement) {
    const renderResult = renderWithProviders(ui);
    const axeResults = await axe(renderResult.container, axeConfig);

    return {
        ...renderResult,
        axeResults,
    };
}

/**
 * Run axe on an already-rendered container
 */
export async function checkA11y(container: Element) {
    return axe(container, axeConfig);
}

/**
 * Common accessibility test assertions
 */
export const a11yAssertions = {
    /**
     * Assert element has accessible name
     */
    hasAccessibleName: (element: Element, name?: string) => {
        const accessibleName = element.getAttribute('aria-label') ||
            element.getAttribute('aria-labelledby') ||
            element.textContent;

        if (name) {
            expect(accessibleName).toContain(name);
        } else {
            expect(accessibleName).toBeTruthy();
        }
    },

    /**
     * Assert element is keyboard focusable
     */
    isFocusable: (element: Element) => {
        const tabIndex = element.getAttribute('tabindex');
        const isNativelyFocusable = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);

        expect(isNativelyFocusable || tabIndex === '0' || tabIndex === null).toBe(true);
    },

    /**
     * Assert form field has associated label
     */
    hasLabel: (input: Element) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        const hasLabel = !!document.querySelector(`label[for="${id}"]`);

        expect(ariaLabel || ariaLabelledby || hasLabel).toBeTruthy();
    },
};

/**
 * Test template for component accessibility
 */
export function createA11yTest(
    componentName: string,
    renderComponent: () => ReactElement
) {
    return () => {
        it(`${componentName} should have no accessibility violations`, async () => {
            const { axeResults } = await renderA11y(renderComponent());
            expect(axeResults).toHaveNoViolations();
        });
    };
}
