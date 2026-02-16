# HIVE-R Design System (Enterprise Minimal)

## 1. Overview
HIVE-R uses a clean, typography-driven design system inspired by Vercel, Anthropic, and Linear. The aesthetic prioritizes function, readability, and speed over decorative elements.

**Core Values:**
- **Minimalism:** Remove unnecessary borders, glows, and gradients.
- **Clarity:** Use typography (weight and size) to establish hierarchy.
- **Performance:** CSS-first effects, no heavy canvas animations on the landing page.
- **Consistency:** Unified spacing, radius, and color tokens.

## 2. Color Palette
The system relies on a "Zinc" scale (neutral grays with a slight cool tint) for a professional look.

### Dark Mode (Default)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-background` | `#09090b` | Main page background (Zinc 950) |
| `bg-secondary` | `#27272a` | Secondary surfaces, hover states (Zinc 800) |
| `bg-card` | `#09090b` | Card backgrounds (same as background for seamless look) |
| `text-foreground` | `#fafafa` | Primary text (Zinc 50) |
| `text-muted-foreground` | `#a1a1aa` | Secondary text (Zinc 400) |
| `border-border` | `#27272a` | Subtle borders (Zinc 800) |

### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-background` | `#ffffff` | Main page background |
| `bg-secondary` | `#f4f4f5` | Secondary surfaces (Zinc 100) |
| `text-foreground` | `#09090b` | Primary text |
| `border-border` | `#e4e4e7` | Subtle borders (Zinc 200) |

## 3. Typography
- **Headings:** `Inter` (sans-serif), tracking-tight, bold weights.
- **Body:** `Inter`, comfortable line-height (1.6).
- **Code:** `JetBrains Mono`, accessible size (14px).

## 4. Components

### Cards
Cards are minimalist containers with a thin border and no heavy drop shadow in dark mode.
```tsx
<Card className="bg-background border-border">
  <CardHeader>
    <CardTitle>Project Settings</CardTitle>
    <CardDescription>Manage your deployment keys.</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Buttons
Buttons use solid colors without gradients.
- **Primary:** White text on black (light mode) / Black text on white (dark mode).
- **Secondary:** Gray background with hover state.
- **Outline:** Transparent with border.
- **Ghost:** Transparent with hover background.

```tsx
<Button>Deploy</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Docs</Button>
```

### Layout
- **Sidebar:** Fixed width (280px), collapsible (80px). Background matches `bg-background` with a border-right.
- **TopNav:** Sticky, backdrop-blur-xl, border-bottom.
- **Shell:** `max-w-7xl` centered container for content.

## 5. Visual Effects
- **Grid Pattern:** A subtle dot or line grid is used for backgrounds to add texture without noise.
- **Glassmorphism:** Used sparingly on sticky headers (`backdrop-blur-xl`), but less intense than previous iterations.

## 6. Icons
Lucide React icons are used throughout.
- Stroke width: 1.5px (standard) or 2px (small sizes).
- Color: `text-muted-foreground` by default, `text-foreground` on active/hover.
