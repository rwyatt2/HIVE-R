/**
 * HIVE-R Studio - Main Application
 * 
 * Phase 13: UI Redesign and Layout Overhaul
 * Enterprise Minimal Design System
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
import { getAgentGraphData } from './lib/graph-layout';
import { SessionList } from './components/SessionList';
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
import { Send, StopCircle, MessageSquare, Puzzle } from 'lucide-react';
import { cn } from './lib/utils';

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
  isLoading,
  activeAgent,
  currentSessionId,
  onNewSession,
  onSelectSession
}: {
  messages: Message[];
  onSend: (msg: string) => void;
  isLoading?: boolean;
  activeAgent?: string | null;
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
}) {
  const [input, setInput] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'sessions'>('chat');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <Card
      variant="default"
      className="flex flex-col h-full overflow-hidden shadow-sm border-border bg-card"
    >
      {/* Header — Tabs */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-card min-h-12">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {[
            { id: 'chat' as const, label: 'Studio Chat', icon: MessageSquare },
            { id: 'sessions' as const, label: 'Sessions', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeView === 'chat' ? (
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-5">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Welcome to HIVE-R Studio!</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                  I coordinate a team of 13 AI specialists. What would you like to build today?
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 w-full max-w-[220px]">
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
                    className="w-full h-9 px-4 text-sm bg-background hover:bg-secondary transition-all rounded-md border-border"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-start max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 border border-border ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-2' : 'bg-secondary text-secondary-foreground mr-2'}`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`p-3 rounded-xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-secondary/50 border border-border rounded-tl-none text-foreground'}`}>
                  {msg.agentName && <span className="block text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wide">{msg.agentName}</span>}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-primary text-sm p-4">
              {activeAgent && <span className="font-medium">{activeAgent}</span>}
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-background/50">
          <SessionList
            selectedId={currentSessionId}
            onSelectSession={onSelectSession}
            onNewChat={onNewSession}
          />
        </div>
      )}

      {/* Input Area */}
      {activeView === 'chat' && (
        <div className="p-4 border-t border-border bg-card">
          <form className="relative" onSubmit={handleSubmit}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What would you like to build?"
              disabled={isLoading}
              className="pl-4 pr-12 h-11 bg-background border-border focus-visible:ring-primary/20"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              aria-label={isLoading ? 'Sending message' : 'Send message'}
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-md"
            >
              {isLoading ? <StopCircle className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [useStreaming] = useState(true);
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [showConfig, setShowConfig] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(showMarketplaceOnLoad);

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
      constrainWidth={false}
      isDemo={demoMode}
      sidebarProps={{
        collapsed: sidebarCollapsed,
        onToggle: () => setSidebarCollapsed(!sidebarCollapsed),
        sessions: sessions,
        currentSessionId: currentSessionId,
        onNewSession: createNewSession,
        onSelectSession: switchSession,
        onDeleteSession: deleteSession,
        onNavigate: (path) => navigate(path),
        activePath: 'studio',
        hideSessions: true
      }}
    >
      <div className="flex h-full gap-4 md:gap-6 p-6 md:p-8 overflow-hidden">
        {/* Chat Area - 30% */}
        <div className="hidden md:flex flex-col w-[400px] h-full shrink-0 gap-4">
          <ChatPanel
            messages={displayMessages}
            onSend={handleSend}
            isLoading={isProcessing}
            activeAgent={activeAgent}
            currentSessionId={currentSessionId}
            onNewSession={createNewSession}
            onSelectSession={switchSession}
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
        <Card variant="default" className="flex-1 relative h-full overflow-hidden border-border shadow-sm bg-secondary/5">
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
            <Controls className="bg-background border-border text-foreground fill-foreground rounded-md shadow-md" />
            <Background color="#71717a" gap={24} size={1} style={{ opacity: 0.1 }} />
          </ReactFlow>

          {/* Builder Preview Overlay — inset from edges */}
          {activeAgent === 'Builder' && (
            <div className="absolute bottom-12 left-12 z-20 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <CodeBuildPreview />
            </div>
          )}
        </Card>
      </div>

      {showConfig && <AgentConfigPage onClose={() => setShowConfig(false)} />}
      {showMarketplace && (
        <Marketplace
          onClose={() => setShowMarketplace(false)}
          onOpenBuilder={() => {}}
          accessToken={localStorage.getItem('accessToken')}
        />
      )}
    </LayoutShell>
  );
}

export default App;
