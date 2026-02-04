import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { config } from 'dotenv';
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { randomUUID } from "crypto";
// State & Memory
import { AgentState } from "./lib/state.js";
import { checkpointer } from "./lib/memory.js";
// Middleware
import { requestLogger, rateLimiter, errorHandler, cors } from "./lib/middleware.js";
import { authMiddleware, isAuthEnabled } from "./lib/auth.js";
// History
import * as history from "./lib/history.js";
// User Auth
import * as userAuth from "./lib/user-auth.js";
// Agent Config
import * as agentConfig from "./lib/agent-config.js";
// Demo Mode
import * as demo from "./lib/demo.js";
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
config();
// ✅ Initialize Sentry early (before other imports that might throw)
import { initSentry, sentryErrorHandler, getSentryStatus } from "./lib/sentry.js";
initSentry();
// ✅ Phase 15: Agent & Project Enhancements
import { initSemanticMemory, searchMemories as searchSemanticMemories, storeMemory as storeSemanticMemory, getSemanticMemoryStats, isSemanticMemoryEnabled } from "./lib/semantic-memory.js";
import * as orgs from "./lib/organizations.js";
import * as billing from "./lib/billing.js";
import adminRouter from "./routers/admin.js"; // ✅ Admin Router
// Initialize Phase 15 features
orgs.initOrgTables();
billing.initBillingTables();
initSemanticMemory().catch(err => console.warn('Semantic memory init failed:', err));
const app = new Hono();
// ✅ A+ Production Middleware
import { securityHeaders, runSecurityAudit } from "./lib/security.js";
app.use('*', sentryErrorHandler()); // ✅ Sentry error capture (first to catch all)
app.use('*', securityHeaders()); // ✅ Security headers (XSS, clickjacking protection)
app.use('*', cors(["http://localhost:3001", "http://localhost:3000", "http://localhost:5173", "*"]));
app.use('*', errorHandler());
app.use('*', requestLogger());
app.use('*', authMiddleware); // ✅ API Key auth (set HIVE_API_KEY to enable)
app.use('/chat*', rateLimiter(100, 60000)); // 100 requests/min for dev
app.route('/admin', adminRouter); // ✅ Mount Admin Router
// --- Graph Setup ---
// --- Graph Setup ---
import { graph } from "./graph.js";
// Import metrics
import { metrics } from "./lib/metrics.js";
// Import vector memory
import { retrieveMemories, formatMemoriesForPrompt, getMemoryStats, storeMemory } from "./lib/vector-memory.js";
// Import health checks
import { runHealthChecks, checkMemory } from "./lib/health.js";
// --- API Endpoints ---
/**
 * ✅ Health check endpoint (basic)
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
 * ✅ Liveness probe - is the process alive?
 * Used by K8s/Docker to determine if container should be restarted
 */
