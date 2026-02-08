import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './card';

const meta: Meta<typeof Card> = {
    title: 'UI/Card',
    component: Card,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'glass', 'glassmorphic', 'surface', 'elevated'],
            description: 'Visual style of the card',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        children: 'Default Card Content',
        className: 'p-6',
    },
};

export const Glass: Story = {
    args: {
        variant: 'glass',
        children: 'Glass Card with blur effect',
        className: 'p-6',
    },
};

export const Glassmorphic: Story = {
    args: {
        variant: 'glassmorphic',
        children: 'Glassmorphic Card with enhanced blur',
        className: 'p-6',
    },
};

export const Surface: Story = {
    args: {
        variant: 'surface',
        children: 'Surface Card for content areas',
        className: 'p-6',
    },
};

export const WithContent: Story = {
    render: () => (
        <Card variant="glassmorphic" className="p-6 max-w-md">
            <h3 className="text-xl font-bold mb-2">Card Title</h3>
            <p className="text-muted-foreground mb-4">
                This is a card with some example content to show how it looks with real data.
            </p>
            <button className="px-4 py-2 bg-primary text-white rounded-lg">
                Action
            </button>
        </Card>
    ),
};
