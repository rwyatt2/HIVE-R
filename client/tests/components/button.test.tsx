import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
    it('renders with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick} disabled>Click me</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders all variants', () => {
        const variants = ['default', 'secondary', 'ghost', 'destructive'] as const;

        for (const variant of variants) {
            const { unmount } = render(<Button variant={variant}>Test</Button>);
            expect(screen.getByRole('button')).toBeInTheDocument();
            unmount();
        }
    });

    it('renders all sizes', () => {
        const sizes = ['default', 'sm', 'lg', 'icon'] as const;

        for (const size of sizes) {
            const { unmount } = render(<Button size={size}>Test</Button>);
            expect(screen.getByRole('button')).toBeInTheDocument();
            unmount();
        }
    });

    it('can render as a child component with asChild', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        );
        expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument();
    });
});
