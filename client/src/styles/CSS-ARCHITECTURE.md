# CSS Architecture

## Structure

```
styles/
├── base/
│   ├── variables.css    # CSS custom properties
│   └── reset.css        # Minimal reset
├── utilities/
│   ├── spacing.css      # Margin/padding/gap
│   └── display.css      # Flex/grid/position
├── components/
│   └── card.css         # BEM components
└── responsive.css       # Responsive utilities
```

## Naming: BEM

```css
.block { }              /* Component */
.block__element { }     /* Child element */
.block--modifier { }    /* Variation */
```

**Example:**
```css
.card { }
.card__header { }
.card__title { }
.card--compact { }
```

## Custom Properties

Always use variables:

```css
/* ✅ Good */
padding: var(--spacing-4);
color: var(--color-text-primary);

/* ❌ Bad */
padding: 1rem;
color: #f1f5f9;
```

## Utilities

Common patterns as single-purpose classes:

```html
<div class="flex items-center gap-4 p-4">
    <div class="flex-1">...</div>
</div>
```
