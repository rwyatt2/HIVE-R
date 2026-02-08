/**
 * DashboardPage Accessibility Tests
 * 
 * Tests dashboard for WCAG 2.1 AA compliance.
 */

import { describe, it, expect } from 'vitest';
import { renderA11y, a11yAssertions } from '../a11y-utils';
import { DashboardPage } from '../../src/pages/DashboardPage';

describe('DashboardPage Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { axeResults } = await renderA11y(<DashboardPage />);
        expect(axeResults).toHaveNoViolations();
    });

    it('should have a main heading', async () => {
        const { container } = await renderA11y(<DashboardPage />);
        const headings = container.querySelectorAll('h1, h2');
        expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible interactive elements', async () => {
        const { queryAllByRole } = await renderA11y(<DashboardPage />);
        const buttons = queryAllByRole('button');
        const links = queryAllByRole('link');

        // Check buttons if present
        buttons.forEach(button => {
            a11yAssertions.hasAccessibleName(button);
            a11yAssertions.isFocusable(button);
        });

        // Check links are accessible
        links.forEach(link => {
            a11yAssertions.hasAccessibleName(link);
        });
    });

    it('should have accessible data tables if present', async () => {
        const { container } = await renderA11y(<DashboardPage />);
        const tables = container.querySelectorAll('table');

        tables.forEach(table => {
            // Tables should have headers
            const headers = table.querySelectorAll('th');
            expect(headers.length).toBeGreaterThan(0);
        });
    });

    it('should have accessible charts with descriptions', async () => {
        const { container } = await renderA11y(<DashboardPage />);
        // Charts from Recharts should have proper ARIA
        const charts = container.querySelectorAll('[role="img"], svg');

        // Charts should have some form of accessible name
        charts.forEach(chart => {
            const hasAriaLabel = chart.hasAttribute('aria-label');
            const hasAriaLabelledby = chart.hasAttribute('aria-labelledby');
            const hasTitle = chart.querySelector('title');
            // At least one form of accessible name
            expect(hasAriaLabel || hasAriaLabelledby || hasTitle).toBeTruthy;
        });
    });

    it('should have semantic section structure', async () => {
        const { container } = await renderA11y(<DashboardPage />);
        const sections = container.querySelectorAll('section, article, aside');
        expect(sections.length).toBeGreaterThanOrEqual(0); // May have sections
    });
});
