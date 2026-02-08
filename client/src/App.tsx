/**
 * HIVE-R Studio - Main Application
 * 
 * Phase 13: UI Redesign and Layout Overhaul
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import { getAgentGraphData } from './lib/graph-layout';
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
import { useAgentStatus } from './hooks/useAgentStatus';
import { useAuth } from './contexts/AuthContext';
import { LayoutShell } from './components/layout/layout-shell';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { AgentStatusPanel } from './components/AgentStatusPanel';
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

// Get auto-layouted graph data using Dagre
const { nodes: initialNodes, edges: initialEdges } = getAgentGraphData();

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
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-electric-violet/10 rounded-lg">
            <span className="text-lg">💬</span>
          </div>
          <h2 className="font-semibold text-base text-starlight-100">Studio Chat</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenDocs}
          title="Getting Started"
          className="text-starlight-400 hover:text-white hover:bg-white/5 px-3 py-1.5 h-auto"
        >
          <Book className="h-4 w-4 mr-1.5" />
          <span className="text-sm">Docs</span>
        </Button>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-5">
            <div className="w-16 h-16 flex items-center justify-center bg-electric-violet/10 rounded-2xl ring-1 ring-electric-violet/20">
              <span className="text-4xl">🐝</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-starlight-50">Welcome to HIVE-R Studio!</h3>
              <p className="text-sm text-starlight-400 max-w-[280px] leading-relaxed">
                I coordinate a team of 13 AI specialists. What would you like to build today?
              </p>
            </div>
            <div className="flex flex-col items-center gap-2.5 w-full max-w-[220px]">
              {[
                "Build a landing page",
                "Create a Python game",
                "Analyze data"
              ].map((label) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => onSend(label)}
                  className="w-full h-9 px-4 text-sm bg-white/[0.02] border-white/10 hover:bg-electric-violet/10 hover:border-electric-violet/30 hover:text-electric-violet transition-all"
                >
                  {label}
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

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <form className="relative" onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What would you like to build?"
            disabled={isLoading}
            className="pl-5 pr-14 h-12 bg-void-950/50 border-white/10 focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 rounded-xl text-sm text-starlight-50 placeholder:text-starlight-600 shadow-inner"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            aria-label={isLoading ? 'Sending message' : 'Send message'}
            className="absolute right-1.5 top-1.5 h-9 w-9 bg-electric-violet hover:bg-electric-indigo text-white shadow-neon-violet transition-all duration-200 hover:scale-105 disabled:opacity-30"
          >
            {isLoading ? <StopCircle className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
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
  const navigate = useNavigate();
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

  // Agent status tracking
  const { activeAgent: statusActiveAgent, queue, completed, processEvent } = useAgentStatus();

  // Handle stream events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    // Forward to status tracker
    processEvent(event);

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
  }, [addMessage, processEvent]);

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
        onNavigate: (path) => navigate(path),
        activePath: 'studio'
      }}
    >
      <div className="flex h-full gap-6 p-4 md:p-6 overflow-hidden">
        {/* Chat Area - 30% */}
        <div className="hidden md:flex flex-col w-[400px] h-full shrink-0 gap-4">
          <ChatPanel
            messages={displayMessages}
            onSend={handleSend}
            onOpenDocs={() => setShowDocs(true)}
            isLoading={isProcessing}
            activeAgent={activeAgent}
          />

          {/* Agent Status Panel */}
          <AgentStatusPanel
            activeAgent={statusActiveAgent}
            queue={queue}
            completed={completed}
            isStreaming={isProcessing}
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
