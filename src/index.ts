import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { config } from 'dotenv'
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { randomUUID } from "crypto";

// State & Memory
import { AgentState } from "./lib/state.js";
import { checkpointer } from "./lib/memory.js";

// Middleware
import { requestLogger, rateLimiter, errorHandler, cors } from "./lib/middleware.js";
import { authMiddleware, isAuthEnabled } from "./lib/auth.js";

// Router
import { routerNode, HIVE_MEMBERS } from "./agents/router.js";

// Subgraphs
import { strategySubgraph } from "./subgraphs/strategy.js";
import { designSubgraph } from "./subgraphs/design.js";
import { buildSubgraph } from "./subgraphs/build.js";
import { shipSubgraph } from "./subgraphs/ship.js";

// Agents
import { founderNode } from "./agents/founder.js";
import { productManagerNode } from "./agents/product-manager.js";
import { uxResearcherNode } from "./agents/ux-researcher.js";
import { designerNode } from "./agents/designer.js";
import { accessibilityNode } from "./agents/accessibility.js";
import { plannerNode } from "./agents/planner.js";
import { securityNode } from "./agents/security.js";
import { builderNode } from "./agents/builder.js";
import { reviewerNode } from "./agents/reviewer.js";
import { testerNode } from "./agents/tester.js";
import { techWriterNode } from "./agents/tech-writer.js";
import { sreNode } from "./agents/sre.js";
import { dataAnalystNode } from "./agents/data-analyst.js";

config()

const app = new Hono()

// ✅ A+ Production Middleware
app.use('*', cors(["http://localhost:3001", "http://localhost:3000", "*"]));
app.use('*', errorHandler());
app.use('*', requestLogger());
app.use('*', authMiddleware);  // ✅ API Key auth (set HIVE_API_KEY to enable)
app.use('/chat*', rateLimiter(100, 60000)); // 100 requests/min for dev

// --- Graph Setup ---
const workflow = new StateGraph(AgentState)
    .addNode("Router", routerNode)
    .addNode("Founder", founderNode)
    .addNode("ProductManager", productManagerNode)
    .addNode("UXResearcher", uxResearcherNode)
    .addNode("Designer", designerNode)
    .addNode("Accessibility", accessibilityNode)
    .addNode("Planner", plannerNode)
    .addNode("Security", securityNode)
    .addNode("Builder", builderNode)
    .addNode("Reviewer", reviewerNode)
    .addNode("Tester", testerNode)
    .addNode("TechWriter", techWriterNode)
    .addNode("SRE", sreNode)
    .addNode("DataAnalyst", dataAnalystNode)
    .addEdge(START, "Router");

workflow.addConditionalEdges(
    "Router",
    (state) => state.next,
    {
        Founder: "Founder",
        ProductManager: "ProductManager",
        UXResearcher: "UXResearcher",
        Designer: "Designer",
        Accessibility: "Accessibility",
        Planner: "Planner",
        Security: "Security",
        Builder: "Builder",
        Reviewer: "Reviewer",
        Tester: "Tester",
        TechWriter: "TechWriter",
        SRE: "SRE",
        DataAnalyst: "DataAnalyst",
        FINISH: END,
    }
);

// ✅ Builder has self-loop capability for retry
workflow.addConditionalEdges(
    "Builder",
    (state) => {
        if (state.needsRetry) {
            console.log("🔄 Builder self-loop triggered");
            return "Builder";
        }
        return "Router";
    },
    {
        Builder: "Builder",
        Router: "Router",
    }
);

// All other agents route back to Router
for (const member of HIVE_MEMBERS) {
    if (member !== "Builder") {
        workflow.addEdge(member, "Router");
    }
}

const graph = workflow.compile({
    checkpointer
});

// Import metrics
import { metrics } from "./lib/metrics.js";

// Import vector memory
import { retrieveMemories, formatMemoriesForPrompt, getMemoryStats, storeMemory } from "./lib/vector-memory.js";

// --- API Endpoints ---

/**
 * ✅ Health check endpoint
 */
