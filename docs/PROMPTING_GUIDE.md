# HIVE-R Prompting Guide

> **Master templates and best practices for building world-class applications with HIVE-R agents.**

---

## 🎯 The Golden Rule

**Be specific. Be structured. Provide context.**

HIVE-R agents excel when given:
1. **Clear objective** — What are you building?
2. **Constraints** — Tech stack, timeline, requirements
3. **Context** — Existing code, user personas, business goals

---

## 📋 Context Templates

### Template 1: New SaaS Product

```
[PROJECT]
Type: SaaS Application
Name: {product_name}
Target Users: {B2B/B2C/Enterprise}
Core Problem: {1-2 sentences}

[TECH STACK]
Frontend: {Next.js, React, Vue, etc.}
Backend: {Node, Python, Go, etc.}
Database: {PostgreSQL, MongoDB, etc.}
Auth: {Clerk, Auth0, NextAuth, etc.}
Hosting: {Vercel, AWS, GCP, etc.}

[REQUIREMENTS]
MVP Features:
1. {feature_1}
2. {feature_2}
3. {feature_3}

Non-Negotiables:
- {security_requirement}
- {performance_requirement}
- {compliance_requirement}

[CONTEXT]
Working Directory: {/path/to/project}
Existing Code: {Yes/No - describe briefly}
Design System: {Tailwind, MUI, custom, etc.}

[ASK]
{What you want HIVE-R to do}
```

---

### Template 2: Enterprise Tool

```
[PROJECT]
Type: Enterprise Internal Tool
Department: {Engineering, Sales, HR, etc.}
Users: {estimated_count}
Integration Requirements: {Slack, JIRA, Salesforce, etc.}

[CONSTRAINTS]
Security: {SOC2, HIPAA, GDPR requirements}
SSO: {Okta, Azure AD, etc.}
Data Residency: {if applicable}

[EXISTING SYSTEMS]
- {system_1}: {how to integrate}
- {system_2}: {how to integrate}

[ASK]
{What you want HIVE-R to do}
```

---

### Template 3: API/Platform (PaaS)

```
[PROJECT]
Type: Platform/API Service
Name: {platform_name}
Developer Target: {Who will use this API?}

[API DESIGN]
Style: {REST, GraphQL, gRPC}
Auth: {API Keys, OAuth, JWT}
Rate Limiting: {requests/min}
Versioning: {URL path, header, etc.}

[SCALE REQUIREMENTS]
Expected QPS: {queries per second}
Data Volume: {approximate}
Latency SLA: {p95, p99 targets}

[ASK]
{What you want HIVE-R to do}
```

---

### Template 4: Feature Addition

```
[CONTEXT]
Project: {project_name}
Working Directory: {/path/to/project}
Tech Stack: {brief summary}

[EXISTING FEATURE]
{Describe what exists already}

[NEW REQUIREMENT]
{What you want to add}

[CONSTRAINTS]
- Must integrate with: {existing_component}
- Cannot break: {existing_functionality}
- Deadline: {if applicable}

[ASK]
{Specific request}
```

---

### Template 5: Bug Fix / Debug

```
[CONTEXT]
Project: {project_name}
Working Directory: {/path/to/project}
File(s): {relevant files}

[BUG]
Expected: {what should happen}
Actual: {what happens instead}
Steps to Reproduce:
1. {step_1}
2. {step_2}

[ERROR MESSAGE]
```
{paste exact error}
```

[WHAT I'VE TRIED]
- {attempt_1}
- {attempt_2}

[ASK]
Help me fix this bug.
```

---

## 🧠 Agent-Specific Prompting

### Founder — Vision & Strategy
```
I'm building {product}. Help me validate:
1. Is this a real problem worth solving?
2. What's the differentiation opportunity?
3. What are the key risks?
```

### ProductManager — Requirements
```
Based on this vision: {vision_summary}

Create a PRD with:
- User personas
- User stories (Given/When/Then format)
- Success metrics
- MVP scope vs future iterations
```

### Designer — UX/UI
```
Design a {component/flow} that:
- Follows {design_system/brand}
- Prioritizes {key_user_action}
- Works on {mobile/desktop/both}
- Is accessible (WCAG AA)
```

### Planner — Architecture
```
Architect a system that:
- Handles {scale_requirement}
- Uses {tech_stack}
- Integrates with {external_systems}
- Can evolve to support {future_features}
```

### Builder — Implementation
```
Implement {feature} in {file_path}:
- Follow existing patterns in the codebase
- Include error handling
- Write self-documenting code
- Add tests if appropriate
```

### Security — Review
```
Review this {code/architecture} for:
- Authentication vulnerabilities
- Authorization gaps
- Data exposure risks
- Injection vectors
```

### Tester — QA
```
Create a test plan for {feature}:
- Happy path scenarios
- Edge cases
- Error conditions
- Performance considerations
```

---

## 🚀 Power Prompts

### Full Product Sprint
```
[PROJECT]
Type: SaaS
Name: TaskFlow
Problem: Teams struggle to track async work across timezones

[TECH STACK]
Frontend: Next.js 14, Tailwind, shadcn/ui
Backend: tRPC, Prisma, PostgreSQL
Auth: Clerk
Hosting: Vercel

[MVP FEATURES]
1. Real-time task board (Kanban)
2. Async standups with timezone awareness
3. Slack integration for notifications

[ASK]
Run a full product sprint:
1. Founder: Validate the problem
2. PM: Create PRD with user stories
3. Designer: Design the main dashboard
4. Planner: Architect the system
5. Builder: Implement the core task board component
```

### Deep Dive on Single Agent
```
[CONTEXT]
Project: E-commerce Platform
Working Directory: /Users/me/projects/shopify-clone
Existing: Basic product catalog implemented

[ASK]
@Security - Do a deep security review of:
1. The checkout flow (src/pages/checkout.tsx)
2. Payment integration (src/lib/stripe.ts)
3. User session handling

Provide:
- Vulnerability assessment
- Risk rating for each issue
- Recommended fixes with code examples
```

### Iterate on Feedback
```
[PREVIOUS CONTEXT]
You designed a dashboard for TaskFlow.

[FEEDBACK]
The design is good but:
- The sidebar is too cluttered
- Need more visual hierarchy in task cards
- Add dark mode support

[ASK]
Revise the design addressing this feedback.
```

---

## 📁 Save This as a Workflow

Create `.agent/workflows/hive.md`:

```markdown
---
description: Use HIVE-R for full product development
---

1. Start HIVE-R server: `npm run dev` in HIVE-R directory
2. Use the `hive` CLI from your project directory
3. Apply these context templates based on your task type
4. For complex work, use the full sprint prompt
5. For focused work, address specific agents (@Security, @Builder, etc.)
```

---

## 💡 Pro Tips

1. **Always include Working Directory** — Agents need to know where your code lives
2. **Paste actual errors** — Don't paraphrase, copy the exact output
3. **Reference specific files** — "Look at src/lib/auth.ts" beats "look at the auth code"
4. **State constraints upfront** — Don't let agents suggest things you can't use
5. **Use @Agent notation** — Direct specific agents for focused work
6. **Iterate, don't restart** — Build on previous responses with "[FEEDBACK]" prompts
