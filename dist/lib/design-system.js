import { readFileSync, existsSync } from "fs";
import { join } from "path";
// ============================================================================
// WORLD-CLASS DESIGN PRINCIPLES (Loaded from PRINCIPLES.md)
// ============================================================================
function loadPrinciples() {
    const principlesPath = join(__dirname, "../../design-systems/PRINCIPLES.md");
    if (existsSync(principlesPath)) {
        return readFileSync(principlesPath, "utf-8");
    }
    // Fallback if file not found
    return `
## 🎯 Design Principles

See design-systems/PRINCIPLES.md for comprehensive guidelines.
Covering: Performance, Hierarchy, Typography, Color, Motion, Accessibility, Forms, Errors, Navigation, Content, Mobile, Data Display, i18n, Security UX, and Component Patterns.
`;
}
const UNIVERSAL_DESIGN_PRINCIPLES = loadPrinciples();
// ============================================================================
// FRAMEWORK PRESETS
// ============================================================================
const FRAMEWORKS = {
    tailwind: {
        name: "Tailwind CSS",
        framework: "tailwind",
        description: "Utility-first CSS framework",
        installCommand: "npm install tailwindcss postcss autoprefixer && npx tailwindcss init -p",
        principles: [
            "Utility-first approach - compose styles from utility classes",
            "Use @apply sparingly - only for frequently repeated patterns",
            "Leverage Tailwind's color palette (slate, zinc, neutral, stone)",
            "Use arbitrary values sparingly - prefer design tokens",
        ],
        bestPractices: `
### Tailwind Best Practices

**Component Structure**
\`\`\`tsx
<button className="
  inline-flex items-center justify-center
  px-4 py-2 rounded-md
  bg-blue-600 text-white font-medium
  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:opacity-50 disabled:pointer-events-none
  transition-colors
">
  Button
</button>
\`\`\`

**Class Order Convention**
1. Layout (flex, grid, position)
2. Sizing (w, h, p, m)
3. Typography (text, font)
4. Colors (bg, text, border)
5. Effects (shadow, opacity)
6. States (hover, focus, disabled)
7. Transitions

**Dark Mode**
Use \`dark:\` variant: \`bg-white dark:bg-zinc-900\`

**Responsive**
Mobile-first with breakpoint prefixes: \`md:flex lg:grid\`
`,
    },
    shadcn: {
        name: "shadcn/ui",
        framework: "shadcn",
        description: "Beautifully designed components built with Radix + Tailwind",
        installCommand: "npx shadcn@latest init",
        principles: [
            "Copy-paste components - own your code",
            "Built on Radix primitives for accessibility",
            "Use CSS variables for theming",
            "Compose from primitive components",
        ],
        bestPractices: `
### shadcn/ui Best Practices

**Theme Variables** (globals.css)
\`\`\`css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
\`\`\`

**Component Usage**
\`\`\`tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="md">Click me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Danger</Button>
\`\`\`

**Adding Components**
\`\`\`bash
npx shadcn@latest add button card dialog
\`\`\`

**Theming**
Modify CSS variables in globals.css for instant theme changes.
Components automatically adapt to light/dark mode.
`,
    },
    chakra: {
        name: "Chakra UI",
        framework: "chakra",
        description: "Simple, modular and accessible component library",
        installCommand: "npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion",
        principles: [
            "Use theme tokens via props - not inline styles",
            "Leverage the style props API consistently",
            "Use Chakra's built-in responsive array syntax",
            "Extend theme for custom branding",
        ],
        bestPractices: `
### Chakra UI Best Practices

**Style Props**
\`\`\`tsx
<Box 
  p={4}
  bg="gray.100"
  borderRadius="md"
  _hover={{ bg: "gray.200" }}
  _dark={{ bg: "gray.800" }}
>
  Content
</Box>
\`\`\`

**Responsive Values**
\`\`\`tsx
<Box fontSize={["sm", "md", "lg"]} p={[2, 4, 6]}>
  Responsive text
</Box>
\`\`\`

**Theme Extension**
\`\`\`tsx
const theme = extendTheme({
  colors: {
    brand: {
      500: "#your-color",
    },
  },
});
\`\`\`

**Components**
Use semantic components: Box, Flex, Stack, Grid, Container
`,
    },
    mui: {
        name: "Material UI",
        framework: "mui",
        description: "React components implementing Material Design",
        installCommand: "npm install @mui/material @emotion/react @emotion/styled",
        principles: [
            "Use the sx prop for one-off styling",
            "Use styled() for reusable styled components",
            "Leverage theme.spacing() for consistent spacing",
            "Use Material Design patterns correctly",
        ],
        bestPractices: `
### Material UI Best Practices

**sx Prop**
\`\`\`tsx
<Box sx={{ 
  p: 2, 
  bgcolor: 'background.paper',
  borderRadius: 1,
  '&:hover': { bgcolor: 'action.hover' }
}}>
  Content
</Box>
\`\`\`

**Theme**
\`\`\`tsx
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});
\`\`\`

**Component Variants**
\`\`\`tsx
<Button variant="contained">Primary</Button>
<Button variant="outlined">Secondary</Button>
<Button variant="text">Tertiary</Button>
\`\`\`

**Grid System**
Use Grid2 for layouts with consistent gutters.
`,
    },
    radix: {
        name: "Radix Primitives",
        framework: "radix",
        description: "Unstyled, accessible components for building design systems",
        installCommand: "npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu",
        principles: [
            "Radix handles behavior and accessibility - you handle styling",
            "Use data attributes for styling states",
            "Compose primitives for complex components",
            "Pair with Tailwind or CSS Modules",
        ],
        bestPractices: `
### Radix Best Practices

**Styling with Data Attributes**
\`\`\`css
[data-state="open"] {
  animation: fadeIn 200ms ease;
}

[data-highlighted] {
  background-color: var(--gray-100);
}
\`\`\`

**Structure**
\`\`\`tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="overlay" />
    <Dialog.Content className="content">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
\`\`\`

**Accessibility**
Already handled - focus trapping, keyboard nav, ARIA attributes.
`,
    },
    ant: {
        name: "Ant Design",
        framework: "ant",
        description: "Enterprise-class UI design language",
        installCommand: "npm install antd",
        principles: [
            "Use ConfigProvider for global theming",
            "Follow Ant's spacing and layout conventions",
            "Use Form component for complex forms",
            "Leverage built-in icons and patterns",
        ],
        bestPractices: `
### Ant Design Best Practices

**Theme Customization**
\`\`\`tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
  }}
>
  <App />
</ConfigProvider>
\`\`\`

**Forms**
\`\`\`tsx
<Form layout="vertical" onFinish={onSubmit}>
  <Form.Item name="email" label="Email" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Button type="primary" htmlType="submit">Submit</Button>
</Form>
\`\`\`

**Tables**
Use Table component with columns definition for data grids.
`,
    },
    bootstrap: {
        name: "Bootstrap 5",
        framework: "bootstrap",
        description: "Popular CSS framework for responsive design",
        installCommand: "npm install bootstrap react-bootstrap",
        principles: [
            "Use Bootstrap's grid system for layouts",
            "Leverage utility classes for spacing and sizing",
            "Use CSS variables for customization",
            "Prefer React-Bootstrap components",
        ],
        bestPractices: `
### Bootstrap Best Practices

**Grid**
\`\`\`tsx
<Container>
  <Row>
    <Col md={6}>Left</Col>
    <Col md={6}>Right</Col>
  </Row>
</Container>
\`\`\`

**Components**
\`\`\`tsx
<Button variant="primary">Primary</Button>
<Button variant="outline-primary">Outline</Button>
\`\`\`

**Customization**
Use SCSS variables or CSS custom properties.
`,
    },
    custom: {
        name: "Custom CSS",
        framework: "custom",
        description: "Vanilla CSS or custom solution",
        installCommand: "N/A",
        principles: [
            "Use CSS custom properties for theming",
            "Follow BEM or similar naming convention",
            "Use CSS Grid and Flexbox for layouts",
            "Minimize specificity conflicts",
        ],
        bestPractices: `
### Custom CSS Best Practices

**CSS Variables**
\`\`\`css
:root {
  --color-primary: #3b82f6;
  --spacing-base: 0.25rem;
  --radius-md: 0.5rem;
}
\`\`\`

**BEM Naming**
\`\`\`css
.card { }
.card__header { }
.card__body { }
.card--featured { }
\`\`\`

**Modern Layout**
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);
}
\`\`\`
`,
    },
};
/**
 * Get full design context for agents
 */
