# API Endpoints

Complete reference for the HIVE-R REST API.

## Base URL

```
http://localhost:3000
```

## Authentication

If `HIVE_API_KEY` is set, include it in requests:

```bash
-H "X-API-Key: your-api-key"
```

For user authentication, use Bearer tokens:

```bash
-H "Authorization: Bearer <access_token>"
```

---

## Chat Endpoints

### POST /chat

Send a message to the agent swarm.

**Request:**
```json
{
  "message": "Build a login page",
  "threadId": "optional-thread-id"
}
```

**Response:**
```json
{
  "response": "...",
  "threadId": "abc123",
  "agents": ["Router", "Designer", "Builder"],
  "artifacts": { ... }
}
```

### GET /chat/stream

Stream responses via Server-Sent Events.

**Query Parameters:**
- `message` - The user message
- `threadId` - Optional thread ID

**Event Types:**
```
agent_start  - Agent began processing
agent_end    - Agent finished
chunk        - Response content chunk
complete     - Stream finished
```

---

## History Endpoints

### GET /history/sessions

List all chat sessions.

### POST /history/sessions

Create a new session.

### GET /history/sessions/:id

Get session with messages.

### DELETE /history/sessions/:id

Delete a session.

---

## Auth Endpoints

### POST /auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### POST /auth/login

Authenticate and get tokens.

**Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "..." }
}
```

### POST /auth/refresh

Refresh access token.

### POST /auth/logout

Invalidate refresh token.

### GET /auth/me

Get current user (requires auth).

---

## Agent Config Endpoints

### GET /agents/config

List all agent configurations.

### GET /agents/config/:name

Get specific agent config.

### PUT /agents/config/:name

Update agent system prompt (requires auth).

### POST /agents/config/:name/reset

Reset to default prompt (requires auth).

---

## Workflow Endpoints

Direct access to subgraphs:

### POST /workflow/strategy

Run Strategy subgraph (Founder → PM → UX).

### POST /workflow/design

Run Design subgraph (Designer → Accessibility).

### POST /workflow/build

Run Build subgraph (Planner → Security → Builder → Reviewer → Tester).

### POST /workflow/ship

Run Ship subgraph (Tech Writer → SRE → Data Analyst).

---

## Demo Endpoints

### POST /demo/session

Create demo session.

### POST /demo/chat

Chat in demo mode (5 message limit).

### GET /demo/chat/stream

Stream demo responses.

---

## Health & Utility

### GET /health

Server health check.

### GET /agents-list

List all available agents.
