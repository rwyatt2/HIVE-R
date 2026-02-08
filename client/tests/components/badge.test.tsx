import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
    it('renders with text', () => {
        render(<Badge>Status</Badge>);
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders default variant', () => {
        render(<Badge>Default</Badge>);
        expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('renders secondary variant', () => {
        render(<Badge variant="secondary">Secondary</Badge>);
        expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('renders success variant', () => {
        render(<Badge variant="success">Success</Badge>);
        expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
        render(<Badge variant="warning">Warning</Badge>);
        expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders error variant', () => {
        render(<Badge variant="error">Error</Badge>);
        expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
});
