# HIVE-R Design System

Glassmorphic design system with accessibility-first components.

## Quick Start

```bash
# Run Storybook
npm run storybook

# Build static Storybook
npm run build-storybook
```

## Usage

```tsx
import { Button, Card, Input, Badge } from '@/components/ui';

function Example() {
    return (
        <Card variant="glassmorphic" className="p-6">
            <Input placeholder="Email" />
            <Button variant="gradient">Submit</Button>
        </Card>
    );
}
```

## Design Tokens

All design values in `tokens.ts`:

- **Colors**: Primary (indigo), semantic (success, error, warning)
- **Spacing**: 4px grid system (1=4px, 2=8px, 4=16px, etc.)
- **Typography**: Inter font, 12-36px scale
- **Shadows**: sm, md, lg, glass, glow
- **Border Radius**: sm, md, lg, xl, full

## Components

| Component | Variants |
|-----------|----------|
| Button | default, secondary, ghost, destructive, gradient, honey, glass |
| Card | default, glass, glassmorphic, surface, elevated |
| Badge | default, secondary, success, warning, error, outline |
| Input | text, email, password, number, search |
| Skeleton | default, text, circle |
| Progress | determinate, indeterminate |

## Accessibility

All components include:
- Keyboard navigation
- ARIA attributes
- Focus indicators
- Color contrast (WCAG AA)
