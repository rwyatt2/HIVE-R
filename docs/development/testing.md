# 🧪 Testing Guide

How to run, write, and think about tests in HIVE-R.

---

## Quick Start

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

**Output**: Coverage HTML report → `coverage/index.html`

---

## Running Specific Tests

```bash
# Single file
npx vitest run tests/graph.test.ts

# All agent tests
npx vitest run tests/agents/

# Integration tests only
npx vitest run tests/integration/

# By name pattern
npx vitest run -t "should route through"

# Specific describe block
npx vitest run -t "Workflow: Security Code Review"
```

---

## Test Suite Overview

```
tests/
├── agents/                    # Agent unit tests (4 agents)
│   ├── builder.test.ts        # 19 tests — tool execution, retries
│   ├── router.test.ts         # 22 tests — routing, safety, context
│   ├── security.test.ts       # 18 tests — structured output, formatting
│   └── tester.test.ts         # 23 tests — test planning, tool fallback
├── integration/               # Multi-agent workflows
│   └── multi-agent-workflows.test.ts  # 15 tests — 3 user journeys
├── fixtures/                  # Shared mock data
│   ├── agent-responses.ts     # Agent state fixtures
│   ├── llm-responses.ts       # Mock LLM outputs
│   └── workflows/             # Integration test sequences
│       ├── build-react-app.ts
│       ├── security-review.ts
│       └── deploy-to-production.ts
├── lib/                       # Utility unit tests
│   ├── circuit-breaker.test.ts # 28 tests — state machine, events, registry
│   ├── cost-tracker.test.ts
│   ├── input-validation.test.ts
│   └── secrets.test.ts
├── middleware/                 # Auth & tracking tests
├── routers/                   # API route tests
├── services/                  # Service layer tests
├── graph.test.ts              # 34 tests — graph topology & routing
├── tools.test.ts              # Tool function tests
└── utils.test.ts              # Utility function tests
```

---

## Testing Philosophy

### Why We Test

HIVE-R has 14 agents that collaborate through a state graph. Without tests, a change to the Router could silently break every workflow. Tests give us:

1. **Confidence** — Refactor agents without fear
2. **Documentation** — Tests show how each agent _should_ behave
3. **Speed** — Catch bugs in 500ms, not after deployment

### Unit vs Integration

| | Unit Tests | Integration Tests |
|--|-----------|-------------------|
| **Scope** | Single agent or function | Multi-agent workflow |
| **Speed** | <10ms per test | <30ms per test |
| **Mocks** | Everything except the unit under test | Mock agents, use real graph |
| **When to use** | Testing agent logic, error handling | Testing handoff chains, state flow |
| **Location** | `tests/agents/`, `tests/lib/` | `tests/integration/` |

**Rule of thumb**: If you're testing "does this agent produce the right output?" → unit test. If you're testing "do agents A → B → C hand off correctly?" → integration test.

---

## Writing New Tests

### Unit Test for a New Agent

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// 1. Hoist mock references (prevents vi.mock hoisting issues)
const mocks = vi.hoisted(() => ({
    llmInvoke: vi.fn(),
}));

// 2. Mock external dependencies
vi.mock("../../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: vi.fn(() => ({
        invoke: mocks.llmInvoke,
        withStructuredOutput: vi.fn(() => ({
            invoke: mocks.llmInvoke,
        })),
    })),
}));

vi.mock("../../src/lib/utils.js", () => ({
    safeAgentCall: vi.fn(async (fn) => fn()),
    createAgentResponse: vi.fn((content, name) => ({
        messages: [new HumanMessage({ content, name })],
        contributors: [name],
    })),
}));

// 3. Import the agent AFTER mocks
import { myAgentNode } from "../../src/agents/my-agent.js";

describe("MyAgent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should produce a response for valid input", async () => {
        mocks.llmInvoke.mockResolvedValue({
            content: "Agent response here",
        });

        const state = {
            messages: [new HumanMessage("User request")],
            contributors: [],
            artifacts: [],
            // ... other state fields
        };

        const result = await myAgentNode(state);

        expect(result.messages).toHaveLength(1);
        expect(result.contributors).toContain("MyAgent");
    });

    it("should handle LLM errors gracefully", async () => {
        mocks.llmInvoke.mockRejectedValue(new Error("API timeout"));

        const state = {
            messages: [new HumanMessage("Bad request")],
            contributors: [],
            artifacts: [],
        };

        const result = await myAgentNode(state);

        // safeAgentCall should catch the error
        expect(result.messages[0].content).toContain("Error");
    });
});
```

### Integration Test for a New Workflow

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";

const mocks = vi.hoisted(() => ({
    routerInvoke: vi.fn(),
    agentANode: vi.fn(),
    agentBNode: vi.fn(),
}));

// Mock all agent modules
vi.mock("../../src/agents/agent-a.js", () => ({
    agentANode: (...args) => mocks.agentANode(...args),
}));

vi.mock("../../src/agents/agent-b.js", () => ({
    agentBNode: (...args) => mocks.agentBNode(...args),
}));

// ... (mock all other agents, router, and supporting modules)

import { workflow } from "../../src/graph.js";
const testGraph = workflow.compile({ checkpointer: undefined });

describe("AgentA → AgentB Workflow", () => {
    it("should hand off correctly", async () => {
        // Router drives the sequence
        mocks.routerInvoke
            .mockResolvedValueOnce({ next: "AgentA", reasoning: "..." })
            .mockResolvedValueOnce({ next: "AgentB", reasoning: "..." })
            .mockResolvedValueOnce({ next: "FINISH", reasoning: "..." });

        // Each agent returns with next: "Router"
        mocks.agentANode.mockResolvedValue({
            messages: [new HumanMessage({ content: "A done", name: "AgentA" })],
            contributors: ["AgentA"],
            next: "Router",
        });

        mocks.agentBNode.mockResolvedValue({
            messages: [new HumanMessage({ content: "B done", name: "AgentB" })],
            contributors: ["AgentB"],
            next: "Router",
        });

        const result = await testGraph.invoke(
            { messages: [new HumanMessage("Start")] },
            { configurable: { thread_id: "test-1" }, recursionLimit: 50 }
        );

        expect(result.contributors).toContain("AgentA");
        expect(result.contributors).toContain("AgentB");
    }, 30000);
});
```