export function getDesignContext(framework = "tailwind", tokensPath) {
    const fw = FRAMEWORKS[framework];
    // Try to load custom tokens
    let tokenContext = "";
    if (tokensPath || process.env.HIVE_DESIGN_TOKENS) {
        const path = tokensPath || process.env.HIVE_DESIGN_TOKENS;
        try {
            // Dynamic import to avoid circular dependency
            const { loadTokens, formatTokensForPrompt } = require("./token-mapper.js");
            const tokens = loadTokens(path);
            if (tokens) {
                tokenContext = formatTokensForPrompt(tokens, framework);
            }
        }
        catch (e) {
            console.warn("⚠️ Could not load token mapper:", e);
        }
    }
    return `
# Design Framework: ${fw.name}

${fw.description}

## Install
\`\`\`bash
${fw.installCommand}
\`\`\`

## Framework Principles
${fw.principles.map(p => `- ${p}`).join("\n")}

${fw.bestPractices}

${tokenContext}

${UNIVERSAL_DESIGN_PRINCIPLES}
`;
}
/**
 * Get current framework from env
 */
export function getActiveFramework() {
    const fw = process.env.HIVE_DESIGN_FRAMEWORK;
    return FRAMEWORKS[fw] ? fw : "tailwind";
}
/**
 * List available frameworks
 */
export function listFrameworks() {
    return Object.keys(FRAMEWORKS);
}
/**
 * Get framework info
 */
export function getFrameworkInfo(framework) {
    return FRAMEWORKS[framework];
}
export { FRAMEWORKS, UNIVERSAL_DESIGN_PRINCIPLES };
//# sourceMappingURL=design-system.js.map