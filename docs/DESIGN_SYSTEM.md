# Design Frameworks in HIVE-R

Quick framework switching + custom tokens = consistent UI.

## Switch Frameworks

```bash
HIVE_DESIGN_FRAMEWORK=tailwind npm run dev   # default
HIVE_DESIGN_FRAMEWORK=shadcn npm run dev
HIVE_DESIGN_FRAMEWORK=chakra npm run dev
HIVE_DESIGN_FRAMEWORK=mui npm run dev
```

## Custom Tokens (The Easy Way)

**1. Copy the template:**
```bash
cp design-systems/tokens.example.json my-tokens.json
```

**2. Edit your brand:**
```json
{
  "brand": "My App",
  "colors": {
    "primary": "#your-color",
    "background": "#ffffff",
    "foreground": "#0f172a"
  },
  "typography": {
    "fontFamily": "Inter, system-ui"
  }
}
```

**3. Use it:**
```bash
HIVE_DESIGN_TOKENS=./my-tokens.json npm run dev
```

Agents will generate framework-specific config from your tokens!

## What Gets Generated

| Framework | Output |
|-----------|--------|
| Tailwind | `tailwind.config.js` + CSS variables |
| shadcn | CSS variables in `globals.css` |
| Chakra | Theme extension |
| MUI | `createTheme()` config |

## Token Schema

```json
{
  "brand": "App Name",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "background": "#hex",
    "foreground": "#hex"
  },
  "darkColors": {
    "background": "#hex",
    "foreground": "#hex"
  },
  "typography": {
    "fontFamily": "Font, fallback",
    "fontMono": "Mono, monospace"
  },
  "radius": {
    "sm": "0.25rem",
    "md": "0.5rem"
  }
}
```
