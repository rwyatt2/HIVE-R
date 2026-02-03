# HIVE-R Example Prompts

## SaaS: Project Management Tool

```
[PROJECT]
Type: SaaS Application
Name: FlowBoard
Target Users: Small tech teams (5-20 people)
Core Problem: Existing PM tools are bloated and expensive for small teams

[TECH STACK]
Frontend: Next.js 14, Tailwind CSS, shadcn/ui
Backend: Next.js API routes, Prisma ORM
Database: PostgreSQL (Supabase)
Auth: Clerk
Realtime: Supabase Realtime
Hosting: Vercel

[MVP FEATURES]
1. Kanban board with drag-and-drop
2. User assignments with @mentions
3. Due dates with calendar view
4. Slack notifications

Non-Negotiables:
- Mobile responsive
- Dark mode
- Keyboard shortcuts
- Sub-200ms interactions

[ASK]
Run a full product sprint to build the Kanban board feature.
```

---

## PaaS: AI API Platform

```
[PROJECT]
Type: Platform/API Service
Name: InferenceHub
Developer Target: ML engineers who want production-ready inference

[API DESIGN]
Style: REST with streaming for long-running inference
Auth: API Keys with usage tracking
Rate Limiting: 100 req/min free, 10k req/min premium
Versioning: URL path (v1, v2)

[SCALE REQUIREMENTS]
Expected QPS: 1000 at launch, 50k at scale
Data Volume: 10TB model artifacts
Latency SLA: p95 < 500ms, p99 < 2s for inference

[FEATURES]
1. Model registry with versioning
2. Automatic scaling based on queue depth
3. Usage dashboard with billing
4. SDK generation (Python, Node, Go)

[ASK]
Design the API schema and architecture for the core inference endpoint.
```

---

## Enterprise: Data Governance Dashboard

```
[PROJECT]
Type: Enterprise Internal Tool
Department: Data Engineering / Compliance
Users: ~50 data engineers, ~10 compliance officers
Integration Requirements: Snowflake, dbt, Slack, JIRA

[CONSTRAINTS]
Security: SOC2 Type II, audit logging required
SSO: Okta (SAML 2.0)
Data Residency: US-only for now

[FEATURES]
1. Data catalog with lineage visualization
2. PII detection and classification
3. Access request workflow with approvals
4. Compliance report generation

[EXISTING SYSTEMS]
- Snowflake: Primary data warehouse
- dbt: Transformation layer (read dbt manifests)
- Slack: Notifications for access requests
- JIRA: Create tickets for data issues

[ASK]
Create a technical architecture for the data catalog with lineage visualization.
```

---

## Capability: CLI Tool

```
[PROJECT]
Type: Developer Tool / Capability
Name: depcheck
Purpose: Analyze and visualize npm dependency health

[REQUIREMENTS]
1. Parse package.json and package-lock.json
2. Check for outdated, deprecated, or vulnerable packages
3. Generate markdown report
4. Exit codes for CI integration

[OUTPUT FORMAT]
┌─────────────────────────────────────────┐
│ depcheck v1.0.0                         │
├─────────────────────────────────────────┤
│ ✅ 42 packages up to date               │
│ ⚠️  3 packages outdated                  │
│ 🔴 1 package with critical vulnerability │
└─────────────────────────────────────────┘

[TECH STACK]
Language: TypeScript
Parser: npm-package-json-lint
Vuln DB: npm audit / Snyk API

[ASK]
Build this CLI tool with proper argument parsing and CI-friendly output.
```

---

## Quick Fix Template

```
[CONTEXT]
Project: FlowBoard
Working Directory: /Users/me/projects/flowboard
File: src/components/KanbanCard.tsx

[BUG]
Expected: Dragging card updates position immediately
Actual: Card snaps back, then updates after 500ms delay

[ERROR]
No console error, but React DevTools shows:
"Warning: Cannot update a component while rendering a different component"

[WHAT I'VE TRIED]
- Added useCallback around onDragEnd
- Moved state update to useEffect
- Still happens

[ASK]
Help me fix this drag-and-drop state update issue.
```
