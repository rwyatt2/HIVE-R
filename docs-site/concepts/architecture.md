# Architecture

This page explains HIVE-R's technical architecture for developers who want to understand or extend the system.

## High-Level Overview

```
┌─────────────────────────────────────────────────┐
│                  HIVE-R Server                  │
├─────────────────────────────────────────────────┤
│  API Layer (Hono.js)                            │
│  ├── /chat          → Main chat endpoint        │
│  ├── /chat/stream   → SSE streaming             │
│  ├── /workflow/*    → Direct subgraph access    │
│  └── /agents/*      → Agent configuration       │
├─────────────────────────────────────────────────┤
│  Orchestration Layer (LangGraph)                │
│  ├── Router         → Request routing           │
│  ├── Subgraphs      → Agent groups              │
│  └── State          → Shared conversation state │
├─────────────────────────────────────────────────┤
│  Agent Layer                                    │
│  ├── 13 Specialist Agents                       │
│  ├── System Prompts                             │
│  └── Tool Access                                │
├─────────────────────────────────────────────────┤
│  Infrastructure Layer                           │
│  ├── SQLite         → Memory & persistence      │
│  ├── Cache          → LLM response caching      │
│  └── Logger         → Structured logging        │
└─────────────────────────────────────────────────┘
```

## Request Flow

1. **Request arrives** at `/chat` or `/chat/stream`
2. **Auth middleware** validates API key (if configured)
3. **Rate limiter** checks request limits
4. **Router agent** analyzes the request
5. **Subgraphs execute** in sequence
6. **State updates** after each agent
7. **Response returned** with artifacts

## Project Structure

```
HIVE-R/
├── src/
│   ├── index.ts              # Main server
│   ├── agents/               # The 13 agents
│   │   ├── router.ts         # Traffic controller
│   │   ├── founder.ts
│   │   ├── product-manager.ts
│   │   └── ...
│   ├── subgraphs/            # Agent groups
│   │   ├── strategy.ts
│   │   ├── design.ts
│   │   ├── build.ts
│   │   └── ship.ts
│   ├── lib/                  # Core utilities
│   │   ├── state.ts          # Shared state
│   │   ├── memory.ts         # SQLite persistence
│   │   ├── safety.ts         # Loop protection
│   │   └── ...
│   └── tools/                # Agent capabilities
│       ├── files.ts
│       ├── web.ts
│       └── ...
├── client/                   # HIVE-R Studio UI
├── landing/                  # Marketing site
└── docs-site/                # Documentation (this site)
```

## State Management

All agents share a common state object:

```typescript
interface AgentState {
  messages: BaseMessage[];
  currentAgent: string;
  nextAgent: string;
  artifacts: Map<string, string>;
  turnCount: number;
  humanApprovalRequired: boolean;
}
```

State is persisted to SQLite via LangGraph's checkpointer, enabling:
- Conversation history
- Resume from any point
- Multi-turn workflows

## LLM Integration

HIVE-R uses OpenAI models by default:

- **Main model:** `gpt-4o` for complex reasoning
- **Fast model:** `gpt-4o-mini` for simple tasks

Configuration via environment variables:
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL_MAIN=gpt-4o
OPENAI_MODEL_FAST=gpt-4o-mini
```

## Extending HIVE-R

### Add a New Agent

1. Create `src/agents/my-agent.ts`
2. Define the system prompt
3. Add to the appropriate subgraph
4. Update the Router to recognize the new agent

### Add a New Tool

1. Create `src/tools/my-tool.ts`
2. Define the tool schema with Zod
3. Implement the tool function
4. Add to agents that should use it

### Add a New Subgraph

1. Create `src/subgraphs/my-flow.ts`
2. Define the StateGraph with agent nodes
3. Add edges between agents
4. Register the subgraph route in `index.ts`

## Next Steps

- [API Reference](/api/endpoints) - Full API documentation
- [Security](/reference/security) - Security considerations
