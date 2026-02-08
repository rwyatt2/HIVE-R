/**
 * HIVE-R Studio - Main Application
 * 
 * Phase 13: UI Redesign and Layout Overhaul
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
import { AgentNode } from './components/AgentNode';
import { CustomEdge } from './components/CustomEdge';
import { CodeBuildPreview } from './components/ui/code-build-preview';
import { LoginPage } from './components/LoginPage';
import { AgentConfigPage } from './components/AgentConfigPage';
import { PluginBuilder } from './components/PluginBuilder';
import { Marketplace } from './components/PluginMarketplace';
import { useChatPersistence, type Message } from './hooks/useChatPersistence';
import { useAgentStream, type StreamEvent } from './hooks/useAgentStream';
import { useAuth } from './contexts/AuthContext';
import { LayoutShell } from './components/layout/layout-shell';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Send, Book, Sparkles, StopCircle } from 'lucide-react';

// Register custom node types
const nodeTypes = {
  agent: AgentNode,
};

const edgeTypes = {
  'custom-edge': CustomEdge,
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
  { id: 'e-router-founder', source: 'Router', target: 'Founder', type: 'custom-edge' },
  { id: 'e-router-pm', source: 'Router', target: 'ProductManager', type: 'custom-edge' },
  { id: 'e-router-ux', source: 'Router', target: 'UXResearcher', type: 'custom-edge' },
  { id: 'e-router-designer', source: 'Router', target: 'Designer', type: 'custom-edge' },
  { id: 'e-router-a11y', source: 'Router', target: 'Accessibility', type: 'custom-edge' },
  { id: 'e-router-planner', source: 'Router', target: 'Planner', type: 'custom-edge' },
  { id: 'e-router-security', source: 'Router', target: 'Security', type: 'custom-edge' },
  { id: 'e-router-builder', source: 'Router', target: 'Builder', type: 'custom-edge' },
  { id: 'e-router-reviewer', source: 'Router', target: 'Reviewer', type: 'custom-edge' },
  { id: 'e-router-tester', source: 'Router', target: 'Tester', type: 'custom-edge' },
  { id: 'e-router-techwriter', source: 'Router', target: 'TechWriter', type: 'custom-edge' },
  { id: 'e-router-sre', source: 'Router', target: 'SRE', type: 'custom-edge' },
  { id: 'e-router-dataanalyst', source: 'Router', target: 'DataAnalyst', type: 'custom-edge' },
  // Direct handoffs
  { id: 'e-designer-builder', source: 'Designer', target: 'Builder', type: 'custom-edge', data: { variant: 'gradient' } },
  { id: 'e-builder-tester', source: 'Builder', target: 'Tester', type: 'custom-edge', data: { variant: 'gradient' } },
  { id: 'e-tester-builder', source: 'Tester', target: 'Builder', type: 'custom-edge', data: { variant: 'gradient' } },
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
    <Card variant="default" className="flex flex-col h-full rounded-2xl border-white/5 overflow-hidden shadow-2xl bg-void-900/40 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          <h2 className="font-semibold text-starlight-50">Studio Chat</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenDocs} title="Getting Started" className="text-starlight-400 hover:text-white">
          <Book className="h-4 w-4 mr-2" /> Docs
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-2xl mb-2">
              <span className="text-4xl">🐝</span>
            </div>
            <h3 className="text-xl font-bold">Welcome to HIVE-R Studio!</h3>
            <p className="text-muted-foreground max-w-sm">I coordinate a team of 13 AI specialists. What would you like to build today?</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Build a landing page", "Create a Python game", "Analyze data"].map(suggestion => (
                <Button key={suggestion} variant="secondary" size="sm" onClick={() => onSend(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-primary ml-2' : 'bg-secondary mr-2'}`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-white/10 rounded-tl-none'}`}>
                {msg.agentName && <span className="block text-xs font-bold mb-1 opacity-70 uppercase tracking-wide">{msg.agentName}</span>}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-primary text-sm p-4">
            {activeAgent && <span className="font-semibold">{activeAgent}</span>}
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
        <form className="relative" onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Summon the swarm..."
            disabled={isLoading}
            className="pr-12 h-14 bg-void-950/50 border-white/10 focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 rounded-xl text-starlight-50 placeholder:text-starlight-700 font-mono shadow-inner"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 h-10 w-10 bg-electric-violet hover:bg-electric-indigo text-white shadow-neon-violet transition-all duration-300 hover:scale-105"
          >
            {isLoading ? <StopCircle className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AppProps {
  demoMode?: boolean;
  showMarketplaceOnLoad?: boolean;
}

function App({ demoMode: initialDemoMode = false, showMarketplaceOnLoad = false }: AppProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [showDocs, setShowDocs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [useStreaming] = useState(true);
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [showConfig, setShowConfig] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(showMarketplaceOnLoad);
  const [showPluginBuilder, setShowPluginBuilder] = useState(false);

  const handleSavePlugin = (plugin: any) => {
    console.log('Saving plugin:', plugin);
    setShowPluginBuilder(false);
  };

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
    <LayoutShell
      noScroll
      sidebarProps={{
        collapsed: sidebarCollapsed,
        onToggle: () => setSidebarCollapsed(!sidebarCollapsed),
        sessions: sessions,
        currentSessionId: currentSessionId,
        onNewSession: createNewSession,
        onSelectSession: switchSession,
        onDeleteSession: deleteSession,
        onNavigate: (path) => console.log('Navigate to', path), // TODO: Real routing
        activePath: 'studio'
      }}
    >
      <div className="flex h-full gap-6 p-4 md:p-6 overflow-hidden">
        {/* Chat Area - 30% */}
        <div className="hidden md:flex flex-col w-[400px] h-full shrink-0">
          <ChatPanel
            messages={displayMessages}
            onSend={handleSend}
            onOpenDocs={() => setShowDocs(true)}
            isLoading={isProcessing}
            activeAgent={activeAgent}
          />
        </div>

        {/* Graph Area - 70% */}
        <Card variant="default" className="flex-1 relative h-full overflow-hidden border-white/5 shadow-2xl bg-void-950/30 glass">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button variant="secondary" size="icon" onClick={() => setShowMarketplace(true)} title="Plugin Marketplace" className="bg-void-900/80 border-white/10 text-honey hover:text-honey-glow hover:border-honey/30">
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
          <ReactFlow
            nodes={animatedNodes}
            edges={animatedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-transparent"
          >
            <Controls className="bg-void-900/80 border-white/10 fill-starlight-400" />
            <Background color="#6366F1" gap={30} size={1} style={{ opacity: 0.05 }} />
          </ReactFlow>

          {/* Builder Preview Overlay */}
          {activeAgent === 'Builder' && (
            <div className="absolute bottom-8 left-8 z-20 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <CodeBuildPreview />
            </div>
          )}
        </Card>
      </div>

      {showDocs && <Docs onClose={() => setShowDocs(false)} />}
      {showConfig && <AgentConfigPage onClose={() => setShowConfig(false)} />}
      {showMarketplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-6xl h-[85vh] bg-background-elevated rounded-2xl overflow-hidden shadow-2xl border border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-6xl h-[85vh] bg-background-elevated rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <PluginBuilder
              onClose={() => setShowPluginBuilder(false)}
              onSave={handleSavePlugin}
            />
          </div>
        </div>
      )}
    </LayoutShell>
  );
}

export default App;