app.get('/health/live', (c) => {
    return c.json({
        status: "alive",
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});
/**
 * ✅ Readiness probe - is the service ready to accept traffic?
 * Used by K8s/Docker to determine if traffic should be routed to this instance
 */
app.get('/health/ready', async (c) => {
    const result = await runHealthChecks();
    return c.json(result, result.ready ? 200 : 503);
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
// Import cost tracking
import { getCostSummary, getConversationCost, formatCostSummary } from "./lib/cost-tracker.js";
import { getCacheStats, isCacheEnabled } from "./lib/cache.js";
import { getAuthStatus } from "./lib/auth.js";
/**
 * ✅ Performance Dashboard - overview of system health
 */
app.get('/dashboard', (c) => {
    const startTime = Date.now();
    return c.json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        // Performance
        performance: {
            cache: getCacheStats(),
            cacheEnabled: isCacheEnabled(),
        },
        // Costs
        costs: getCostSummary(),
        // System
        system: {
            memory: process.memoryUsage(),
            nodeVersion: process.version,
        },
        // Security
        auth: getAuthStatus(),
        security: runSecurityAudit(),
        // Response time
        responseTimeMs: Date.now() - startTime,
    });
});
/**
 * ✅ Cost dashboard - detailed cost breakdown
 */
app.get('/dashboard/costs', (c) => {
    return c.json({
        summary: getCostSummary(),
        formatted: formatCostSummary(),
    });
});
/**
 * ✅ Get cost for specific conversation
 */
app.get('/dashboard/costs/:threadId', (c) => {
    const threadId = c.req.param('threadId');
    const cost = getConversationCost(threadId);
    if (!cost) {
        return c.json({ error: "No cost data for this thread" }, 404);
    }
    return c.json(cost);
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
    }
    catch (error) {
        return c.json({
            error: "Failed to fetch state",
            message: error.message
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
    const history = result.messages.map((msg) => ({
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
        let currentAgent = null;
        let previousAgent = null;
        for await (const event of eventStream) {
            // Agent started processing
            if (event.event === "on_chain_start" && event.name && HIVE_MEMBERS.includes(event.name)) {
                previousAgent = currentAgent;
                currentAgent = event.name;
                // Emit agent_start event
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: "agent_start",
                        agent: event.name,
                        timestamp: Date.now()
                    }),
                    event: "agent_start"
                });
                // Emit handoff event if there was a previous agent
                if (previousAgent && previousAgent !== currentAgent) {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: "handoff",
                            from: previousAgent,
                            to: currentAgent,
                            timestamp: Date.now()
                        }),
                        event: "handoff"
                    });
                }
            }
            // Agent finished processing
            if (event.event === "on_chain_end" && event.name && HIVE_MEMBERS.includes(event.name)) {
                // Emit agent_end event
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: "agent_end",
                        agent: event.name,
                        timestamp: Date.now()
                    }),
                    event: "agent_end"
                });
                // Also emit the agent's final message
                const content = event.data?.output?.messages?.[0]?.content;
                if (content) {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: "agent",
                            agent: event.name,
                            content: content,
                        }),
                        event: "agent"
                    });
                }
            }
            // Stream content chunks
            if (event.event === "on_chat_model_stream") {
                const chunk = event.data?.chunk?.content;
                if (chunk) {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: "chunk",
                            content: chunk,
                            agent: currentAgent
                        }),
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
            messages: state.values.messages?.map((msg) => ({
                agent: msg.name || "User",
                content: msg.content,
            })) || [],
            contributors: state.values.contributors || [],
            phase: state.values.phase,
        });
    }
    catch {
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
    const result = await graph.invoke({
        approvalStatus: approved ? "approved" : "rejected",
        requiresApproval: false
    }, config);
    return c.json({
        threadId,
        status: approved ? "approved" : "rejected",
        result: result.messages[result.messages.length - 1]?.content,
    });
});
// ============================================
// ✅ CHAT HISTORY ENDPOINTS
// Persist and retrieve chat sessions
// ============================================
/**
 * Get all chat sessions
 */
app.get('/history/sessions', (c) => {
    const userId = c.req.query('userId'); // Optional user filter
    const limit = parseInt(c.req.query('limit') || '50');
    const sessions = history.getUserSessions(userId, limit);
    return c.json({
        sessions,
        count: sessions.length
    });
});
/**
 * Create a new chat session
 */
app.post('/history/sessions', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { userId, title } = body;
    const session = history.createSession(userId, title);
    return c.json(session, 201);
});
/**
 * Get a specific session with its messages
 */
app.get('/history/sessions/:sessionId', (c) => {
    const sessionId = c.req.param('sessionId');
    const session = history.getSession(sessionId);
    if (!session) {
        return c.json({ error: 'Session not found' }, 404);
    }
    const messages = history.getSessionMessages(sessionId);
    return c.json({
        ...session,
        messages
    });
});
/**
 * Update session title
 */
app.patch('/history/sessions/:sessionId', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { title } = await c.req.json();
    if (!title) {
        return c.json({ error: 'Title is required' }, 400);
    }
    const session = history.getSession(sessionId);
    if (!session) {
        return c.json({ error: 'Session not found' }, 404);
    }
    history.updateSessionTitle(sessionId, title);
    return c.json({ success: true });
});
/**
 * Delete a session
 */
