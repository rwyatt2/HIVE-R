/**
 * Demo Mode
 * 
 * Provides a sandboxed, read-only experience of the agent swarm.
 * - Pre-recorded responses (no real LLM calls)
 * - Session limits (5 messages max)
 * - 30-minute TTL per session
 */

import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface DemoSession {
    id: string;
    messageCount: number;
    maxMessages: number;
    createdAt: Date;
    expiresAt: Date;
}

export interface DemoResponse {
    content: string;
    agents: { name: string; emoji: string; action: string }[];
    artifacts?: string[];
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const sessions = new Map<string, DemoSession>();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MESSAGES = 5;

/**
 * Create a new demo session
 */
export function createDemoSession(): DemoSession {
    const now = new Date();
    const session: DemoSession = {
        id: randomUUID(),
        messageCount: 0,
        maxMessages: MAX_MESSAGES,
        createdAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
    };

    sessions.set(session.id, session);
    return session;
}

/**
 * Get an existing demo session
 */
export function getDemoSession(sessionId: string): DemoSession | null {
    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
        sessions.delete(sessionId);
        return null;
    }

    return session;
}

/**
 * Increment message count and check limit
 */
export function useMessage(sessionId: string): { allowed: boolean; remaining: number } {
    const session = getDemoSession(sessionId);

    if (!session) {
        return { allowed: false, remaining: 0 };
    }

    if (session.messageCount >= session.maxMessages) {
        return { allowed: false, remaining: 0 };
    }

    session.messageCount++;
    return {
        allowed: true,
        remaining: session.maxMessages - session.messageCount
    };
}

/**
 * Clean up expired sessions (call periodically)
 */
export function cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, session] of sessions) {
        if (now > session.expiresAt) {
            sessions.delete(id);
            cleaned++;
        }
    }

    return cleaned;
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// ============================================================================
// PRE-RECORDED RESPONSES
// ============================================================================

