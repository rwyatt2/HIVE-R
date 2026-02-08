import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './card';

describe('Card', () => {
    it('renders children', () => {
        render(<Card>Card content</Card>);
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<Card className="my-custom-class">Content</Card>);
        const card = screen.getByText('Content').closest('div');
        expect(card).toHaveClass('my-custom-class');
    });

    it('renders with default variant', () => {
        render(<Card>Default card</Card>);
        expect(screen.getByText('Default card')).toBeInTheDocument();
    });

    it('renders with glass variant', () => {
        render(<Card variant="glass">Glass card</Card>);
        expect(screen.getByText('Glass card')).toBeInTheDocument();
    });

    it('renders with glassmorphic variant', () => {
        render(<Card variant="glassmorphic">Glassmorphic card</Card>);
        expect(screen.getByText('Glassmorphic card')).toBeInTheDocument();
    });
});