app.get('/health', (c) => {
    return c.json({
        status: "healthy",
        version: "1.0.0",
        agents: HIVE_MEMBERS.length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

/**
 * ✅ Metrics endpoint (JSON format)
 */
app.get('/metrics', (c) => {
    return c.json(metrics.getMetrics());
});

/**
 * ✅ Prometheus metrics endpoint
 */
app.get('/metrics/prometheus', (c) => {
    c.header('Content-Type', 'text/plain');
    return c.text(metrics.getPrometheusMetrics());
});

/**
 * ✅ Memory stats endpoint
 */
app.get('/memory/stats', (c) => {
    return c.json(getMemoryStats());
});

// Import tracing
import { getTrace, getAllTraces, getTraceSummary, isLangSmithEnabled } from "./lib/tracing.js";

/**
 * ✅ Get all traces (list view)
 */
app.get('/traces', (c) => {
    const traces = getAllTraces();
    return c.json({
        count: traces.length,
        langsmith: isLangSmithEnabled(),
        traces: traces.map(t => getTraceSummary(t)),
    });
});

/**
 * ✅ Get specific trace (detail view)
 */
app.get('/traces/:threadId', (c) => {
    const threadId = c.req.param('threadId');
    const trace = getTrace(threadId);

    if (!trace) {
        return c.json({ error: "Trace not found" }, 404);
    }

    return c.json({
        ...trace,
        summary: getTraceSummary(trace),
    });
});

/**
 * ✅ State snapshot endpoint (for debugging)
 * Returns the current conversation state for a thread
 */
app.get('/state/:threadId', async (c) => {
    const threadId = c.req.param('threadId');

    try {
        const state = await checkpointer.getTuple({
            configurable: { thread_id: threadId }
        });

        if (!state) {
            return c.json({ error: "Thread not found" }, 404);
        }

        return c.json({
            threadId,
            checkpoint: state.checkpoint,
            metadata: state.metadata,
            parentConfig: state.parentConfig,
        });
    } catch (error) {
        return c.json({
            error: "Failed to fetch state",
            message: (error as Error).message
        }, 500);
    }
});

/**
 * ✅ Memory search endpoint
 */
app.post('/memory/search', async (c) => {
    const { query, agent, limit } = await c.req.json();
    if (!query) {
        return c.json({ error: "Query is required" }, 400);
    }

    const memories = await retrieveMemories(query, { agent, limit });
    return c.json({ memories });
});


/**
 * Standard chat endpoint
 */
app.post('/chat', async (c) => {
    const body = await c.req.json();
    const { message, threadId } = body;

    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }

    const thread = threadId || randomUUID();
    const config = {
        configurable: { thread_id: thread }
    };

    const initialState = {
        messages: [new HumanMessage(message)],
    };

    const result = await graph.invoke(initialState, config);

    const history = result.messages.map((msg: BaseMessage) => ({
        agent: msg.name || "User",
        content: msg.content,
    }));

    return c.json({
        threadId: thread,
        result: result.messages[result.messages.length - 1]?.content,
        contributors: result.contributors || [],
        history
    });
});

/**
 * Streaming endpoint with SSE
 */
app.post('/chat/stream', async (c) => {
    const body = await c.req.json();
    const { message, threadId } = body;

    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }

    const thread = threadId || randomUUID();
    const config = {
        configurable: { thread_id: thread }
    };

    const initialState = {
        messages: [new HumanMessage(message)],
    };

    return streamSSE(c, async (stream) => {
        await stream.writeSSE({
            data: JSON.stringify({ type: "thread", threadId: thread }),
            event: "thread"
        });

        const eventStream = graph.streamEvents(initialState, {
            ...config,
            version: "v2"
        });

        for await (const event of eventStream) {
            if (event.event === "on_chain_end" && event.name && HIVE_MEMBERS.includes(event.name as any)) {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: "agent",
                        agent: event.name,
                        content: event.data?.output?.messages?.[0]?.content || "",
                    }),
                    event: "agent"
                });
            }

            if (event.event === "on_chat_model_stream") {
                const chunk = event.data?.chunk?.content;
                if (chunk) {
                    await stream.writeSSE({
                        data: JSON.stringify({ type: "chunk", content: chunk }),
                        event: "chunk"
                    });
                }
            }
        }

        await stream.writeSSE({
            data: JSON.stringify({ type: "done" }),
            event: "done"
        });
    });
});