app.delete('/history/sessions/:sessionId', (c) => {
    const sessionId = c.req.param('sessionId');
    const deleted = history.deleteSession(sessionId);
    if (!deleted) {
        return c.json({ error: 'Session not found' }, 404);
    }
    return c.json({ success: true });
});
/**
 * Add a message to a session
 */
app.post('/history/sessions/:sessionId/messages', async (c) => {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const session = history.getSession(sessionId);
    if (!session) {
        return c.json({ error: 'Session not found' }, 404);
    }
    if (!body.role || !body.content) {
        return c.json({ error: 'role and content are required' }, 400);
    }
    const message = history.saveMessage(sessionId, body.role, body.content, body.agentName);
    return c.json(message, 201);
});
/**
 * Bulk import messages (from localStorage sync)
 */
app.post('/history/sessions/:sessionId/import', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { messages } = await c.req.json();
    const session = history.getSession(sessionId);
    if (!session) {
        return c.json({ error: 'Session not found' }, 404);
    }
    if (!messages || !Array.isArray(messages)) {
        return c.json({ error: 'messages array is required' }, 400);
    }
    history.bulkSaveMessages(sessionId, messages);
    return c.json({ success: true, imported: messages.length });
});
// ============================================
// ✅ USER AUTH ENDPOINTS
// Registration, login, and token management
// ============================================
/**
 * Register a new user
 */
app.post('/auth/register', async (c) => {
    try {
        const { email, password } = await c.req.json();
        if (!email || !password) {
            return c.json({ error: 'Email and password are required' }, 400);
        }
        const user = userAuth.registerUser(email, password);
        const tokens = userAuth.loginUser(email, password);
        return c.json({
            user,
            ...tokens
        }, 201);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        return c.json({ error: message }, 400);
    }
});
/**
 * Login
 */
app.post('/auth/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        if (!email || !password) {
            return c.json({ error: 'Email and password are required' }, 400);
        }
        const tokens = userAuth.loginUser(email, password);
        const payload = userAuth.verifyJWT(tokens.accessToken);
        if (!payload) {
            return c.json({ error: 'Token generation failed' }, 500);
        }
        const user = userAuth.getUserById(payload.sub);
        return c.json({
            user,
            ...tokens
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        return c.json({ error: message }, 401);
    }
});
/**
 * Refresh tokens
 */
app.post('/auth/refresh', async (c) => {
    try {
        const { refreshToken } = await c.req.json();
        if (!refreshToken) {
            return c.json({ error: 'Refresh token is required' }, 400);
        }
        const tokens = userAuth.refreshTokens(refreshToken);
        return c.json(tokens);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Token refresh failed';
        return c.json({ error: message }, 401);
    }
});
/**
 * Logout
 */
app.post('/auth/logout', async (c) => {
    try {
        const { refreshToken } = await c.req.json();
        if (refreshToken) {
            userAuth.logout(refreshToken);
        }
        return c.json({ success: true });
    }
    catch {
        return c.json({ success: true }); // Always succeed for logout
    }
});
/**
 * Get current user (protected)
 */
app.get('/auth/me', (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'No token provided' }, 401);
    }
    const token = authHeader.slice(7);
    const payload = userAuth.verifyJWT(token);
    if (!payload) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
    const user = userAuth.getUserById(payload.sub);
    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ user });
});
// ============================================
// ✅ AGENT CONFIG ENDPOINTS
// View and customize agent system prompts
// ============================================
/**
 * Get all agent configurations
 */
app.get('/agents/config', (c) => {
    const configs = agentConfig.getAllAgentConfigs();
    return c.json({ agents: configs });
});
/**
 * Get a specific agent's configuration
 */
app.get('/agents/config/:name', (c) => {
    const name = c.req.param('name');
    const config = agentConfig.getAgentConfig(name);
    if (!config) {
        return c.json({ error: 'Agent not found' }, 404);
    }
    return c.json(config);
});
/**
 * Update an agent's system prompt (protected)
 */
