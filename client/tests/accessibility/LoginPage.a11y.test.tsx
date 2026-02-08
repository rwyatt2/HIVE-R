/**
 * LoginPage Accessibility Tests
 * 
 * Tests authentication forms for WCAG 2.1 AA compliance.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderA11y, a11yAssertions } from '../a11y-utils';
import { LoginPage } from '../../src/components/LoginPage';

describe('LoginPage Accessibility', () => {
    const mockOnSuccess = vi.fn();

    it('should have no accessibility violations', async () => {
        const { axeResults } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        expect(axeResults).toHaveNoViolations();
    });

    it('should have accessible form structure', async () => {
        const { container } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        const form = container.querySelector('form');
        expect(form).toBeInTheDocument();
    });

    it('should have accessible email input', async () => {
        const { getByPlaceholderText } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        const emailInput = getByPlaceholderText(/email/i);

        expect(emailInput).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('type', 'email');
        a11yAssertions.isFocusable(emailInput);
    });

    it('should have accessible password input', async () => {
        const { getByPlaceholderText } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        const passwordInput = getByPlaceholderText(/password/i);

        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute('type', 'password');
        a11yAssertions.isFocusable(passwordInput);
    });

    it('should have accessible submit button', async () => {
        const { getByRole } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        const submitButton = getByRole('button', { name: /sign in|create account/i });

        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toHaveAttribute('type', 'submit');
        a11yAssertions.isFocusable(submitButton);
    });

    it('should have accessible toggle between login and register', async () => {
        const { getByRole } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        const toggleButton = getByRole('button', { name: /don't have an account|already have an account/i });

        expect(toggleButton).toBeInTheDocument();
        a11yAssertions.isFocusable(toggleButton);
    });

    it('should have accessible forgot password link', async () => {
        const { getByRole } = await renderA11y(<LoginPage onSuccess={mockOnSuccess} />);
        const forgotLink = getByRole('link', { name: /forgot password/i });

        expect(forgotLink).toBeInTheDocument();
        a11yAssertions.isFocusable(forgotLink);
    });
});
