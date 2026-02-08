import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText, SkeletonCircle } from './skeleton';

const meta: Meta<typeof Skeleton> = {
    title: 'UI/Skeleton',
    component: Skeleton,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
    args: {
        className: 'h-4 w-48',
    },
};

export const Text: Story = {
    render: () => <SkeletonText lines={3} />,
};

export const Circle: Story = {
    render: () => <SkeletonCircle size="lg" />,
};

export const Card: Story = {
    render: () => (
        <div className="p-4 space-y-4 max-w-sm">
            <div className="flex items-center space-x-4">
                <SkeletonCircle size="md" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <SkeletonText lines={3} />
        </div>
    ),
};
