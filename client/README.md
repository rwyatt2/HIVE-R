# HIVE-R Studio Frontend

The visual interface for the HIVE-R autonomous agent swarm.

## Tech Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Animation**: Framer Motion
- **State/Graph**: React Flow
- **Icons**: Lucide React

## Visual Identity: "Neural Glass"

The application uses a consistent dark-mode aesthetic characterized by:
- **Background**: Deep Void (`bg-void-950` / `#020617`).
- **Surfaces**: Glassmorphism (`bg-void-950/95` + `backdrop-blur-2xl`).
- **Borders**: Subtle white borders (`border-white/6`).
- **Accents**: Electric Violet (`#7C3AED`) and Honey (`#F59E0B`).

## Project Structure

```bash
client/
├── src/
│   ├── components/
│   │   ├── ui/          # Core atoms (Button, Card, Input)
│   │   ├── layout/      # LayoutShell, SideNav, TopNav
│   │   ├── Plugin.../   # Marketplace & Builder features
│   │   └── Neural.../   # "Neural Honeycomb" visualizations
│   ├── pages/           # Route components (Dashboard, Studio, etc.)
│   └── lib/             # Utilities and helpers
```

## Documentation
See [**Design System**](../docs/DESIGN_SYSTEM.md) for detailed UI standards.
