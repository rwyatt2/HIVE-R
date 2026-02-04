# Streaming API

HIVE-R supports real-time streaming via Server-Sent Events (SSE).

## Overview

The streaming endpoint allows you to:
- See responses as they're generated
- Watch agent handoffs in real-time
- Update UI progressively

## Endpoint

```
GET /chat/stream?message=<your-message>&threadId=<optional>
```

## Event Types

### agent_start

Emitted when an agent begins processing.

```json
{
  "type": "agent_start",
  "agent": "Builder",
  "timestamp": "2026-02-04T15:00:00.000Z"
}
```

### agent_end

Emitted when an agent finishes.

```json
{
  "type": "agent_end",
  "agent": "Builder",
  "timestamp": "2026-02-04T15:00:05.000Z"
}
```

### handoff

Emitted when work passes between agents.

```json
{
  "type": "handoff",
  "from": "Designer",
  "to": "Builder",
  "timestamp": "2026-02-04T15:00:02.000Z"
}
```

### chunk

Content chunks as they're generated.

```json
{
  "type": "chunk",
  "agent": "Builder",
  "content": "import React from ",
  "timestamp": "2026-02-04T15:00:03.000Z"
}
```

### complete

Stream finished.

```json
{
  "type": "complete",
  "threadId": "abc123",
  "artifacts": { ... }
}
```

## JavaScript Example

```javascript
function streamChat(message) {
  const url = `/chat/stream?message=${encodeURIComponent(message)}`;
  const eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'agent_start':
        console.log(`🚀 ${data.agent} started`);
        break;
      case 'chunk':
        process.stdout.write(data.content);
        break;
      case 'complete':
        console.log('\n✅ Complete');
        eventSource.close();
        break;
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('Stream error:', error);
    eventSource.close();
  };
}
```

## React Hook Example

```tsx
function useAgentStream(url: string) {
  const [content, setContent] = useState('');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  
  useEffect(() => {
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'agent_start') {
        setActiveAgent(data.agent);
      } else if (data.type === 'chunk') {
        setContent(prev => prev + data.content);
      } else if (data.type === 'complete') {
        setActiveAgent(null);
        eventSource.close();
      }
    };
    
    return () => eventSource.close();
  }, [url]);
  
  return { content, activeAgent };
}
```

## Timeout Handling

Streams have a 5-minute timeout. For long-running requests, the client should:

1. Store the `threadId` from the response
2. Reconnect if the stream closes
3. Resume using the same `threadId`
