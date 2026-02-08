/**
 * NavBar Accessibility Tests
 * 
 * Tests navigation component for WCAG 2.1 AA compliance.
 */

import { describe, it, expect } from 'vitest';
import { renderA11y, a11yAssertions } from '../a11y-utils';
import { NavBar } from '../../src/components/NavBar';

describe('NavBar Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { axeResults } = await renderA11y(<NavBar />);
        expect(axeResults).toHaveNoViolations();
    });

    it('should have accessible navigation landmark', async () => {
        const { container } = await renderA11y(<NavBar />);
        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();
    });

    it('should have accessible logo link', async () => {
        const { getByRole } = await renderA11y(<NavBar />);
        const homeLink = getByRole('link', { name: /hive/i });
        expect(homeLink).toBeInTheDocument();
        a11yAssertions.isFocusable(homeLink);
    });

    it('should have accessible navigation links', async () => {
        const { getAllByRole } = await renderA11y(<NavBar />);
        const links = getAllByRole('link');

        links.forEach(link => {
            a11yAssertions.hasAccessibleName(link);
            a11yAssertions.isFocusable(link);
        });
    });

    it('should have accessible mobile menu button', async () => {
        const { container } = await renderA11y(<NavBar />);
        const menuButton = container.querySelector('button[aria-label]');

        if (menuButton) {
            expect(menuButton).toHaveAttribute('aria-label');
            a11yAssertions.isFocusable(menuButton);
        }
    });
});
