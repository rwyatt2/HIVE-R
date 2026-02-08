import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
    it('renders with placeholder', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('handles value changes', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalled();
    });

    it('can be disabled', () => {
        render(<Input disabled placeholder="Disabled" />);
        expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('renders different types', () => {
        const { rerender } = render(<Input type="email" placeholder="Email" />);
        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

        rerender(<Input type="password" placeholder="Password" />);
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    });

    it('applies custom className', () => {
        render(<Input className="my-input" placeholder="Custom" />);
        expect(screen.getByPlaceholderText('Custom')).toHaveClass('my-input');
    });
});
