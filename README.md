# 🐝 HIVE-R

**A world-class multi-agent system for product development.**

13 specialized AI agents working together: Founder, PM, UX Researcher, Designer, Accessibility, Planner, Security, Builder, Reviewer, Tester, Tech Writer, SRE, Data Analyst.

---

## Quick Start

```bash
# Install
npm install

# Run
npm run dev

# Use from anywhere
npm run build && npm link
hive "Help me build a landing page"
```

---

## Features

| Feature | Status |
|---------|--------|
| 13 Specialized Agents | ✅ |
| Typed Artifact Outputs | ✅ |
| SQLite Persistence | ✅ |
| Streaming (SSE) | ✅ |
| Interactive CLI | ✅ |
| File/Command Tools | ✅ |
| Web Search Tools | ✅ |
| Rate Limiting | ✅ |
| Metrics & Monitoring | ✅ |
| Docker Support | ✅ |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Send a message, get orchestrated response |
| `/chat/stream` | POST | SSE streaming response |
| `/health` | GET | Health check |
| `/metrics` | GET | JSON metrics |
| `/agents` | GET | List all agents |
| `/workflow/strategy` | POST | Run strategy phase |
| `/workflow/design` | POST | Run design phase |
| `/workflow/build` | POST | Run build phase |
| `/workflow/ship` | POST | Run ship phase |

---

## CLI Usage

```bash
# One-shot command
hive "Create a login component"

# Interactive mode
hive -i

# Custom server
hive -s http://myserver:3000 "Hello"
```

---

## Environment Variables

```bash
OPENAI_API_KEY=sk-...           # Required
LANGCHAIN_TRACING_V2=true       # Optional: LangSmith
LANGCHAIN_API_KEY=...           # Optional: LangSmith
GITHUB_TOKEN=...                # Optional: GitHub tools
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Router                     │
│         (intelligently routes tasks)        │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌─────▼─────┐   ┌───▼───┐
│Strategy│   │   Build   │   │ Ship  │
│ Phase  │   │   Phase   │   │ Phase │
└────────┘   └───────────┘   └───────┘
    │             │             │
 Founder       Planner      TechWriter
 PM            Security     SRE
 UX            Builder      DataAnalyst
               Reviewer
               Tester
```

---

## Development

```bash
npm run dev          # Start with hot reload
npm test             # Run tests
npm run typecheck    # TypeScript check
npm run build        # Build for production
```

---

## License

ISC
