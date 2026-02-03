/**
 * HIVE-R Studio - Main Application
 */

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';

// ============================================================================
// INITIAL GRAPH DATA
// ============================================================================

const initialNodes: Node[] = [
  { id: 'Router', position: { x: 300, y: 0 }, data: { label: '🧭 Router' }, type: 'input' },
  { id: 'Founder', position: { x: 50, y: 100 }, data: { label: '👔 Founder' } },
  { id: 'ProductManager', position: { x: 200, y: 100 }, data: { label: '📋 PM' } },
  { id: 'UXResearcher', position: { x: 350, y: 100 }, data: { label: '🔬 UX Researcher' } },
  { id: 'Designer', position: { x: 500, y: 100 }, data: { label: '🎨 Designer' } },
  { id: 'Accessibility', position: { x: 650, y: 100 }, data: { label: '♿ A11y' } },
  { id: 'Planner', position: { x: 50, y: 200 }, data: { label: '📐 Planner' } },
  { id: 'Security', position: { x: 200, y: 200 }, data: { label: '🔒 Security' } },
  { id: 'Builder', position: { x: 350, y: 200 }, data: { label: '🛠️ Builder' } },
  { id: 'Reviewer', position: { x: 500, y: 200 }, data: { label: '👀 Reviewer' } },
  { id: 'Tester', position: { x: 650, y: 200 }, data: { label: '🧪 Tester' } },
  { id: 'TechWriter', position: { x: 50, y: 300 }, data: { label: '✍️ Tech Writer' } },
  { id: 'SRE', position: { x: 200, y: 300 }, data: { label: '🚀 SRE' } },
  { id: 'DataAnalyst', position: { x: 350, y: 300 }, data: { label: '📊 Data Analyst' } },
];

const initialEdges: Edge[] = [
  { id: 'e-router-founder', source: 'Router', target: 'Founder', animated: false },
  { id: 'e-router-pm', source: 'Router', target: 'ProductManager', animated: false },
  { id: 'e-router-ux', source: 'Router', target: 'UXResearcher', animated: false },
  { id: 'e-router-designer', source: 'Router', target: 'Designer', animated: false },
  { id: 'e-router-a11y', source: 'Router', target: 'Accessibility', animated: false },
  { id: 'e-router-planner', source: 'Router', target: 'Planner', animated: false },
  { id: 'e-router-security', source: 'Router', target: 'Security', animated: false },
  { id: 'e-router-builder', source: 'Router', target: 'Builder', animated: false },
  { id: 'e-router-reviewer', source: 'Router', target: 'Reviewer', animated: false },
  { id: 'e-router-tester', source: 'Router', target: 'Tester', animated: false },
  { id: 'e-router-techwriter', source: 'Router', target: 'TechWriter', animated: false },
  { id: 'e-router-sre', source: 'Router', target: 'SRE', animated: false },
  { id: 'e-router-dataanalyst', source: 'Router', target: 'DataAnalyst', animated: false },
  // Direct handoffs
  { id: 'e-designer-builder', source: 'Designer', target: 'Builder', animated: false, style: { stroke: '#22c55e' } },
  { id: 'e-builder-tester', source: 'Builder', target: 'Tester', animated: false, style: { stroke: '#22c55e' } },
  { id: 'e-tester-builder', source: 'Tester', target: 'Builder', animated: false, style: { stroke: '#f59e0b' } },
];

// ============================================================================
// CHAT INTERFACE
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'agent';
  agent?: string;
  content: string;
}

function ChatPanel({ messages, onSend }: { messages: Message[]; onSend: (msg: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>💬 HIVE-R Studio</h2>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.agent && <span className="agent-name">{msg.agent}</span>}
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What would you like to build?"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', agent: 'Router', content: 'Welcome to HIVE-R Studio! I coordinate a team of 13 AI specialists. What would you like to build today?' },
  ]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleSend = async (content: string) => {
    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);

    // TODO: Call backend API
    // For now, simulate a response
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        agent: 'Router',
        content: `I'll route your request to the appropriate team members. Processing: "${content}"`,
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 500);
  };

  return (
    <div className="app">
      <ChatPanel messages={messages} onSend={handleSend} />
      <div className="graph-panel">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