app.put('/agents/config/:name', async (c) => {
    // Verify authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.slice(7);
    const payload = userAuth.verifyJWT(token);
    if (!payload) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
    const name = c.req.param('name');
    const { systemPrompt } = await c.req.json();
    if (!systemPrompt || typeof systemPrompt !== 'string') {
        return c.json({ error: 'systemPrompt is required' }, 400);
    }
    const config = agentConfig.updateAgentConfig(name, systemPrompt);
    if (!config) {
        return c.json({ error: 'Agent not found' }, 404);
    }
    return c.json(config);
});
/**
 * Reset an agent's configuration to default (protected)
 */
app.post('/agents/config/:name/reset', async (c) => {
    // Verify authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.slice(7);
    const payload = userAuth.verifyJWT(token);
    if (!payload) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
    const name = c.req.param('name');
    const config = agentConfig.resetAgentConfig(name);
    if (!config) {
        return c.json({ error: 'Agent not found' }, 404);
    }
    return c.json(config);
});
// ============================================
// ✅ DEMO MODE ENDPOINTS
// Sandboxed experience with pre-recorded responses
// ============================================
/**
 * Create a new demo session
 */
app.post('/demo/session', (c) => {
    const session = demo.createDemoSession();
    return c.json({
        sessionId: session.id,
        messagesRemaining: session.maxMessages,
        expiresIn: 30 * 60 * 1000 // 30 minutes in ms
    });
});
/**
 * Get demo session info
 */
app.get('/demo/session/:id', (c) => {
    const sessionId = c.req.param('id');
    const info = demo.getSessionInfo(sessionId);
    if (!info.found) {
        return c.json({ error: 'Session not found or expired' }, 404);
    }
    return c.json(info);
});
/**
 * Send a demo chat message
 */
app.post('/demo/chat', async (c) => {
    const { sessionId, message } = await c.req.json();
    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const session = demo.createDemoSession();
        currentSessionId = session.id;
    }
    // Check message limit
    const usage = demo.useMessage(currentSessionId);
    if (!usage.allowed) {
        return c.json({
            error: 'Demo limit reached',
            message: 'You\'ve reached the demo limit of 5 messages. Sign up for unlimited access!',
            messagesRemaining: 0,
            upgradeUrl: '/app'
        }, 429);
    }
    // Get pre-recorded response
    const response = demo.getDemoResponse(message);
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return c.json({
        sessionId: currentSessionId,
        content: response.content,
        agents: response.agents,
        messagesRemaining: usage.remaining
    });
});
/**
 * Stream demo chat (simulated SSE for demo)
 */
app.get('/demo/chat/stream', async (c) => {
    const sessionId = c.req.query('sessionId');
    const message = c.req.query('message') || '';
    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const session = demo.createDemoSession();
        currentSessionId = session.id;
    }
    // Check message limit
    const usage = demo.useMessage(currentSessionId);
    return streamSSE(c, async (stream) => {
        if (!usage.allowed) {
            await stream.writeSSE({
                event: 'error',
                data: JSON.stringify({
                    error: 'limit_reached',
                    message: 'Demo limit reached. Sign up for unlimited access!'
                })
            });
            return;
        }
        const response = demo.getDemoResponse(message);
        // Simulate agent handoffs
        for (const agent of response.agents) {
            await stream.writeSSE({
                event: 'data',
                data: JSON.stringify({
                    type: 'agent_start',
                    agent: agent.name,
                    emoji: agent.emoji,
                    action: agent.action,
                    timestamp: new Date().toISOString()
                })
            });
            await new Promise(resolve => setTimeout(resolve, 800));
            await stream.writeSSE({
                event: 'data',
                data: JSON.stringify({
                    type: 'agent_end',
                    agent: agent.name,
                    timestamp: new Date().toISOString()
                })
            });
        }
        // Stream content in chunks
        const chunks = response.content.split(' ');
        for (let i = 0; i < chunks.length; i += 3) {
            const chunk = chunks.slice(i, i + 3).join(' ') + ' ';
            await stream.writeSSE({
                event: 'data',
                data: JSON.stringify({
                    type: 'chunk',
                    content: chunk,
                    timestamp: new Date().toISOString()
                })
            });
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        // Send completion
        await stream.writeSSE({
            event: 'data',
            data: JSON.stringify({
                type: 'complete',
                messagesRemaining: usage.remaining,
                sessionId: currentSessionId
            })
        });
    });
});
// ============================================
// ✅ PLUGIN REGISTRY ENDPOINTS
// Browse, install, and manage plugins
// ============================================
import * as pluginRegistry from './lib/plugin-registry.js';
import * as pluginLoader from './lib/plugin-loader.js';
import { CreatePluginSchema, UpdatePluginSchema, RatingSchema } from './types/plugin.js';
// Initialize plugin tables on startup
pluginRegistry.initPluginTables();
/**
 * List all plugins (public)
 */
