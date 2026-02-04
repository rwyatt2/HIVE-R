# 🐝 HIVE-R

## What is HIVE-R?

**HIVE-R is an AI-powered software development team.** Instead of hiring 13 different specialists, you get 13 AI agents that work together to build your product—from initial idea to deployed code.

Think of it like having a full startup team available 24/7:
- A **Founder** who understands your vision
- A **Product Manager** who defines what to build
- A **Designer** who creates beautiful interfaces
- A **Builder** who writes production-ready code
- And 9 more specialists (UX, Security, Testing, DevOps, etc.)

You describe what you want in plain English, and the agents collaborate to make it happen.

---

## Why Does This Exist?

**The Problem:** Building software requires many different skills. You need someone to define requirements, someone to design the UI, someone to write code, someone to test it, someone to deploy it. Coordinating all these people is slow and expensive.

**The Solution:** HIVE-R combines all these roles into one system. The AI agents handle the coordination automatically. You just describe what you want, and the team figures out how to build it.

**The Goal:** Generate production-ready code (not prototypes) that could survive real users, pass code reviews, and run in production.

---

## How It Works

### The Simple Version

1. You send a message like: *"Build a dashboard for tracking sales metrics"*
2. The **Router** agent reads your request and decides which specialists should help
3. Each agent does their job (design, code, test, etc.)
4. You get working code as output

### The Technical Version

HIVE-R uses a technology called **LangGraph** to orchestrate the agents. Here's how the pieces connect:

```
Your Request
    ↓
┌─────────────────┐
│     Router      │  ← Decides which agents to involve
└────────┬────────┘
         ↓
┌─────────────────┐
│    Subgraphs    │  ← Groups of related agents
├─────────────────┤
│ • Strategy      │  (Founder, PM, UX Researcher)
│ • Design        │  (Designer, Accessibility)
│ • Build         │  (Planner, Security, Builder, Reviewer, Tester)
│ • Ship          │  (Tech Writer, SRE, Data Analyst)
└────────┬────────┘
         ↓
    Your Code
```

---

## The 13 Agents

Each agent is an AI specialist with a specific job:

### Strategy Team (What to build)
| Agent | Role | Output |
|-------|------|--------|
| **Founder** | Understands your vision, makes strategic decisions | Product direction |
| **Product Manager** | Defines features, writes requirements | PRD (Product Requirements Document) |
| **UX Researcher** | Understands users, validates ideas | User insights |

### Design Team (How it looks)
| Agent | Role | Output |
|-------|------|--------|
| **Designer** | Creates UI/UX designs | Design specifications |
| **Accessibility** | Ensures everyone can use it | WCAG compliance |

### Build Team (The code)
| Agent | Role | Output |
|-------|------|--------|
| **Planner** | Breaks work into technical tasks | Implementation plan |
| **Security** | Identifies vulnerabilities | Security review |
| **Builder** | Writes the actual code | Production-ready code |
| **Reviewer** | Reviews code for quality | Code review feedback |
| **Tester** | Writes and runs tests | Test coverage |

### Ship Team (Get it live)
| Agent | Role | Output |
|-------|------|--------|
| **Tech Writer** | Creates documentation | README, API docs |
| **SRE** | Handles deployment, monitoring | Infrastructure code |
| **Data Analyst** | Sets up analytics | Tracking plan |

---

## Key Features

### 🛡️ Production-Ready Code
Every agent is trained to write code that:
- Handles errors properly (try/catch everywhere)
- Uses TypeScript types (no `any`)
- Is accessible (WCAG 2.1 AA)
- Is secure (no SQL injection, XSS prevention)
- Has tests

### 💾 Persistent Memory
- **Chat History**: Conversations saved to SQLite with per-user sessions
- **Semantic Memory**: Long-term vector storage (ChromaDB + OpenAI embeddings)
- **Thread Context**: Each conversation has a unique `threadId`

### 🔒 Security Built-In
- **JWT Authentication**: Secure user login with refresh tokens
- **API Key Authentication**: Set `HIVE_API_KEY` to require auth on all requests
- **Security Headers**: XSS, CSRF, clickjacking protection
- **Rate Limiting**: 100 requests/minute protection
- **Audit Trail**: Every action logged with retention policies

