/**
 * PasswordStrength Accessibility Tests
 * 
 * Tests password strength indicator for WCAG 2.1 AA compliance.
 */

import { describe, it, expect } from 'vitest';
import { renderA11y } from '../a11y-utils';
import { PasswordStrength } from '../../src/components/PasswordStrength';

describe('PasswordStrength Accessibility', () => {
    it('should have no accessibility violations with weak password', async () => {
        const { axeResults } = await renderA11y(<PasswordStrength password="abc" />);
        expect(axeResults).toHaveNoViolations();
    });

    it('should have no accessibility violations with strong password', async () => {
        const { axeResults } = await renderA11y(<PasswordStrength password="SecureP@ss123" />);
        expect(axeResults).toHaveNoViolations();
    });

    it('should not render when password is empty', async () => {
        const { container } = await renderA11y(<PasswordStrength password="" />);
        expect(container.textContent).toBe('');
    });

    it('should display strength text', async () => {
        const { getByText } = await renderA11y(<PasswordStrength password="abc" />);
        expect(getByText(/weak password/i)).toBeInTheDocument();
    });

    it('should display requirements list', async () => {
        const { container } = await renderA11y(<PasswordStrength password="test" showRequirements />);
        const listItems = container.querySelectorAll('li');
        expect(listItems.length).toBeGreaterThan(0);
    });

    it('should use semantic list for requirements', async () => {
        const { container } = await renderA11y(<PasswordStrength password="test" showRequirements />);
        const list = container.querySelector('ul');
        expect(list).toBeInTheDocument();
    });

    it('should indicate met requirements with visual cues', async () => {
        const { container } = await renderA11y(<PasswordStrength password="TestPassword1!" />);
        // Check that met requirements have different styling (green text)
        const metItems = container.querySelectorAll('.text-emerald-400');
        expect(metItems.length).toBeGreaterThan(0);
    });
});
