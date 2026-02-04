# The 13 Agents

HIVE-R coordinates 13 specialized AI agents, each with a specific role in the development process.

## Strategy Team

These agents define **what** to build.

### 👔 Founder

The Founder agent understands your vision and makes strategic decisions about product direction. It validates business models and ensures alignment with goals.

**Outputs:** Product vision, strategic decisions

### 📋 Product Manager

The PM agent defines features, writes requirements, and prioritizes work. It creates Product Requirements Documents (PRDs) that guide the team.

**Outputs:** PRD, user stories, acceptance criteria

### 🔬 UX Researcher

The UX Researcher validates ideas and gathers user insights. It applies user research best practices to inform design decisions.

**Outputs:** User insights, research findings, recommendations

---

## Design Team

These agents define **how it looks**.

### 🎨 Designer

The Designer creates UI/UX designs following modern best practices. It generates design specifications, color schemes, and component layouts.

**Outputs:** Design specs, wireframes, style guides

### ♿ Accessibility

The Accessibility agent ensures WCAG 2.1 AA compliance. It reviews designs and code for accessibility issues and suggests improvements.

**Outputs:** Accessibility audit, ARIA recommendations

---

## Build Team

These agents write **the code**.

### 📐 Planner

The Planner breaks work into technical tasks and designs the architecture. It creates implementation plans before coding begins.

**Outputs:** Technical plan, architecture decisions

### 🔒 Security

The Security agent identifies vulnerabilities and security risks. It reviews code for common issues like SQL injection, XSS, and authentication flaws.

**Outputs:** Security review, vulnerability report

### 🛠️ Builder

The Builder is the primary code generator. It writes production-ready TypeScript/React code with proper error handling and types.

**Outputs:** Production-ready code, components, APIs

### 👀 Reviewer

The Reviewer performs code review, checking for best practices, maintainability, and potential issues.

**Outputs:** Code review feedback, improvement suggestions

### 🧪 Tester

The Tester writes and runs tests for generated code. It ensures adequate test coverage with unit and integration tests.

**Outputs:** Test suites, coverage reports

---

## Ship Team

These agents get it **live**.

### ✍️ Tech Writer

The Tech Writer creates documentation for generated code, including README files, API docs, and inline comments.

**Outputs:** Documentation, README, API reference

### 🚀 SRE

The SRE (Site Reliability Engineer) handles deployment configuration, monitoring setup, and infrastructure code.

**Outputs:** Dockerfile, CI/CD config, monitoring

### 📊 Data Analyst

The Data Analyst sets up analytics and tracking. It creates event schemas and implements tracking plans.

**Outputs:** Analytics plan, tracking implementation

---

## The Router 🧭

The Router is the "traffic controller" that receives your request and decides which agents should handle it. It analyzes the request and routes to the appropriate subgraph.

## How Agents Collaborate

Agents share a common state object that includes:

- **messages**: Full conversation history
- **currentAgent**: Who's working now
- **nextAgent**: Who goes next
- **artifacts**: Produced outputs (PRDs, designs, code)
- **turnCount**: Number of turns (prevents infinite loops)

Learn more in [Subgraphs](/concepts/subgraphs) and [Architecture](/concepts/architecture).
