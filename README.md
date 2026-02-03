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
Conversations are saved to a database. If the server restarts, your work isn't lost. Each conversation has a unique `threadId` that tracks the entire history.

### 🔒 Security Built-In
- **API Key Authentication**: Set `HIVE_API_KEY` to require auth on all requests
- **Workspace Isolation**: Agents can only read/write files in the designated workspace
- **Rate Limiting**: Protection against abuse

### 📊 Full Observability
- **Tracing**: Every agent call is logged with timing
- **Cost Tracking**: Know exactly how many tokens (and dollars) each conversation uses
- **Dashboard**: `/dashboard` endpoint shows system health

### ⚡ Performance Optimized
- **Response Caching**: Repeated queries are fast
- **Streaming**: Results stream in real-time
- **Load Tested**: Designed to handle 100+ concurrent users

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

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HIVE_API_KEY` | (none) | Enable API authentication |
| `HIVE_WORKSPACE` | current directory | Where agents can read/write files |
| `HIVE_DESIGN_SYSTEM` | default | Design system preset |
| `DATABASE_PATH` | ./data/hive.db | SQLite database location |
| `LOG_LEVEL` | info | debug, info, warn, error |
| `HIVE_CACHE_ENABLED` | true | Enable response caching |

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

- [ ] Direct agent-to-agent messaging (skip Router)
- [ ] Hierarchical teams (PM manages multiple Builders)
- [ ] Plugin system for custom agents
- [ ] GitHub integration (auto-create PRs)
- [ ] Visual workflow editor

---

## License

MIT

---

*Built with ❤️ for developers who want to ship faster.*