### 📊 Full Observability
- **Sentry Integration**: Error monitoring and alerting
- **Health Probes**: `/health`, `/health/live`, `/health/ready` for K8s
- **Cost Tracking**: Know exactly how many tokens (and dollars) each conversation uses
- **Request Logging**: Structured JSON logs with tracing

### ⚡ Performance Optimized
- **Response Caching**: Repeated queries are fast
- **SSE Streaming**: Results stream in real-time
- **SQLite Backups**: Automated dump/restore with `npm run backup`

### 🎤 Voice Input
- **Web Speech API**: Native browser voice recognition (Chrome)
- **Whisper Fallback**: OpenAI transcription for other browsers

### 👥 Multi-User Workspaces
- **Organizations**: Team workspaces with shared projects
- **RBAC**: Owner, Admin, and Member roles
- **Invitations**: Email-based team invites

### 💳 Usage-Based Billing
- **Stripe Integration**: Subscription management
- **Tiered Pricing**: Free, Pro ($29), Team ($99), Enterprise
- **Usage Metering**: Track requests and tokens per user

---

## Project Structure

```
HIVE-R/
├── src/
│   ├── index.ts              # Main server (all API endpoints)
│   ├── agents/               # The 13 AI agents
│   │   ├── router.ts         # Traffic controller
│   │   ├── founder.ts
│   │   ├── product-manager.ts
│   │   ├── designer.ts
│   │   ├── builder.ts
│   │   └── ... (9 more)
│   ├── subgraphs/            # Agent groups
│   │   ├── strategy.ts       # Founder + PM + UX
│   │   ├── design.ts         # Designer + Accessibility
│   │   ├── build.ts          # Planner → Security → Builder → Reviewer → Tester
│   │   └── ship.ts           # Tech Writer + SRE + Data Analyst
│   ├── lib/                  # Core utilities
│   │   ├── state.ts          # Shared conversation state
│   │   ├── memory.ts         # SQLite persistence
│   │   ├── safety.ts         # Infinite loop protection
│   │   ├── logger.ts         # Structured logging
│   │   ├── tracing.ts        # Observability
│   │   ├── cache.ts          # LLM response caching
│   │   ├── cost-tracker.ts   # Token/cost tracking
│   │   ├── auth.ts           # API key middleware
│   │   └── production-standards.ts  # Code quality rules
│   └── tools/                # Agent capabilities
│       ├── files.ts          # Read/write files
│       ├── web.ts            # Web search
│       ├── testing.ts        # Run commands
│       └── code-validator.ts # ESLint, security scan, etc.
├── design-systems/           # Design tokens (colors, spacing, etc.)
├── tests/                    # Test suites
│   └── load/                 # Load testing
├── docs/                     # Documentation
└── data/                     # SQLite database (created automatically)
```

---

## How Everything Connects

### 1. A Request Comes In

When you POST to `/chat`, here's what happens:

```
POST /chat { message: "Build a login page" }
         ↓
   Auth Middleware (checks HIVE_API_KEY if set)
         ↓
   Rate Limiter (max 100 requests/minute)
         ↓
   Router Agent (decides: "This needs Designer + Builder")
         ↓
   Design Subgraph runs → Designer creates design spec
         ↓
   Build Subgraph runs → Builder writes code, Tester verifies
         ↓
   Response returned with all generated artifacts
```

### 2. Agents Share State

All agents share a common "state" object that includes:
- **messages**: The full conversation history
- **currentAgent**: Who's working right now
- **nextAgent**: Who should go next
- **artifacts**: Things produced (PRDs, designs, code)
- **turnCount**: How many turns have happened (prevents infinite loops)

### 3. Tools Give Agents Superpowers

Agents aren't just text generators. They can:
- **Read files** from your workspace
- **Write files** (create new code)
- **Run commands** (like `npm test`)
- **Search the web** (for documentation)
- **Validate code** (ESLint, TypeScript, security scan)

### 4. Safety Systems Prevent Runaway

Several systems prevent the AI from going off the rails:
- **MAX_TURNS** (50): Stops after 50 agent handoffs
- **Retry Limits** (3): Agents retry failed operations 3 times max
- **Circuit Breakers**: If an agent fails repeatedly, it's temporarily disabled
- **Timeouts**: Agent calls have time limits

---