/**
 * Get conversation history
 */
app.get('/thread/:threadId', async (c) => {
    const threadId = c.req.param('threadId');

    try {
        const state = await graph.getState({
            configurable: { thread_id: threadId }
        });

        if (!state.values) {
            return c.json({ error: "Thread not found" }, 404);
        }

        return c.json({
            threadId,
            messages: state.values.messages?.map((msg: BaseMessage) => ({
                agent: msg.name || "User",
                content: msg.content,
            })) || [],
            contributors: state.values.contributors || [],
            phase: state.values.phase,
        });
    } catch {
        return c.json({ error: "Thread not found" }, 404);
    }
});

/**
 * Human-in-the-loop approval
 */
app.post('/thread/:threadId/approve', async (c) => {
    const threadId = c.req.param('threadId');
    const { approved } = await c.req.json();

    const config = {
        configurable: { thread_id: threadId }
    };

    const result = await graph.invoke(
        {
            approvalStatus: approved ? "approved" : "rejected",
            requiresApproval: false
        },
        config
    );

    return c.json({
        threadId,
        status: approved ? "approved" : "rejected",
        result: result.messages[result.messages.length - 1]?.content,
    });
});

// ============================================
// ✅ SUBGRAPH ENDPOINTS
// Run specific workflow phases directly
// ============================================

/**
 * Strategy phase: Founder → PM → UX
 */
app.post('/workflow/strategy', async (c) => {
    const { message } = await c.req.json();

    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }

    const result = await strategySubgraph.invoke({
        messages: [new HumanMessage(message)],
    });

    return c.json({
        phase: "strategy",
        messages: result.messages.map((msg: BaseMessage) => ({
            agent: msg.name || "Unknown",
            content: msg.content,
        })),
    });
});

/**
 * Design phase: Designer → Accessibility
 */
app.post('/workflow/design', async (c) => {
    const { message } = await c.req.json();

    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }

    const result = await designSubgraph.invoke({
        messages: [new HumanMessage(message)],
    });

    return c.json({
        phase: "design",
        messages: result.messages.map((msg: BaseMessage) => ({
            agent: msg.name || "Unknown",
            content: msg.content,
        })),
    });
});

/**
 * Build phase: Planner → Security → Builder → Reviewer → Tester
 */
app.post('/workflow/build', async (c) => {
    const { message } = await c.req.json();

    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }

    const result = await buildSubgraph.invoke({
        messages: [new HumanMessage(message)],
    });

    return c.json({
        phase: "build",
        messages: result.messages.map((msg: BaseMessage) => ({
            agent: msg.name || "Unknown",
            content: msg.content,
        })),
    });
});

/**
 * Ship phase: TechWriter → SRE → DataAnalyst
 */
app.post('/workflow/ship', async (c) => {
    const { message } = await c.req.json();

    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }

    const result = await shipSubgraph.invoke({
        messages: [new HumanMessage(message)],
    });

    return c.json({
        phase: "ship",
        messages: result.messages.map((msg: BaseMessage) => ({
            agent: msg.name || "Unknown",
            content: msg.content,
        })),
    });
});

// ============================================
// Root & Info
// ============================================

app.get('/', (c) => {
    return c.text('🐝 HIVE-R Agent Server — A+ Grade')
});

app.get('/agents', (c) => {
    return c.json({
        agents: HIVE_MEMBERS,
        count: HIVE_MEMBERS.length,
    });
});

// ============================================
// Server Startup
// ============================================

const port = parseInt(process.env.PORT || "3000");

console.log(`
🐝 HIVE-R v1.0.0 — A+ Grade Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Agents: ${HIVE_MEMBERS.length}
💾 Persistence: SQLite
🌊 Streaming: Enabled
🔒 Rate Limiting: 30 req/min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoints:
  POST /chat           Full orchestration
  POST /chat/stream    SSE streaming
  GET  /health         Health check
  
Subgraph Workflows:
  POST /workflow/strategy
  POST /workflow/design
  POST /workflow/build
  POST /workflow/ship
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Listening on port ${port}
`);

serve({
    fetch: app.fetch,
    port
});