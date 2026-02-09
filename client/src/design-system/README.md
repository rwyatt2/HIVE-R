# HIVE-R Design System (Implementation)

Implementation details for the "Neural Glass" design system.

For high-level standards and guidelines, see [**docs/DESIGN_SYSTEM.md**](../../../docs/DESIGN_SYSTEM.md).

## Usage

```tsx
import { Button, Card, Input, Badge } from '@/components/ui';

function Example() {
    return (
        <Card variant="glassmorphic" className="p-6">
            <Input placeholder="Email" />
            <Button variant="honey">Deploy Agent</Button>
        </Card>
    );
}
```

## Core Tokens (Tailwind)

- **Colors**:
  - `void-950` (#020617) - Main Background
  - `electric-violet-600` (#7C3AED) - Primary Brand
  - `honey-500` (#F59E0B) - Secondary/Accent
- **Spacing**: 4px grid system.
- **Typography**: Inter (UI) and JetBrains Mono (Code).

## Components

| Component | Variants |
|-----------|----------|
| **Button** | `default`, `secondary`, `ghost`, `destructive`, `outline`, `link`, `gradient`, `honey`, `glass` |
| **Card** | `default`, `glass` (legacy), `glassmorphic` (standard), `agent`, `metric` |
| **Badge** | `default`, `secondary`, `success`, `warning`, `error`, `outline` |
| **LayoutShell**| Wraps all pages. Use `constrainWidth={false}` for full-width. |

## Accessibility

- All interactive elements must have a minimum touch target of 44px.
- Use `aria-label` for icon-only buttons.
- Ensure text contrast meets WCAG AA standards (automatically handled by `starlight-400` on `void-950`).