## API Reference

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat` | POST | Send a message, get a response |
| `/chat/stream` | POST | Same, but streams the response |
| `/health` | GET | Is the server running? |
| `/agents` | GET | List all 13 agents |

### Debug Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/dashboard` | GET | System overview (health, costs, cache) |
| `/dashboard/costs` | GET | Token usage breakdown |
| `/dashboard/costs/:threadId` | GET | Cost for specific conversation |
| `/traces` | GET | List all conversation traces |
| `/traces/:threadId` | GET | Detailed trace for a conversation |
| `/state/:threadId` | GET | Raw state snapshot |
| `/metrics` | GET | Performance metrics (JSON) |
| `/metrics/prometheus` | GET | Prometheus-format metrics |

### Example Request

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"message": "Create a user profile component in React"}'
```

---

## Configuration

All configuration is done through environment variables:

### Required
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |

### Core Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HIVE_API_KEY` | (none) | Enable API authentication |
| `HIVE_WORKSPACE` | current directory | Where agents can read/write files |
| `DATABASE_PATH` | ./data/hive.db | SQLite database location |
| `JWT_SECRET` | (auto-generated) | Secret for JWT tokens |

### Semantic Memory (Optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `CHROMA_HOST` | localhost | ChromaDB server host |
| `CHROMA_PORT` | 8000 | ChromaDB server port |

### Error Monitoring (Optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | (none) | Sentry error tracking DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | 0.1 | Sentry performance sampling |

### Billing (Optional)
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro tier |
| `STRIPE_PRICE_TEAM` | Stripe Price ID for Team tier |

---

## Running HIVE-R

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/rwyatt2/HIVE-R.git
cd HIVE-R

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Run
npm run dev
```

---

## ⚠️ Security Setup (Important!)

**These files are NOT included in the repo for security reasons.** You must create them yourself:

### 1. Create your `.env` file

```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:

```
OPENAI_API_KEY=sk-your-key-here
HIVE_API_KEY=your-secret-password     # Optional: protects your API
```

### 2. Database is auto-created

The `data/` folder with `hive.db` is created automatically on first run. This contains your conversation history and is **not committed to git**.

### What's protected by `.gitignore`:

| File/Folder | Contains | Why it's private |
|-------------|----------|------------------|
| `.env` | API keys | Would expose your accounts |
| `data/*.db` | Conversations | User data / privacy |
| `*.key`, `*.pem` | SSL certs | Security credentials |

> **Never commit secrets to git!** If you accidentally do, rotate your API keys immediately.

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

---

## Testing

```bash
# Unit tests
npm run test

# With coverage
npm run test:coverage

# Load test (stress test)
npm run test:load

# Type check
npm run typecheck
```

---

## The Design System

HIVE-R includes a portable design system so all generated UIs look professional:

- **Colors**: Semantic colors (primary, secondary, success, error)
- **Typography**: Font families, sizes, weights
- **Spacing**: Consistent 4px base scale
- **Components**: Button sizes, input heights, etc.

Agents automatically use these tokens when generating UI code.

To export for your framework:
```bash
npm run export-tokens
# Outputs: CSS, Tailwind config, SCSS variables
```

---

## What Makes HIVE-R Different?

| Traditional AI Coding | HIVE-R |
|-----------------------|--------|
| Single agent | 13 specialized agents |
| Generates prototypes | Generates production code |
| No memory | Full conversation persistence |
| No coordination | Agents hand off work intelligently |
| Generic code | Code follows your design system |
| No validation | Built-in security, accessibility, type checking |

---

## Roadmap

- [x] ~~Direct agent-to-agent messaging~~ ✅
- [x] ~~Hierarchical teams~~ ✅
- [x] ~~Plugin system~~ ✅
- [x] ~~GitHub integration~~ ✅
- [x] ~~Visual workflow editor (HIVE-R Studio)~~ ✅

## Roadmap V2: Production & Ecosystem ✅ Complete

### ✅ Phase 11: Production Readiness
- [x] **Rate Limiting**: 100 req/min protection
- [x] **Health Checks**: `/health`, `/health/live`, `/health/ready`
- [x] **Error Alerting**: Sentry integration
- [x] **Security Audit**: Security headers, audit function
- [x] **Audit Trail**: Full request logging with retention
- [x] **SQLite Backups**: `npm run backup` / `npm run backup:restore`

### ✅ Phase 12: HIVE-R Studio Enhancements
- [x] **User Login**: JWT authentication with refresh tokens
- [x] **Real-time Graph**: SSE streaming to light up active edges
- [x] **Chat Persistence**: Save/load chat history per user
- [x] **Agent Config UI**: Edit agent prompts from web UI