app.get('/plugins', (c) => {
    const search = c.req.query('search');
    const agentName = c.req.query('agent');
    const tags = c.req.query('tags')?.split(',');
    const sortBy = c.req.query('sort');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = pluginRegistry.listPlugins({
        search,
        agentName,
        tags,
        sortBy,
        page,
        limit
    });
    return c.json(result);
});
/**
 * Get a single plugin (public)
 */
app.get('/plugins/:id', (c) => {
    const id = c.req.param('id');
    const plugin = pluginRegistry.getPlugin(id);
    if (!plugin) {
        return c.json({ error: 'Plugin not found' }, 404);
    }
    return c.json(plugin);
});
/**
 * Create a new plugin (requires auth)
 */
app.post('/plugins', async (c) => {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.substring(7);
    const payload = userAuth.verifyAccessToken(token);
    if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
    }
    const user = userAuth.getUserById(payload.userId);
    if (!user) {
        return c.json({ error: 'User not found' }, 401);
    }
    try {
        const body = await c.req.json();
        const parsed = CreatePluginSchema.parse(body);
        const plugin = pluginRegistry.createPlugin(parsed, user.id, user.email);
        return c.json(plugin, 201);
    }
    catch (error) {
        if (error instanceof Error && 'issues' in error) {
            return c.json({ error: 'Validation failed', details: error }, 400);
        }
        throw error;
    }
});
/**
 * Update a plugin (requires auth, author only)
 */
app.put('/plugins/:id', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.substring(7);
    const payload = userAuth.verifyAccessToken(token);
    if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
    }
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const parsed = UpdatePluginSchema.parse(body);
        const plugin = pluginRegistry.updatePlugin(id, parsed, payload.userId);
        if (!plugin) {
            return c.json({ error: 'Plugin not found or not authorized' }, 404);
        }
        return c.json(plugin);
    }
    catch (error) {
        if (error instanceof Error && 'issues' in error) {
            return c.json({ error: 'Validation failed', details: error }, 400);
        }
        throw error;
    }
});
/**
 * Delete a plugin (requires auth, author only)
 */
app.delete('/plugins/:id', (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.substring(7);
    const payload = userAuth.verifyAccessToken(token);
    if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
    }
    const id = c.req.param('id');
    const deleted = pluginRegistry.deletePlugin(id, payload.userId);
    if (!deleted) {
        return c.json({ error: 'Plugin not found or not authorized' }, 404);
    }
    return c.json({ success: true });
});
/**
 * Install a plugin locally
 */
app.post('/plugins/:id/install', (c) => {
    const id = c.req.param('id');
    const plugin = pluginLoader.installPlugin(id);
    if (!plugin) {
        return c.json({ error: 'Plugin not found' }, 404);
    }
    return c.json({ success: true, plugin });
});
/**
 * Uninstall a plugin locally
 */
app.delete('/plugins/:id/uninstall', (c) => {
    const id = c.req.param('id');
    const uninstalled = pluginLoader.uninstallPlugin(id);
    if (!uninstalled) {
        return c.json({ error: 'Plugin not installed' }, 404);
    }
    return c.json({ success: true });
});
/**
 * Get installed plugins
 */
app.get('/plugins/installed', (c) => {
    const plugins = pluginLoader.getInstalledPlugins();
    return c.json({ plugins });
});
/**
 * Get ratings for a plugin
 */
