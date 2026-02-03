---
description: Use HIVE-R agents for full product development
---

# HIVE-R Workflow

## Setup (One Time)

1. Ensure HIVE-R server is running:
```bash
cd /Users/mnstr/Desktop/HIVE-R
npm run dev
```

2. Link the CLI globally:
```bash
npm run build && npm link
```

---

## Quick Start

// turbo
```bash
hive -i
```

This starts interactive mode with your current directory as context.

---

## Context Templates

Use these structures for high-quality results:

### New Feature
```
[CONTEXT]
Project: {name}
Working Directory: {pwd}
Tech Stack: {brief}

[REQUIREMENT]
{what you need}

[CONSTRAINTS]
- {constraint_1}
- {constraint_2}
```

### Full Sprint
```
[PROJECT]
Type: {SaaS/PaaS/Enterprise}
Name: {name}
Problem: {1-2 sentences}

[TECH STACK]
Frontend: {framework}
Backend: {stack}
Database: {db}

[MVP FEATURES]
1. {feature_1}
2. {feature_2}

[ASK]
Run a full product sprint.
```

### Debug
```
[BUG]
Expected: {what should happen}
Actual: {what happens}
Error: {paste error}

[ASK]
Help me fix this.
```

---

## Agent-Specific Commands

- `@Founder` — Vision validation
- `@ProductManager` — PRD, user stories
- `@Designer` — UX/UI specs
- `@Planner` — Architecture
- `@Builder` — Implementation
- `@Security` — Security review
- `@Tester` — Test plans

---

## Power Tips

1. **Always include your working directory**
2. **Paste actual errors, not summaries**
3. **Reference specific files by path**
4. **State constraints upfront**
5. **Iterate with [FEEDBACK] blocks**

See full guide: `/docs/PROMPTING_GUIDE.md`
