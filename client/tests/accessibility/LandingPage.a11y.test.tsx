/**
 * LandingPage Accessibility Tests
 * 
 * Tests main landing page for WCAG 2.1 AA compliance.
 */

import { describe, it, expect } from 'vitest';
import { renderA11y, a11yAssertions } from '../a11y-utils';
import { LandingPage } from '../../src/pages/LandingPage';

describe('LandingPage Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { axeResults } = await renderA11y(<LandingPage />);
        expect(axeResults).toHaveNoViolations();
    });

    it('should have a main heading (h1)', async () => {
        const { getByRole } = await renderA11y(<LandingPage />);
        const heading = getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
    });

    it('should have accessible CTA buttons or links', async () => {
        const { queryAllByRole } = await renderA11y(<LandingPage />);
        const buttons = queryAllByRole('button');
        const links = queryAllByRole('link');

        // Check buttons if present
        buttons.forEach(button => {
            a11yAssertions.hasAccessibleName(button);
            a11yAssertions.isFocusable(button);
        });

        // Check links (CTA links should also be accessible)
        links.forEach(link => {
            a11yAssertions.hasAccessibleName(link);
        });

        // Should have at least some interactive elements
        expect(buttons.length + links.length).toBeGreaterThan(0);
    });

    it('should have accessible links', async () => {
        const { getAllByRole } = await renderA11y(<LandingPage />);
        const links = getAllByRole('link');

        links.forEach(link => {
            a11yAssertions.hasAccessibleName(link);
        });
    });

    it('should use semantic heading hierarchy', async () => {
        const { container } = await renderA11y(<LandingPage />);

        // Check that headings follow proper hierarchy
        const h1s = container.querySelectorAll('h1');
        const h2s = container.querySelectorAll('h2');

        expect(h1s.length).toBe(1); // Only one h1
        expect(h2s.length).toBeGreaterThan(0); // Should have section headings
    });

    it('should have accessible images with alt text', async () => {
        const { container } = await renderA11y(<LandingPage />);
        const images = container.querySelectorAll('img');

        images.forEach(img => {
            expect(img).toHaveAttribute('alt');
        });
    });

    it('should have section landmarks', async () => {
        const { container } = await renderA11y(<LandingPage />);
        const sections = container.querySelectorAll('section');
        expect(sections.length).toBeGreaterThan(0);
    });
});
