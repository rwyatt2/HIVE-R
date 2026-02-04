# Subgraphs

Subgraphs are groups of related agents that work together on specific phases of development.

## What is a Subgraph?

A subgraph is a LangGraph StateGraph that connects multiple agents in a flow. When the Router determines a request needs strategy work, for example, it activates the Strategy subgraph.

## The Four Subgraphs

### Strategy Subgraph

**Purpose:** Define what to build

**Agents:**
1. **Founder** → Validates vision and business model
2. **Product Manager** → Writes requirements and user stories
3. **UX Researcher** → Provides user insights

**Flow:**
```
Founder → Product Manager → UX Researcher
```

**Use when:** Starting a new project, defining features, validating ideas

---

### Design Subgraph

**Purpose:** Define how it looks

**Agents:**
1. **Designer** → Creates UI/UX specifications
2. **Accessibility** → Ensures WCAG compliance

**Flow:**
```
Designer → Accessibility
```

**Use when:** Creating UI components, designing interfaces, styling

---

### Build Subgraph

**Purpose:** Write the code

**Agents:**
1. **Planner** → Designs architecture and breaks down tasks
2. **Security** → Reviews for vulnerabilities
3. **Builder** → Writes the actual code
4. **Reviewer** → Performs code review
5. **Tester** → Writes tests

**Flow:**
```
Planner → Security → Builder → Reviewer → Tester
          ↑                         ↓
          └─────── (if issues) ─────┘
```

**Use when:** Building features, writing APIs, generating components

---

### Ship Subgraph

**Purpose:** Get it live

**Agents:**
1. **Tech Writer** → Creates documentation
2. **SRE** → Configures deployment
3. **Data Analyst** → Sets up analytics

**Flow:**
```
Tech Writer → SRE → Data Analyst
```

**Use when:** Preparing for deployment, adding docs, setting up monitoring

---

## Direct Subgraph Access

You can invoke subgraphs directly via the API:

```bash
# Run only the strategy phase
POST /workflow/strategy
{ "message": "Define requirements for a todo app" }

# Run only the design phase
POST /workflow/design
{ "message": "Design a dark-themed login page" }

# Run only the build phase
POST /workflow/build
{ "message": "Build a REST API for user management" }

# Run only the ship phase
POST /workflow/ship
{ "message": "Create documentation for the user API" }
```

## Combining Subgraphs

For complex requests, the Router may activate multiple subgraphs in sequence:

```
"Build a complete blog application with admin dashboard"

Strategy → Design → Build → Ship
```

The state flows between subgraphs, with each building on the previous work.
