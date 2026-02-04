/**
 * HIVE-R Studio - Main Application
 * 
 * Phase 12: Chat persistence, session sidebar, real-time graph, and user auth
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Docs } from './components/Docs';
import { SessionSidebar } from './components/SessionSidebar';
import { AgentNode } from './components/AgentNode';
import { LoginPage } from './components/LoginPage';
import { AgentConfigPage } from './components/AgentConfigPage';
import { PluginBuilder } from './components/PluginBuilder';
import { Marketplace } from './components/PluginMarketplace';
import { useChatPersistence, type Message } from './hooks/useChatPersistence';
import { useAgentStream, type StreamEvent } from './hooks/useAgentStream';
import { useAuth } from './contexts/AuthContext';
import { LogOut, User, Settings, Package } from 'lucide-react';

// Register custom node types
const nodeTypes = {
  agent: AgentNode,
};

// ============================================================================
// INITIAL GRAPH DATA
// ============================================================================

const initialNodes: Node[] = [
  { id: 'Router', position: { x: 300, y: 0 }, data: { label: '🧭 Router' }, type: 'agent' },
  { id: 'Founder', position: { x: 50, y: 100 }, data: { label: '👔 Founder' }, type: 'agent' },
  { id: 'ProductManager', position: { x: 200, y: 100 }, data: { label: '📋 PM' }, type: 'agent' },
  { id: 'UXResearcher', position: { x: 350, y: 100 }, data: { label: '🔬 UX Researcher' }, type: 'agent' },
  { id: 'Designer', position: { x: 500, y: 100 }, data: { label: '🎨 Designer' }, type: 'agent' },
  { id: 'Accessibility', position: { x: 650, y: 100 }, data: { label: '♿ A11y' }, type: 'agent' },
  { id: 'Planner', position: { x: 50, y: 200 }, data: { label: '📐 Planner' }, type: 'agent' },
  { id: 'Security', position: { x: 200, y: 200 }, data: { label: '🔒 Security' }, type: 'agent' },
  { id: 'Builder', position: { x: 350, y: 200 }, data: { label: '🛠️ Builder' }, type: 'agent' },
  { id: 'Reviewer', position: { x: 500, y: 200 }, data: { label: '👀 Reviewer' }, type: 'agent' },
  { id: 'Tester', position: { x: 650, y: 200 }, data: { label: '🧪 Tester' }, type: 'agent' },
  { id: 'TechWriter', position: { x: 50, y: 300 }, data: { label: '✍️ Tech Writer' }, type: 'agent' },
  { id: 'SRE', position: { x: 200, y: 300 }, data: { label: '🚀 SRE' }, type: 'agent' },
  { id: 'DataAnalyst', position: { x: 350, y: 300 }, data: { label: '📊 Data Analyst' }, type: 'agent' },
];

const initialEdges: Edge[] = [
  { id: 'e-router-founder', source: 'Router', target: 'Founder' },
  { id: 'e-router-pm', source: 'Router', target: 'ProductManager' },
  { id: 'e-router-ux', source: 'Router', target: 'UXResearcher' },
  { id: 'e-router-designer', source: 'Router', target: 'Designer' },
  { id: 'e-router-a11y', source: 'Router', target: 'Accessibility' },
  { id: 'e-router-planner', source: 'Router', target: 'Planner' },
  { id: 'e-router-security', source: 'Router', target: 'Security' },
  { id: 'e-router-builder', source: 'Router', target: 'Builder' },
  { id: 'e-router-reviewer', source: 'Router', target: 'Reviewer' },
  { id: 'e-router-tester', source: 'Router', target: 'Tester' },
  { id: 'e-router-techwriter', source: 'Router', target: 'TechWriter' },
  { id: 'e-router-sre', source: 'Router', target: 'SRE' },
  { id: 'e-router-dataanalyst', source: 'Router', target: 'DataAnalyst' },
  // Direct handoffs
  { id: 'e-designer-builder', source: 'Designer', target: 'Builder', style: { stroke: '#22c55e' } },
  { id: 'e-builder-tester', source: 'Builder', target: 'Tester', style: { stroke: '#22c55e' } },
  { id: 'e-tester-builder', source: 'Tester', target: 'Builder', style: { stroke: '#f59e0b' } },
];

// ============================================================================
// CHAT INTERFACE
// ============================================================================

function ChatPanel({
  messages,
  onSend,
  onOpenDocs,
  isLoading,
  activeAgent
}: {
  messages: Message[];
  onSend: (msg: string) => void;
  onOpenDocs: () => void;
  isLoading?: boolean;
  activeAgent?: string | null;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>💬 HIVE-R Studio</h2>
        <button className="docs-button" onClick={onOpenDocs} title="Getting Started">
          📚 Docs
        </button>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">🐝</div>
            <h3>Welcome to HIVE-R Studio!</h3>
            <p>I coordinate a team of 13 AI specialists. What would you like to build today?</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.agentName && <span className="agent-name">{msg.agentName}</span>}
            <p>{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="message agent loading">
            {activeAgent && <span className="agent-name">{activeAgent}</span>}
            <span className="typing-indicator">
              <span></span><span></span><span></span>
            </span>
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What would you like to build?"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}

// ============================================================================
// USER MENU
// ============================================================================

function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <div className="user-menu">
      <button
        className="user-menu-trigger"
        onClick={() => setShowMenu(!showMenu)}
      >
        <User size={18} />
        <span>{user?.email}</span>
      </button>
      {showMenu && (
        <div className="user-menu-dropdown">
          <button onClick={() => { logout(); setShowMenu(false); }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [showDocs, setShowDocs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showPluginBuilder, setShowPluginBuilder] = useState(false);

  // Chat persistence
  const {
    messages,
    sessions,
    currentSessionId,
    addMessage,
    createNewSession,
    switchSession,
    deleteSession,
    isLoading
  } = useChatPersistence();

  // Handle stream events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'agent_start':
        setActiveAgent(event.agent || null);
        break;
      case 'agent_end':
        // Keep active agent until next one starts or stream ends
        break;
      case 'handoff':
        setActiveAgent(event.to || null);
        break;
      case 'done':
        setActiveAgent(null);
        setIsProcessing(false);
        break;
      case 'error':
        setActiveAgent(null);
        setIsProcessing(false);
        addMessage('agent', event.content || 'An error occurred', 'System');
        break;
    }
  }, [addMessage]);

  // Handle incoming messages from stream
  const handleStreamMessage = useCallback((content: string, agent: string) => {
    addMessage('agent', content, agent);
  }, [addMessage]);

  // Agent stream hook
  const { connect } = useAgentStream({
    onEvent: handleStreamEvent,
    onMessage: handleStreamMessage
  });

  // Update nodes with active state
  const animatedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isActive: node.id === activeAgent,
        isThinking: node.id === activeAgent && isProcessing
      }
    }));
  }, [nodes, activeAgent, isProcessing]);

  // Update edges with animation
  const animatedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      animated: edge.source === activeAgent || edge.target === activeAgent,
      style: {
        ...edge.style,
        stroke: (edge.source === activeAgent || edge.target === activeAgent)
          ? '#22c55e'
          : edge.style?.stroke || '#64748b'
      }
    }));
  }, [edges, activeAgent]);

  // Create initial session if none exists
  useEffect(() => {
    if (!isLoading && !currentSessionId && messages.length === 0) {
      createNewSession();
    }
  }, [isLoading, currentSessionId, messages.length, createNewSession]);

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
    addMessage('user', content);
    setIsProcessing(true);
    setActiveAgent('Router'); // Start with Router

    if (useStreaming) {
      // Use SSE streaming
      connect(content, currentSessionId || undefined);
    } else {
      // Fall back to regular API
      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            threadId: currentSessionId
          })
        });

        if (response.ok) {
          const data = await response.json();
          const lastAgent = data.contributors?.[data.contributors.length - 1] || 'Router';
          addMessage('agent', data.result, lastAgent);
        } else {
          addMessage('agent', 'Sorry, there was an error processing your request.', 'System');
        }
      } catch (error) {
        console.error('Chat error:', error);
        addMessage('agent', 'Unable to connect to the server. Please try again.', 'System');
      }
      setIsProcessing(false);
      setActiveAgent(null);
    }
  };

  // Map messages to include agent field for display
  const displayMessages: Message[] = messages.map(m => ({
    ...m,
    agentName: m.agentName || (m.role === 'agent' ? 'Router' : undefined)
  }));

  // Show login page if not authenticated and not in demo mode
  if (!authLoading && !isAuthenticated && !demoMode) {
    return <LoginPage onSuccess={() => setDemoMode(true)} />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-logo">🐝</div>
          <span className="typing-indicator">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewSession={createNewSession}
          onSelectSession={switchSession}
          onDeleteSession={deleteSession}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <ChatPanel
          messages={displayMessages}
          onSend={handleSend}
          onOpenDocs={() => setShowDocs(true)}
          isLoading={isProcessing}
          activeAgent={activeAgent}
        />
        <div className="graph-panel">
          <div className="graph-controls">
            <button className="config-button" onClick={() => setShowMarketplace(true)} title="Plugin Marketplace">
              <Package size={18} />
            </button>
            <button className="config-button" onClick={() => setShowConfig(true)} title="Agent Config">
              <Settings size={18} />
            </button>
            <UserMenu />
            <label className="streaming-toggle">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
              />
              <span>Real-time streaming</span>
            </label>
          </div>
          <ReactFlow
            nodes={animatedNodes}
            edges={animatedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
      {showDocs && <Docs onClose={() => setShowDocs(false)} />}
      {showConfig && <AgentConfigPage onClose={() => setShowConfig(false)} />}
      {showMarketplace && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <Marketplace
              onClose={() => setShowMarketplace(false)}
              onOpenBuilder={() => {
                setShowMarketplace(false);
                setShowPluginBuilder(true);
              }}
              accessToken={localStorage.getItem('accessToken')}
            />
          </div>
        </div>
      )}
      {showPluginBuilder && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <PluginBuilder
              onClose={() => setShowPluginBuilder(false)}
              accessToken={localStorage.getItem('accessToken')}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
