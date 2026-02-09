# 🐝 HIVE-R

[![CI - Test](https://github.com/rwyatt2/HIVE-R/actions/workflows/ci-test.yml/badge.svg)](https://github.com/rwyatt2/HIVE-R/actions/workflows/ci-test.yml)
[![CI - Build](https://github.com/rwyatt2/HIVE-R/actions/workflows/ci-build.yml/badge.svg)](https://github.com/rwyatt2/HIVE-R/actions/workflows/ci-build.yml)
[![CI - Docker](https://github.com/rwyatt2/HIVE-R/actions/workflows/ci-docker.yml/badge.svg)](https://github.com/rwyatt2/HIVE-R/actions/workflows/ci-docker.yml)

**Your Portable AI Software Team.**

HIVE-R is an autonomous 13-agent swarm that works together to build software. From "Idea" to "Production Code", seamlessly.

> **Update**: Now available as a **Portable MCP Server** for Cursor and Claude Desktop!

---

## ⚡️ Quick Start

### 1. Unified Web Studio
Run the full local environment with visualization and chat.

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```
Open **http://localhost:5173** to build with the UI.

### 2. Portable Agents (MCP)
Use the agents directly inside **Cursor** or **Claude Code**.

```bash
# Register with Cursor (Absolute path needed)
npx -y tsx /path/to/HIVE-R/src/mcp-server.ts
```

→ **[Read the Full MCP Setup Guide](./README_MCP.md)**

---

## 🚀 What is HIVE-R?

Instead of being just another coding chatbot, HIVE-R is a **structured organization of 13 specialists**:

| Role | Agent | Responsibility |
|------|-------|----------------|
| **Strategy** | Founder, PM, UX | Requirements & Vision |
| **Design** | Designer, Accessibility | UI Specs & WCAG checks |
| **Build** | Builder, Planner, Security | Code generation & Review |
| **Ship** | SRE, Tester, Writer | Deployment & Docs |

They don't just write code; they **collaborate**. The Designer passes specs to the Builder, the Builder sends code to the Tester, and the Security agent audits everything before it ships.

---

## ✨ Features

### 🔌 Model Context Protocol (MCP)
Plug HIVE-R's brain into your existing workflow.
- **Consult the Swarm**: Ask complex questions.
- **Build Features**: Have the swarm scaffold code in your active project.
- **Refactor**: Ask the Security agent to audit your current file.

### 🛡️ Production-Ready Standards
- **Secure**: Built-in XSS protection, RBAC, and Security Headers.
- **Persistent**: Long-term memory with ChromaDB + SQLite.
- **Observability**: Full Sentry integration and OpenTelemetry tracing.

### 🎨 Visual Studio
- **Real-time Graph**: See the agents "thinking" and handing off tasks.
- **Neural Glass UI**: Unified dark-mode aesthetic with glassmorphism and "Neural Honeycomb" visuals.
- **Plugin Marketplace**: Extend the swarm with custom plugins via the integrated builder drawer.
- **Voice Control**: Speak to your team directly.

---

## Project Structure

```bash
HIVE-R/
├── src/
│   ├── index.ts        # Hono Web Server (API)
│   ├── mcp-server.ts   # MCP Server (Portable) # NEW
│   ├── graph.ts        # The Agent Brain (Shared) # NEW
│   ├── agents/         # The 13 Specialists
│   └── tools/          # File Access & Testing Tools
├── client/             # Unified React Frontend
└── data/               # Persistent Memory DB
```

---

## Documentation

- **[How to Use Agents](./HOW_TO_USE_AGENTS.md)**: Detailed guide for new projects.
- **[Design System](./docs/DESIGN_SYSTEM.md)**: UI standards, colors, and component patterns.
- **[MCP Server Setup](./README_MCP.md)**: Connect to Cursor/Claude.
- **[Deployment](./deploy/README.md)**: Ship the HIVE-R server to production.
- **[Testing Guide](./docs/development/testing.md)**: How to run, write, and debug tests.
- **[Operations Runbook](./docs/operations/runbook.md)**: Failure scenarios, detection, and recovery procedures.

---

## Roadmap V2 Complete ✅

We have successfully migrated HIVE-R to a production-grade architecture:

1.  **Unified Frontend**: Single port (5173) for Landing, Dashboard, and Studio.
2.  **Portable Core**: Decoupled "Brain" for use in CLI/MCP.
3.  **Security First**: RBAC, API Keys, and "Owner Mode" dashboards.

---

## License

MIT