> **⚠️ Critical**: Always return `next: "Router"` from mocked agent nodes. Without it, `state.next` retains the Router's last decision and `createAgentRouter` loops the agent back to itself infinitely.

---

## Mocking Strategy

### What to Mock

| Mock | Why |
|------|-----|
| `createTrackedLLM` | Prevents real OpenAI API calls |
| `checkpointer` | Prevents SQLite database creation |
| `checkTurnLimit` / `isCircuitOpen` | Controls safety logic |
| `logger` | Suppresses console noise |
| File/GitHub tools | Prevents filesystem mutations |
| `plugins` | No custom plugins in tests |

### What NOT to Mock

| Keep Real | Why |
|-----------|-----|
| `StateGraph` construction | Tests real graph topology |
| Conditional edges | Tests actual routing logic |
| State reducers | Tests state accumulation |
| Zod schemas | Tests output validation |

### The `vi.hoisted()` Pattern

Module mocks in Vitest are _hoisted_ above imports. If your mock factory references a `const` from the test file, it will fail with "Cannot access before initialization." Always use `vi.hoisted()`:

```typescript
// ✅ Correct
const mocks = vi.hoisted(() => ({
    myFn: vi.fn(),
}));

vi.mock("../../src/module.js", () => ({
    myExport: (...args) => mocks.myFn(...args),
}));

// ❌ Wrong — will throw ReferenceError
const myFn = vi.fn();
vi.mock("../../src/module.js", () => ({
    myExport: myFn, // Cannot access 'myFn' before initialization
}));
```

---

## Coverage Requirements

| Category | Target | Current Standard |
|----------|--------|-----------------|
| New code | **≥ 70%** | Required for all PRs |
| Priority agents (Router, Builder, Security, Tester) | **≥ 80%** | Enforced |
| `graph.ts` | **≥ 80%** | Critical path |
| Utilities (`lib/`) | **≥ 60%** | Best effort |

### Check Coverage

```bash
# Full report
npm run test:coverage

# Specific files
npx vitest run --coverage tests/agents/

# View HTML report
open coverage/index.html
```

---

## CI Integration

Tests run automatically on every PR via GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Tests
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

**PR requirements**:
- All tests must pass
- No regressions in code coverage
- New agents must include corresponding tests

---

## Troubleshooting

### `GraphRecursionError: Recursion limit reached`

**Cause**: Mocked agent doesn't return `next: "Router"`, so `state.next` keeps the old Router decision and `createAgentRouter` loops.

**Fix**: Always include `next: "Router"` in agent mock returns:

```typescript
mocks.myAgentNode.mockResolvedValue({
    messages: [...],
    contributors: ["MyAgent"],
    next: "Router",  // ← This line prevents the loop
});
```

### `ReferenceError: Cannot access '...' before initialization`

**Cause**: Mock factory references a variable that hasn't been hoisted.

**Fix**: Use `vi.hoisted()` — see [The vi.hoisted() Pattern](#the-vihoisted-pattern) above.

### `TypeError: Cannot read properties of undefined (reading 'invoke')`

**Cause**: `createTrackedLLM` mock doesn't return the method chain the agent expects.

**Fix**: Match the agent's usage. If it calls `llm.withStructuredOutput(schema).invoke(...)`, your mock needs:

```typescript
createTrackedLLM: vi.fn(() => ({
    withStructuredOutput: vi.fn(() => ({
        invoke: myMockFn,
    })),
}))
```

### `Module not found: *.js`

**Cause**: Vitest resolves `.js` extensions to `.ts` files. Mock paths must use `.js`.

**Fix**: Always use `.js` extensions in `vi.mock()` paths:

```typescript
// ✅ Correct
vi.mock("../../src/lib/utils.js", () => ({ ... }));

// ❌ Wrong
vi.mock("../../src/lib/utils.ts", () => ({ ... }));
```

### Tests pass locally but fail in CI

**Common causes**:
1. **Environment variables** — Ensure `.env` values aren't leaking into tests via mocks
2. **File paths** — Use path joins, not hardcoded `/Users/...` paths
3. **Timing** — Default timeout is 30s (`vitest.config.ts`), increase if CI is slow

---

## Configuration

`vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
        },
        testTimeout: 30000,
    },
});
```

Key settings:
- **`globals: true`** — `describe`, `it`, `expect` available without imports (but we import them explicitly for clarity)
- **`environment: "node"`** — Node.js runtime (not jsdom)
- **`testTimeout: 30000`** — 30-second default timeout per test
- **Coverage**: V8 provider with text, JSON, and HTML reporters
