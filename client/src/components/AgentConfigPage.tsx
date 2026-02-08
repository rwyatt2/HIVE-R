/**
 * Agent Config Page Component
 */

import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AgentConfig {
    name: string;
    displayName: string;
    emoji: string;
    systemPrompt: string;
    isCustomized: boolean;
    updatedAt: string | null;
}

interface AgentConfigPageProps {
    onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AgentConfigPage({ onClose }: AgentConfigPageProps) {
    const { getAccessToken, isAuthenticated } = useAuth();
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch all agent configs
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch(`${API_BASE}/agents/config`);
                if (response.ok) {
                    const data = await response.json();
                    setAgents(data.agents);
                    if (data.agents.length > 0) {
                        const firstAgent = data.agents[0];
                        setSelectedAgentName(firstAgent.name);
                        setEditedPrompt(firstAgent.systemPrompt);
                        setOriginalPrompt(firstAgent.systemPrompt);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch agents:', err);
            }
            setIsLoading(false);
        };
        fetchAgents();
    }, []);

    // Handle agent selection - sync prompt editor
    const handleSelectAgent = (agentName: string) => {
        setSelectedAgentName(agentName);
        const agent = agents.find(a => a.name === agentName);
        if (agent) {
            setEditedPrompt(agent.systemPrompt);
            setOriginalPrompt(agent.systemPrompt);
            setMessage(null);
        }
    };

    const handleSave = async () => {
        if (!selectedAgentName || !isAuthenticated) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/agents/config/${selectedAgentName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ systemPrompt: editedPrompt })
            });

            if (response.ok) {
                const updatedConfig = await response.json();
                setAgents(prev => prev.map(a =>
                    a.name === selectedAgentName ? updatedConfig : a
                ));
                setOriginalPrompt(editedPrompt);
                setMessage({ type: 'success', text: 'Configuration saved!' });
            } else {
                const errData = await response.json();
                setMessage({ type: 'error', text: errData.error || 'Failed to save' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error' });
        }

        setIsSaving(false);
    };

    const handleReset = async () => {
        if (!selectedAgentName || !isAuthenticated) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/agents/config/${selectedAgentName}/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const resetConfig = await response.json();
                setAgents(prev => prev.map(a =>
                    a.name === selectedAgentName ? resetConfig : a
                ));
                setEditedPrompt(resetConfig.systemPrompt);
                setOriginalPrompt(resetConfig.systemPrompt);
                setMessage({ type: 'success', text: 'Reset to default!' });
            } else {
                const errData = await response.json();
                setMessage({ type: 'error', text: errData.error || 'Failed to reset' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error' });
        }

        setIsSaving(false);
    };

    const selectedAgent = agents.find(a => a.name === selectedAgentName);
    const hasChanges = editedPrompt !== originalPrompt;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card variant="glassmorphic" className="w-full max-w-6xl h-[85vh] flex overflow-hidden border-white/10 shadow-2xl relative bg-background-elevated/95">

                {/* Close Button */}
                <div className="absolute top-4 right-4 z-50">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Sidebar - Agent List */}
                <div className="w-[300px] border-r border-white/5 flex flex-col bg-background/50">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Agent Config
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Customize your AI team</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                        {agents.map(agent => (
                            <button
                                key={agent.name}
                                onClick={() => handleSelectAgent(agent.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${agent.name === selectedAgentName
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{agent.emoji}</span>
                                    <span className="font-medium">{agent.displayName}</span>
                                </div>
                                {agent.isCustomized && (
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full shadow-glow-sm" title="Customized" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content - Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-background/30">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : selectedAgent ? (
                        <>
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <span className="text-2xl pt-1">{selectedAgent.emoji}</span>
                                        {selectedAgent.displayName}
                                    </h3>
                                    {selectedAgent.isCustomized && (
                                        <Badge variant="warning" className="mt-2">Modified</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isAuthenticated && (
                                        <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 px-3 py-1.5 rounded-full border border-warning/20">
                                            <AlertCircle size={14} />
                                            <span>Sign in to edit</span>
                                        </div>
                                    )}
                                    {message && (
                                        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
                                            {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                                            {message.text}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                                <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
                                    System Prompt
                                    <span className="text-xs opacity-50">Markdown supported</span>
                                </label>
                                <div className="flex-1 relative rounded-xl border border-white/10 bg-black/40 overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                                    <textarea
                                        value={editedPrompt}
                                        onChange={(e) => setEditedPrompt(e.target.value)}
                                        placeholder="Enter the system prompt for this agent..."
                                        disabled={!isAuthenticated}
                                        className="w-full h-full p-4 bg-transparent border-0 resize-none focus:ring-0 text-sm font-mono leading-relaxed text-foreground/90 custom-scrollbar outline-none"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleReset}
                                    disabled={!isAuthenticated || !selectedAgent.isCustomized || isSaving}
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset to Default
                                </Button>
                                <Button
                                    variant="gradient"
                                    onClick={handleSave}
                                    disabled={!isAuthenticated || !hasChanges || isSaving}
                                    className="min-w-[140px]"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                            <p>Select an agent to customize their behavior</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
