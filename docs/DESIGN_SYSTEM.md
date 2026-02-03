# Design Frameworks & Tokens

HIVE-R enforces world-class design principles while letting you bring your own tokens.

## Quick Start

```bash
# Default (Tailwind)
npm run dev

# With Custom Tokens
HIVE_DESIGN_TOKENS=./my-tokens.json npm run dev

# Switch Framework
HIVE_DESIGN_FRAMEWORK=chakra npm run dev
```

## 🌍 World-Class Principles (Built-in)

Every agent automatically follows these 8 core pillars:

1.  **Core Experience**: Speed (<100ms), Fitts's Law, Feedback Loops.
2.  **Visual Hierarchy**: 3 distinct levels, 4px grid rhythm.
3.  **Typography**: Harmonious scales, readable line lengths (50-75 chars).
4.  **Color**: 60-30-10 rule, semantic naming, accessible contrast.
5.  **Interaction**: Physics-based motion, optimistic UI.
6.  **Accessibility**: WCAG AA, focus management, semantic HTML.
7.  **Content**: F-pattern scanning, front-loaded keywords.
8.  **Engineering**: Component-driven, token-first implementation.

## 🎨 Design Tokens

Your `tokens.json` drives the entire UI. HIVE-R supports a comprehensive schema:

```json
{
  "brand": "My App",
  "colors": {
    "primitives": { ... }, // Base palettes (slate, blue, etc)
    "semantic": {
      "primary": { "default": "$colors.primitives.blue.600" },
      "status": { "success": "..." }
    }
  },
  "typography": { "scale": { "base": "1rem" }, "weights": ... },
  "spacing": { "base": 4, "scale": ... },
  "layout": { "breakpoints": ..., "zIndices": ... },
  "animation": { "duration": ..., "easing": ... }
}
```

### Full Example
See [`design-systems/tokens.example.json`](../design-systems/tokens.example.json) for the complete schema.

## Frameworks Supported

| Framework | Best For |
|-----------|----------|
| `tailwind` | Utility-first, rapid prototyping |
| `shadcn` | Beautiful accessible components |
| `chakra` | Simple modular components |
| `mui` | Material Design, enterprise |
| `radix` | Headless primitives |
| `ant` | Enterprise dashboards |
| `bootstrap` | Quick responsive layouts |