app.get('/plugins/:id/ratings', (c) => {
    const id = c.req.param('id');
    const ratings = pluginRegistry.getPluginRatings(id);
    return c.json({ ratings });
});
/**
 * Rate a plugin (requires auth)
 */
app.post('/plugins/:id/ratings', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.substring(7);
    const payload = userAuth.verifyAccessToken(token);
    if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
    }
    const user = userAuth.getUserById(payload.userId);
    if (!user) {
        return c.json({ error: 'User not found' }, 401);
    }
    const id = c.req.param('id');
    // Check plugin exists
    const plugin = pluginRegistry.getPlugin(id);
    if (!plugin) {
        return c.json({ error: 'Plugin not found' }, 404);
    }
    try {
        const body = await c.req.json();
        const parsed = RatingSchema.parse(body);
        const rating = pluginRegistry.ratePlugin(id, user.id, user.email, parsed);
        return c.json(rating, 201);
    }
    catch (error) {
        if (error instanceof Error && 'issues' in error) {
            return c.json({ error: 'Validation failed', details: error }, 400);
        }
        throw error;
    }
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
        messages: result.messages.map((msg) => ({
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
        messages: result.messages.map((msg) => ({
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
        messages: result.messages.map((msg) => ({
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
        messages: result.messages.map((msg) => ({
            agent: msg.name || "Unknown",
            content: msg.content,
        })),
    });
});
// Import hierarchical subgraph
import { hierarchicalSubgraph } from "./subgraphs/hierarchical.js";
/**
 * Hierarchical phase: PM delegates to parallel workers
 */
app.post('/workflow/hierarchical', async (c) => {
    const { message } = await c.req.json();
    if (!message) {
        return c.json({ error: "Message is required" }, 400);
    }
    const result = await hierarchicalSubgraph.invoke({
        messages: [new HumanMessage(message)],
    });
    return c.json({
        phase: "hierarchical",
        subTasks: result.subTasks || [],
        aggregatedResults: result.aggregatedResults || [],
        messages: result.messages.map((msg) => ({
            agent: msg.name || "Unknown",
            content: msg.content,
        })),
    });
});
// ============================================
// Root & Info
// ============================================
app.get('/', (c) => {
    return c.text('🐝 HIVE-R Agent Server — A+ Grade');
});
app.get('/agents', (c) => {
    return c.json({
        agents: HIVE_MEMBERS,
        count: HIVE_MEMBERS.length,
    });
});
/**
 * Graph structure for HIVE-R Studio visualization
 */
app.get('/api/graph', (c) => {
    const nodes = [
        { id: 'Router', position: { x: 300, y: 0 }, data: { label: '🧭 Router', role: 'Orchestrator' }, type: 'input' },
        ...HIVE_MEMBERS.map((member, i) => ({
            id: member,
            position: { x: (i % 5) * 150, y: Math.floor(i / 5) * 120 + 100 },
            data: { label: member, role: member },
        })),
    ];
    const edges = [
        // Router to all agents
        ...HIVE_MEMBERS.map((member) => ({
            id: `e-router-${member.toLowerCase()}`,
            source: 'Router',
            target: member,
            animated: false,
        })),
        // Direct handoff edges
        { id: 'e-designer-builder', source: 'Designer', target: 'Builder', style: { stroke: '#22c55e' } },
        { id: 'e-builder-tester', source: 'Builder', target: 'Tester', style: { stroke: '#22c55e' } },
        { id: 'e-tester-builder', source: 'Tester', target: 'Builder', style: { stroke: '#f59e0b' } },
        { id: 'e-pm-designer', source: 'ProductManager', target: 'Designer', style: { stroke: '#22c55e' } },
    ];
    return c.json({ nodes, edges });
});
// ============================================
// Phase 15: Semantic Memory API
// ============================================
app.get('/semantic-memory/stats', async (c) => {
    const stats = await getSemanticMemoryStats();
    return c.json(stats);
});
app.post('/semantic-memory/search', async (c) => {
    const { query, agentName, threadId, limit } = await c.req.json();
    const results = await searchSemanticMemories(query, { agentName, threadId, limit });
    return c.json({ results });
});
app.post('/semantic-memory/store', async (c) => {
    const { content, agentName, threadId, type, metadata } = await c.req.json();
    const memory = await storeSemanticMemory(content, agentName, { threadId, type, metadata });
    return c.json(memory);
});
// ============================================
// Phase 15: Organizations API
// ============================================
// Helper to get user from JWT token
function getUserFromAuth(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    const token = authHeader.slice(7);
    const payload = userAuth.verifyJWT(token);
    if (!payload)
        return null;
    const user = userAuth.getUserById(payload.sub);
    return user ? { userId: user.id, email: user.email } : null;
}
app.get('/orgs', (c) => {
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user)
        return c.json({ error: 'Unauthorized' }, 401);
    const orgList = orgs.getUserOrganizations(user.userId);
    return c.json({ organizations: orgList });
});
app.post('/orgs', async (c) => {
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user)
        return c.json({ error: 'Unauthorized' }, 401);
    const { name } = await c.req.json();
    const org = orgs.createOrganization(name, user.userId, 'User', user.email);
    return c.json(org, 201);
});
app.get('/orgs/:id', (c) => {
    const orgId = c.req.param('id');
    const org = orgs.getOrganization(orgId);
    if (!org)
        return c.json({ error: 'Not found' }, 404);
    return c.json(org);
});
app.get('/orgs/:id/members', (c) => {
    const orgId = c.req.param('id');
    const members = orgs.getOrgMembers(orgId);
    return c.json({ members });
});
app.post('/orgs/:id/invite', async (c) => {
    const orgId = c.req.param('id');
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user || !orgs.canPerformAction(orgId, user.userId, 'invite')) {
        return c.json({ error: 'Forbidden' }, 403);
    }
    const { email, role } = await c.req.json();
    const invite = orgs.createInvite(orgId, email, role || 'member', user.userId);
    return c.json(invite, 201);
});
app.delete('/orgs/:id/members/:memberId', (c) => {
    const orgId = c.req.param('id');
    const targetUserId = c.req.param('memberId');
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user || !orgs.canPerformAction(orgId, user.userId, 'manage_members')) {
        return c.json({ error: 'Forbidden' }, 403);
    }
    orgs.removeMember(orgId, targetUserId);
    return c.json({ success: true });
});
// ============================================
// Phase 15: Billing API
// ============================================
app.get('/billing/usage', (c) => {
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user)
        return c.json({ error: 'Unauthorized' }, 401);
    const summary = billing.getUsageSummary(user.userId);
    return c.json(summary || { error: 'No billing data' });
});
app.post('/billing/checkout', async (c) => {
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user)
        return c.json({ error: 'Unauthorized' }, 401);
    const { tier, successUrl, cancelUrl } = await c.req.json();
    const customer = await billing.getOrCreateCustomer(user.userId, user.email);
    const session = await billing.createCheckoutSession(customer.id, tier, successUrl, cancelUrl);
    return c.json(session || { error: 'Billing not configured' });
});
app.post('/billing/portal', async (c) => {
    const user = getUserFromAuth(c.req.header('Authorization'));
    if (!user)
        return c.json({ error: 'Unauthorized' }, 401);
    const customer = billing.getCustomerByUserId(user.userId);
    if (!customer)
        return c.json({ error: 'No billing account' }, 404);
    const { returnUrl } = await c.req.json();
    const session = await billing.createPortalSession(customer.id, returnUrl);
    return c.json(session || { error: 'Billing not configured' });
});
app.post('/webhooks/stripe', async (c) => {
    const signature = c.req.header('stripe-signature');
    if (!signature)
        return c.json({ error: 'No signature' }, 400);
    const payload = await c.req.text();
    const event = billing.verifyWebhookSignature(payload, signature);
    if (!event)
        return c.json({ error: 'Invalid signature' }, 400);
    await billing.handleWebhook(event);
    return c.json({ received: true });
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
//# sourceMappingURL=index.js.map