### ✅ Phase 13: Marketing & Growth
- [x] **Landing Page**: `/landing` — High-converting homepage
- [x] **Demo Mode**: `/demo/*` — Read-only agent simulation
- [x] **Documentation**: `/docs` — Full setup and design guides

### ✅ Phase 14: Plugin Ecosystem
- [x] **Plugin Registry**: Self-hosted marketplace API
- [x] **Plugin Builder**: No-code UI to create plugins
- [x] **One-Click Install**: Download from registry
- [x] **Community Ratings**: Star/review system

### ✅ Phase 15: Agent & Project Enhancements
- [x] **Semantic Memory**: ChromaDB + OpenAI embeddings
- [x] **Voice Input**: Web Speech API + Whisper fallback
- [x] **Multi-User**: Organizations with RBAC
- [x] **Billing**: Stripe usage-based billing

### 🟢 Future / Scale
- [ ] **PostgreSQL**: Migration when scaling beyond 10k users

---

## New: Direct Agent Handoffs

Agents can now skip the Router and hand off directly to each other when the next step is obvious:

```
Designer → Builder (instead of Designer → Router → Builder)
```

### How It Works

Agents use the `handoff_to_agent` tool or return `{ next: "AgentName" }`:

```typescript
return createAgentResponse(content, "Designer", { next: "Builder" });
```

### Common Handoff Patterns

| From | To | When |
|------|-----|------|
| PM | Designer | PRD complete |
| Designer | Builder | Design spec ready |
| Builder | Tester | Code complete |
| Tester | Builder | Bug found |
| Reviewer | Builder | Changes requested |

This reduces latency and token costs by eliminating unnecessary Router calls.

---

## New: Hierarchical Teams (Parallel Execution)

The Product Manager can now act as a "Supervisor" to break large features into sub-tasks and delegate them to multiple agents in parallel.

### How It Works

1. **Map**: PM uses `delegate_task` to create sub-tasks
2. **Parallel**: Workers (Builders, Designers) run simultaneously
3. **Reduce**: A Synthesizer aggregates the results

### Usage

```bash
curl -X POST http://localhost:3000/workflow/hierarchical \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-key" \
  -d '{"message": "Create 3 React components: Button, Card, Navbar"}'
```

This massively speeds up complex features by running work concurrently.

---

## New: Plugin System (Custom Agents)

You can now extend HIVE-R with custom agents without modifying the core code.

### How It Works

1.  Create a `.js` file in the `plugins/` directory.
2.  Define an agent object with `name`, `role`, `description`, `systemPrompt`.
3.  Restart the server.

The Router will automatically detect the new agent and route relevant tasks to it.

### Example Plugin

```javascript
// plugins/marketing.js
export const MarketingExpert = {
  name: "MarketingExpert",
  role: "Marketing Strategist",
  description: "Creates tweets, blog outlines, and launch campaigns.",
  systemPrompt: "You are a world-class marketing guru...",
  keywords: ["tweet", "launch", "social media"] // Helps Router find you
};
```

---

## New: GitHub Integration (Auto-PRs)

Agents (specifically the SRE) can now automatically commit code and open Pull Requests.

### Setup

Add to your `.env` (requires a Personal Access Token with `repo` scope):
```bash
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
```

### Usage

Ask the SRE to ship your changes:
> "Ship the login feature as a PR"

The agent will:
1. Check for uncommitted changes
2. Create a feature branch
3. Commit and push code
4. Open a Pull Request with a summary of changes

---

## HIVE-R Studio (Visual Dashboard)

A visual web client to interact with your AI team.

### How to Run

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Client (Studio)
cd client && npm run dev

# Terminal 3: Landing Page
cd landing && npm run dev
```

Open **http://localhost:5173** to access the Studio.

### Features
- **Chat**: Talk to the team directly
- **Real-time Graph**: Watch agents light up as they work (SSE)
- **Session Sidebar**: Browse and restore past conversations
- **Agent Config**: Edit system prompts from the UI
- **Plugin Marketplace**: Browse, install, and rate plugins
- **Plugin Builder**: Create custom plugins with no code
- **Voice Input**: 🎤 Speak instead of typing
- **Demo Mode**: Try without an API key

---

## License

MIT

---

*Built with ❤️ for anyone who want to ship faster.*
