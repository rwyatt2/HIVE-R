# 🐝 HIVE-R: Setup & Integration Guide

> **Multi-Agent AI System for Full Product Development**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running HIVE-R](#running-hive-r)
6. [API Reference](#api-reference)
7. [Integrating with Your Project](#integrating-with-your-project)
8. [Gap Analysis](#gap-analysis)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/rwyatt2/HIVE-R.git
cd HIVE-R
npm install

# Configure
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Run
npm run dev
```

HIVE-R is now running at `http://localhost:3000`.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18+ | LTS recommended |
| **npm** | 9+ | Comes with Node.js |
| **OpenAI API Key** | Required | GPT-4o access needed |
| **LangSmith API Key** | Optional | For tracing/observability |

---

## Installation

### Option 1: Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Option 2: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

---

## Configuration

### Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

**Required:**

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |

**Optional:**

| Variable | Description | Default |
|----------|-------------|---------|
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing | `false` |
| `LANGCHAIN_API_KEY` | LangSmith API key | - |
| `LANGCHAIN_PROJECT` | LangSmith project name | `hive-r` |
| `LANGSMITH_API_KEY` | Alternative for trace export | - |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `PORT` | HTTP server port | `3000` |
| `HIVE_DESIGN_SYSTEM` | Active design system | `default` |
| `DATABASE_URL` | PostgreSQL for persistence | - |

### Design System (Optional)

```bash
# Use a custom framework preset
HIVE_DESIGN_SYSTEM=tailwind npm run dev

# Available presets: tailwind, shadcn, chakra, mui, radix, ant, bootstrap
```

---

## Running HIVE-R

### Development (Hot Reload)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### With Docker

```bash
docker-compose up -d
```

---

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message to HIVE |
| `POST` | `/chat/stream` | SSE streaming response |
| `GET` | `/health` | Health check |
| `GET` | `/agents` | List all agents |

### Chat Request

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Build a user dashboard for analytics",
    "threadId": "optional-thread-id"
  }'
```

### Streaming Chat

```bash
curl -N http://localhost:3000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Design a login page"}'
```

### Debug Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/state/:threadId` | View conversation state |
| `GET` | `/traces` | List all traces |
| `GET` | `/traces/:threadId` | Trace details |
| `GET` | `/metrics` | Performance metrics |
| `GET` | `/memory/stats` | Vector memory stats |

---

## Integrating with Your Project

### 1. As a Backend Service

Run HIVE-R as a separate service and call its API:

```typescript
// your-app/lib/hive-client.ts
export async function askHive(message: string) {
  const response = await fetch('http://localhost:3000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return response.json();
}

// Usage
const result = await askHive("Create a React component for user profiles");
```

### 2. As a Library (Direct Import)

```typescript
import { StateGraph } from "@langchain/langgraph";
import { routerNode } from "hive-r/dist/agents/router.js";
import { builderNode } from "hive-r/dist/agents/builder.js";
import { AgentState } from "hive-r/dist/lib/state.js";

// Build custom workflow
const workflow = new StateGraph(AgentState)
  .addNode("Router", routerNode)
  .addNode("Builder", builderNode)
  // ... add your agents
```

### 3. Custom Workspace Integration

```bash
# Set working directory for agents
HIVE_WORKSPACE=/path/to/your/project npm run dev
```

Agents will read/write files in this workspace.

---

## Gap Analysis

### ⚠️ **Needs Attention Before Full Production Use**

#### 1. **Tools Need Workspace Binding** 🔴 HIGH
- File tools (`read_file`, `write_file`) need explicit workspace path
- Currently uses relative paths which may fail

**Fix Required:**
```typescript
// src/tools/files.ts
const WORKSPACE = process.env.HIVE_WORKSPACE || process.cwd();
```

#### 2. **No Persistent State Across Restarts** 🔴 HIGH
- Memory checkpointer is in-memory only
- Conversations lost on restart

**Fix Required:** Connect PostgreSQL or SQLite checkpointer

#### 3. **Architect Agent Broken** 🟡 MEDIUM
- `architect.ts` imports non-existent `createAgent`
- Unused but causes lint noise

**Fix:** Remove or fix `architect.ts`

#### 4. **Tracing Not Wired Into Agents** 🟡 MEDIUM
- Tracing infrastructure exists but not connected
- Agents don't call `startSpan`/`endSpan`

**Fix:** Wrap agent nodes with `withTracing()`

#### 5. **No Authentication/Authorization** 🟡 MEDIUM
- API is publicly accessible
- Any client can call any endpoint

**Fix:** Add API key middleware or OAuth

#### 6. **Artifact Store Not Used by Agents** 🟡 MEDIUM
- `artifactStore` in state not consumed
- Agents still parse message history

**Fix:** Update agent prompts to use `formatArtifactsForPrompt()`

#### 7. **Design Tokens Not in Agents' Context** 🟢 LOW
- Designer/Builder have design system, others don't
- May cause inconsistency

#### 8. **No Rate Limiting Per-User** 🟢 LOW
- Current rate limit is per-IP only
- No user-based throttling

---

## Quick Gap Fixes

### Fix 1: Add Workspace Environment

```bash
# Add to .env
HIVE_WORKSPACE=/Users/you/projects/my-app
```

### Fix 2: Enable PostgreSQL Persistence

```bash
# Add to .env
DATABASE_URL=postgresql://user:pass@localhost:5432/hive

# Requires @langchain/langgraph-checkpoint-postgres
npm install @langchain/langgraph-checkpoint-postgres
```

### Fix 3: Connect Tracing to Agents

Each agent should wrap its logic:

```typescript
import { withTracing } from "../lib/tracing.js";

export const designerNode = async (state) => {
  return withTracing(state.threadId, "Designer", "agent", async () => {
    // existing logic
  });
};
```

### Fix 4: Remove Broken Architect

```bash
rm src/agents/architect.ts
# Also remove from any imports
```

---

## Troubleshooting

### "Cannot find module" errors

```bash
# Clean rebuild
rm -rf dist node_modules
npm install
npm run build
```

### "OPENAI_API_KEY is missing"

```bash
# Check .env file exists and has key
cat .env | grep OPENAI
```

### "Rate limit exceeded"

Adjust in `src/index.ts`:
```typescript
app.use('/chat*', rateLimiter(200, 60000)); // 200/min
```

### Agents not producing output

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

---

## Production Checklist

- [ ] Set `OPENAI_API_KEY`
- [ ] Set `HIVE_WORKSPACE` to project directory
- [ ] Configure PostgreSQL for persistence
- [ ] Add API authentication
- [ ] Set up LangSmith for observability
- [ ] Configure rate limits appropriately
- [ ] Wire tracing into all agents
- [ ] Remove/fix `architect.ts`

---

*For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)*  
*For prompting guidance, see [docs/PROMPTING_GUIDE.md](./docs/PROMPTING_GUIDE.md)*
