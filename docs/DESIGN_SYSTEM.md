# HIVE-R Studio Design System

The visual language of the HIVE-R Studio interface.

## 1. Core Identity
- **Theme**: "Neural Honeycomb" (Dark Mode Only).
- **Primary Background**: `bg-background` (`#020617` / `void-950`).
- **Accent Colors**: Electric Violet (`#7C3AED`), Honey (`#F59E0B`), Cyan (`#06B6D4`).
- **Glassmorphism**: Heavy usage of backdrop blur and semi-transparent backgrounds to create depth.

## 2. Color Palette

### Base
| Token | Tailwind Class | Hex | Usage |
|-------|----------------|-----|-------|
| Background | `bg-background` / `bg-void-950` | `#020617` | Main app background |
| Surface (Glass) | `bg-void-950/95` | `#020617` (95% op) | Cards, Sidebars, Headers |
| Border | `border-white/6` | `#FFFFFF` (6% op) | Subtle borders |

### Accents
| Name | Hex | Usage |
|------|-----|-------|
| **Electric Violet** | `#7C3AED` | Primary Actions, Active States |
| **Honey** | `#F59E0B` | Highlights, Warnings, "Neural" effects |
| **Cyan** | `#06B6D4` | Info, Data streams |
| **Plasma Green** | `#10B981` | Success, Active Agents |
| **Reactor Core** | `#EF4444` | Errors, Critical alerts |

## 3. Layout & Spacing

- **Global Layout**: `LayoutShell` component wraps all pages.
- **Padding**: Consistent `p-6 md:p-8` for main content areas.
- **Max Width**:
  - **Dashboard/Settings/Docs/Marketplace**: Constrained (previously `max-w-6xl`, now often full-width `w-full` with padding).
  - **Studio**: Full width (`constrainWidth={false}`).

## 4. Components

### Cards (Glassmorphic)
Standard container for content.
```tsx
<Card variant="glassmorphic" className="bg-void-950/95 backdrop-blur-2xl border-white/6">
  {/* content */}
</Card>
```

### Plugin Builder (Drawer)
- **Behavior**: Slides in from the right (`animate-in slide-in-from-right`).
- **Position**: `absolute inset-0 z-50` (inside Marketplace container).
- **Style**: Full height, `rounded-l-2xl`, `border-y-0 border-r-0`.
- **Backdrop**: `bg-black/5 backdrop-blur-sm` (keeps underlying content visible but blurred).

### Navigation
- **Top Nav**: `bg-void-950/95 backdrop-blur-2xl border-b border-white/6`.
- **Side Nav**: `bg-void-950/95 backdrop-blur-2xl border-r border-white/6`.
- **Icons**: Lucide React icons (Hexagon, LayoutDashboard, Puzzle, BookOpen, Settings).

### Empty States
- **Icon**: `Puzzle` (for plugins), `LayoutDashboard` (for sessions).
- **Style**: Large icon (`h-16 w-16`), opacity-20, centered text.

## 5. Typography

- **Font Family**: Inter (Sans), JetBrains Mono (Code).
- **Headings**: `tracking-tight`, `font-bold`.
- **Text Colors**:
  - Primary: `text-white`
  - Secondary: `text-starlight-400`
  - Muted: `text-starlight-500`

## 6. Icons
Consistently used icons from `lucide-react`:
- **Dashboard**: `LayoutDashboard`
- **Plugins**: `Puzzle`
- **Docs**: `BookOpen`
- **Settings**: `Settings`
- **Studio**: `Hexagon`
