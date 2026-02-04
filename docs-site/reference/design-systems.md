# Design Systems

HIVE-R agents can work with design tokens to ensure consistent styling.

## Using Design Tokens

Pass design tokens in your prompt:

```
Use the following design tokens:
- Primary: #6366f1
- Background: #0a0a1a
- Border radius: 12px
- Font: Inter

Build a button component following these tokens.
```

## Default Design System

When no tokens are provided, agents use a default system:

### Colors

```css
:root {
  /* Backgrounds */
  --bg-dark: #0a0a1a;
  --bg-panel: #12122a;
  --bg-card: #1a1a3e;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Accent */
  --accent: #6366f1;
  --accent-light: #818cf8;
  
  /* Status */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
}
```

### Spacing

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

### Typography

```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
}
```

### Border Radius

```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

## Custom Design Systems

### Upload a Design System

You can reference a design system file:

```
Use the design system from:
- Colors: design-systems/colors.json
- Typography: design-systems/typography.json

Build a card component.
```

### Example Design System File

```json
{
  "name": "MyApp",
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px"
  }
}
```

## Referencing UI Libraries

Tell agents which library to use:

```
Build with shadcn/ui components:
- Use Card for containers
- Use Button for actions
- Follow the default dark theme
```

Supported references:
- Tailwind CSS
- shadcn/ui
- Radix UI
- Material UI
- Chakra UI
