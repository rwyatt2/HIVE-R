# Quick Start

Get productive with HIVE-R in 5 minutes.

## Example Prompts

### Build a Login Page

```
Build a login page with email and password fields,
a gradient background, and OAuth buttons for Google/GitHub.
```

**Agents involved:** Designer → Builder → Security → Accessibility

### Create a REST API

```
Create a REST API for managing blog posts with CRUD operations,
authentication, and pagination.
```

**Agents involved:** Planner → Security → Builder → Tester → Tech Writer

### Design a Dashboard

```
Design a dashboard showing sales metrics with charts,
a sidebar navigation, and export functionality.
```

**Agents involved:** UX Researcher → Designer → Builder → Accessibility

## Using the API

### Basic Request

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Build a todo app with React"}'
```

### With Thread ID (Memory)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add a due date feature",
    "threadId": "abc123"
  }'
```

### Streaming Response

```javascript
const eventSource = new EventSource('/chat/stream?message=...');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.content);
};
```

## Tips for Best Results

1. **Be Specific** - Include details about styling, libraries, or patterns you prefer
2. **Iterate** - Use the same thread ID to build on previous work
3. **Review Generated Code** - Agents provide production-ready code, but always review
4. **Use Design Systems** - Reference existing design tokens for consistent styling

## Next Steps

- [The 13 Agents](/concepts/agents) - Understand each agent's role
- [Prompting Guide](/reference/prompts) - Write better prompts
- [API Reference](/api/endpoints) - Full API documentation