const DEMO_RESPONSES: Record<string, DemoResponse> = {
    'login': {
        content: `I'll help you build a login page! Let me coordinate the team...

## 🎨 Design Specifications

**Layout:**
- Centered card on dark gradient background
- Email and password inputs with floating labels
- Primary "Sign In" button with gradient
- "Forgot Password?" and "Create Account" links

**Colors:**
- Background: #0a0a1a (dark navy)
- Card: #1a1a3e with subtle border
- Accent: #6366f1 (indigo) to #8b5cf6 (purple) gradient
- Text: #ffffff (primary), #94a3b8 (secondary)

## 🛠️ Generated Code

\`\`\`tsx
// LoginPage.tsx
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Authentication logic here
  };
  
  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <input 
          type="email" 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
\`\`\`

✅ **Security Review**: Password field uses type="password", form prevents CSRF via same-origin policy.

✅ **Accessibility**: All inputs have labels, form is keyboard navigable.`,
        agents: [
            { name: 'Router', emoji: '🧭', action: 'Routing to Design + Build teams' },
            { name: 'Designer', emoji: '🎨', action: 'Creating UI specifications' },
            { name: 'Builder', emoji: '🛠️', action: 'Generating React component' },
            { name: 'Security', emoji: '🔒', action: 'Reviewing authentication flow' },
            { name: 'Accessibility', emoji: '♿', action: 'Verifying WCAG compliance' }
        ]
    },

    'api': {
        content: `I'll create a REST API for you! Let me coordinate the team...

## 📐 API Architecture

**Endpoints:**
- \`GET /api/users\` - List all users (paginated)
- \`GET /api/users/:id\` - Get user by ID
- \`POST /api/users\` - Create new user
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Delete user

**Authentication:** Bearer token (JWT)
**Rate Limiting:** 100 requests/minute

## 🛠️ Generated Code

\`\`\`typescript
// users.ts
import { Hono } from 'hono';

const app = new Hono();

// GET /api/users
app.get('/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const users = await db.users.findMany({
    skip: (page - 1) * limit,
    take: limit
  });
  
  return c.json({ users, page, limit });
});

// POST /api/users
app.post('/users', async (c) => {
  const body = await c.req.json();
  const validated = userSchema.parse(body);
  
  const user = await db.users.create({
    data: validated
  });
  
  return c.json(user, 201);
});

export default app;
\`\`\`

## 🧪 Test Coverage

\`\`\`typescript
describe('Users API', () => {
  it('should return paginated users', async () => {
    const res = await app.request('/users?page=1&limit=10');
    expect(res.status).toBe(200);
  });
});
\`\`\`

✅ **Security Review**: Input validation with Zod, parameterized queries prevent SQL injection.`,
        agents: [
            { name: 'Router', emoji: '🧭', action: 'Routing to Build team' },
            { name: 'Planner', emoji: '📐', action: 'Designing API architecture' },
            { name: 'Builder', emoji: '🛠️', action: 'Implementing endpoints' },
            { name: 'Tester', emoji: '🧪', action: 'Writing test suite' },
            { name: 'Tech Writer', emoji: '✍️', action: 'Documenting API' }
        ]
    },

    'dashboard': {
        content: `I'll design a dashboard for you! Let me coordinate the team...

## 🔬 User Research Insights

Based on dashboard best practices:
- Users want quick overview of key metrics
- Most important data should be "above the fold"
- Interactive charts increase engagement
- Dark theme reduces eye strain for monitoring

## 🎨 Design Specifications

**Layout:**
- Top: Navigation bar with user menu
- Left: Collapsible sidebar with navigation
- Main: Grid of metric cards + charts
- Responsive: Cards stack on mobile

**Components:**
- MetricCard: Icon, value, label, trend indicator
- LineChart: Time-series data visualization
- BarChart: Comparative data
- Table: Detailed data view with sorting

## 🛠️ Generated Code

\`\`\`tsx
// Dashboard.tsx
export function Dashboard() {
  const { data } = useMetrics();
  
  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <div className="metrics-grid">
          <MetricCard
            icon="💰"
            value="$24,500"
            label="Revenue"
            trend="+12%"
          />
          <MetricCard
            icon="👥"
            value="1,234"
            label="Users"
            trend="+5%"
          />
          <MetricCard
            icon="📦"
            value="89"
            label="Orders"
            trend="-3%"
          />
        </div>
        <div className="charts-grid">
          <LineChart data={data.revenue} />
          <BarChart data={data.categories} />
        </div>
      </main>
    </div>
  );
}
\`\`\`

✅ **Accessibility**: ARIA labels on charts, keyboard navigation supported.

✅ **Performance**: Data fetched with SWR for caching and revalidation.`,
        agents: [
            { name: 'Router', emoji: '🧭', action: 'Routing to Strategy + Design + Build' },
            { name: 'UX Researcher', emoji: '🔬', action: 'Analyzing dashboard patterns' },
            { name: 'Designer', emoji: '🎨', action: 'Creating component designs' },
            { name: 'Builder', emoji: '🛠️', action: 'Implementing React components' },
            { name: 'Accessibility', emoji: '♿', action: 'Adding ARIA support' }
        ]
    }
};

/**
 * Get a demo response based on the prompt
 */
export function getDemoResponse(prompt: string): DemoResponse {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('login') || lowerPrompt.includes('auth')) {
        return DEMO_RESPONSES['login']!; // Known key
    }

    if (lowerPrompt.includes('api') || lowerPrompt.includes('rest') || lowerPrompt.includes('endpoint')) {
        return DEMO_RESPONSES['api']!; // Known key
    }

    if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('metrics') || lowerPrompt.includes('analytics')) {
        return DEMO_RESPONSES['dashboard']!; // Known key
    }

    // Default response for unrecognized prompts
    return {
        content: `Thanks for trying HIVE-R! 🐝

This is a demo with pre-recorded responses. Try one of these prompts to see the full experience:

- **"Build a login page"** → See Designer + Builder in action
- **"Create a REST API"** → Watch Planner + Builder + Tester collaborate
- **"Design a dashboard"** → Experience UX Research + Design + Build

In the full version, our 13 AI agents work together on any request you can imagine!

[→ Sign up for full access](/app)`,
        agents: [
            { name: 'Router', emoji: '🧭', action: 'Analyzing request' }
        ]
    };
}

/**
 * Get session info for display
 */
export function getSessionInfo(sessionId: string): {
    found: boolean;
    messagesUsed: number;
    messagesRemaining: number;
    expiresIn: number;
} {
    const session = getDemoSession(sessionId);

    if (!session) {
        return {
            found: false,
            messagesUsed: 0,
            messagesRemaining: 0,
            expiresIn: 0
        };
    }

    const expiresIn = Math.max(0, session.expiresAt.getTime() - Date.now());

    return {
        found: true,
        messagesUsed: session.messageCount,
        messagesRemaining: session.maxMessages - session.messageCount,
        expiresIn
    };
}
