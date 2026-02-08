/**
 * Agent Config Page Component
 * 
 * Enhanced with model selection, temperature/max tokens controls,
 * enable/disable toggles, and performance metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Save, Check, AlertCircle, Sparkles, Zap, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Available AI models
const AVAILABLE_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o', tier: '$$$' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', tier: '$' },
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', tier: '$$' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', tier: '$' },
];

interface AgentConfig {
    name: string;
    displayName: string;
    emoji: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    enabled: boolean;
    enableRouting: boolean;
    isCustomized: boolean;
    updatedAt: string | null;
}

interface AgentMetrics {
    avgResponseTime: number;
    totalCost: number;
    successRate: number;
    totalCalls: number;
}

interface AgentConfigPageProps {
    onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Default values for new config fields
const DEFAULT_CONFIG = {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    enabled: true,
    enableRouting: true,
};

export function AgentConfigPage({ onClose }: AgentConfigPageProps) {
    const { getAccessToken, isAuthenticated } = useAuth();
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);

    // Editable config state
    const [editedPrompt, setEditedPrompt] = useState('');
    const [editedModel, setEditedModel] = useState(DEFAULT_CONFIG.model);
    const [editedTemperature, setEditedTemperature] = useState(DEFAULT_CONFIG.temperature);
    const [editedMaxTokens, setEditedMaxTokens] = useState(DEFAULT_CONFIG.maxTokens);
    const [editedEnabled, setEditedEnabled] = useState(DEFAULT_CONFIG.enabled);
    const [editedEnableRouting, setEditedEnableRouting] = useState(DEFAULT_CONFIG.enableRouting);

    // Original values for change detection
    const [originalConfig, setOriginalConfig] = useState<Partial<AgentConfig>>({});

    // Metrics (mock data for now)
    const [metrics] = useState<AgentMetrics>({
        avgResponseTime: 2.3,
        totalCost: 12.45,
        successRate: 94,
        totalCalls: 156,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Check for unsaved changes
    const hasChanges = useCallback(() => {
        return (
            editedPrompt !== originalConfig.systemPrompt ||
            editedModel !== originalConfig.model ||
            editedTemperature !== originalConfig.temperature ||
            editedMaxTokens !== originalConfig.maxTokens ||
            editedEnabled !== originalConfig.enabled ||
            editedEnableRouting !== originalConfig.enableRouting
        );
    }, [editedPrompt, editedModel, editedTemperature, editedMaxTokens, editedEnabled, editedEnableRouting, originalConfig]);

    // Warn on navigation with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    // Fetch all agent configs
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch(`${API_BASE}/agents/config`);
                if (response.ok) {
                    const data = await response.json();
                    // Merge with defaults for any missing fields
                    const normalizedAgents = data.agents.map((agent: AgentConfig) => ({
                        ...DEFAULT_CONFIG,
                        ...agent,
                    }));
                    setAgents(normalizedAgents);
                    if (normalizedAgents.length > 0) {
                        selectAgent(normalizedAgents[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch agents:', err);
            }
            setIsLoading(false);
        };
        fetchAgents();
    }, []);

    const selectAgent = (agent: AgentConfig) => {
        setSelectedAgentName(agent.name);
        setEditedPrompt(agent.systemPrompt);
        setEditedModel(agent.model || DEFAULT_CONFIG.model);
        setEditedTemperature(agent.temperature ?? DEFAULT_CONFIG.temperature);
        setEditedMaxTokens(agent.maxTokens || DEFAULT_CONFIG.maxTokens);
        setEditedEnabled(agent.enabled ?? DEFAULT_CONFIG.enabled);
        setEditedEnableRouting(agent.enableRouting ?? DEFAULT_CONFIG.enableRouting);
        setOriginalConfig({
            systemPrompt: agent.systemPrompt,
            model: agent.model || DEFAULT_CONFIG.model,
            temperature: agent.temperature ?? DEFAULT_CONFIG.temperature,
            maxTokens: agent.maxTokens || DEFAULT_CONFIG.maxTokens,
            enabled: agent.enabled ?? DEFAULT_CONFIG.enabled,
            enableRouting: agent.enableRouting ?? DEFAULT_CONFIG.enableRouting,
        });
        setMessage(null);
    };

    const handleSelectAgent = (agentName: string) => {
        // Warn if unsaved changes
        if (hasChanges()) {
            if (!confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }
        const agent = agents.find(a => a.name === agentName);
        if (agent) selectAgent(agent);
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
                body: JSON.stringify({
                    systemPrompt: editedPrompt,
                    model: editedModel,
                    temperature: editedTemperature,
                    maxTokens: editedMaxTokens,
                    enabled: editedEnabled,
                    enableRouting: editedEnableRouting,
                })
            });

            if (response.ok) {
                const updatedConfig = await response.json();
                const normalizedConfig = { ...DEFAULT_CONFIG, ...updatedConfig };
                setAgents(prev => prev.map(a =>
                    a.name === selectedAgentName ? normalizedConfig : a
                ));
                setOriginalConfig({
                    systemPrompt: editedPrompt,
                    model: editedModel,
                    temperature: editedTemperature,
                    maxTokens: editedMaxTokens,
                    enabled: editedEnabled,
                    enableRouting: editedEnableRouting,
                });
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
        if (!confirm('Reset this agent to default configuration?')) return;

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
                const normalizedConfig = { ...DEFAULT_CONFIG, ...resetConfig };
                setAgents(prev => prev.map(a =>
                    a.name === selectedAgentName ? normalizedConfig : a
                ));
                selectAgent(normalizedConfig);
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

    const handleClose = () => {
        if (hasChanges()) {
            if (!confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }
        onClose();
    };

    const selectedAgent = agents.find(a => a.name === selectedAgentName);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="config-title"
        >
            <Card variant="glassmorphic" className="w-full max-w-6xl h-[85vh] flex overflow-hidden border-white/10 shadow-2xl relative bg-background-elevated/95">

                {/* Close Button */}
                <div className="absolute top-4 right-4 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-full hover:bg-white/10"
                        aria-label="Close configuration"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Sidebar - Agent List */}
                <div className="w-[280px] border-r border-white/5 flex flex-col bg-background/50">
                    <div className="p-6 border-b border-white/5">
                        <h2 id="config-title" className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Agent Config
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Customize your AI team</p>
                    </div>

                    <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1" aria-label="Agent list">
                        {agents.map(agent => (
                            <button
                                key={agent.name}
                                onClick={() => handleSelectAgent(agent.name)}
                                aria-current={agent.name === selectedAgentName ? 'true' : undefined}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${agent.name === selectedAgentName
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg" aria-hidden="true">{agent.emoji}</span>
                                    <span className="font-medium">{agent.displayName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!agent.enabled && (
                                        <Badge variant="secondary" className="text-xs">Off</Badge>
                                    )}
                                    {agent.isCustomized && (
                                        <div className="w-1.5 h-1.5 bg-warning rounded-full" title="Customized" aria-label="Customized" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content - Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-background/30 overflow-hidden">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center" aria-label="Loading">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : selectedAgent ? (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <span className="text-2xl" aria-hidden="true">{selectedAgent.emoji}</span>
                                        {selectedAgent.displayName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {selectedAgent.isCustomized && (
                                            <Badge variant="warning">Modified</Badge>
                                        )}
                                        {hasChanges() && (
                                            <Badge variant="secondary">Unsaved changes</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isAuthenticated && (
                                        <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 px-3 py-1.5 rounded-full border border-warning/20">
                                            <AlertCircle size={14} />
                                            <span>Sign in to edit</span>
                                        </div>
                                    )}
                                    {message && (
                                        <div
                                            role="alert"
                                            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${message.type === 'success'
                                                    ? 'bg-success/10 border-success/20 text-success'
                                                    : 'bg-error/10 border-error/20 text-error'
                                                }`}
                                        >
                                            {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                                            {message.text}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                                {/* Model Settings */}
                                <section aria-labelledby="model-settings-label">
                                    <h4 id="model-settings-label" className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Model Settings
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Model Select */}
                                        <div>
                                            <label htmlFor="model-select" className="text-xs text-muted-foreground block mb-2">
                                                Primary Model
                                            </label>
                                            <select
                                                id="model-select"
                                                value={editedModel}
                                                onChange={(e) => setEditedModel(e.target.value)}
                                                disabled={!isAuthenticated}
                                                className="w-full h-10 px-3 bg-void-900/60 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                                            >
                                                {AVAILABLE_MODELS.map(model => (
                                                    <option key={model.value} value={model.value}>
                                                        {model.label} ({model.tier})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Max Tokens */}
                                        <div>
                                            <label htmlFor="max-tokens" className="text-xs text-muted-foreground block mb-2">
                                                Max Tokens
                                            </label>
                                            <input
                                                id="max-tokens"
                                                type="number"
                                                min={500}
                                                max={8000}
                                                step={100}
                                                value={editedMaxTokens}
                                                onChange={(e) => setEditedMaxTokens(parseInt(e.target.value) || 2000)}
                                                disabled={!isAuthenticated}
                                                className="w-full h-10 px-3 bg-void-900/60 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Temperature Slider */}
                                    <div className="mt-4">
                                        <label htmlFor="temperature" className="text-xs text-muted-foreground flex items-center justify-between mb-2">
                                            <span>Temperature</span>
                                            <span className="font-mono text-foreground">{editedTemperature.toFixed(1)}</span>
                                        </label>
                                        <input
                                            id="temperature"
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            value={editedTemperature}
                                            onChange={(e) => setEditedTemperature(parseFloat(e.target.value))}
                                            disabled={!isAuthenticated}
                                            className="w-full h-2 bg-void-900 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>Precise</span>
                                            <span>Creative</span>
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="mt-4 space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editedEnableRouting}
                                                onChange={(e) => setEditedEnableRouting(e.target.checked)}
                                                disabled={!isAuthenticated}
                                                className="w-4 h-4 rounded border-white/20 bg-void-900 text-primary focus:ring-primary/30 disabled:opacity-50"
                                            />
                                            <span className="text-sm">Enable Model Routing (cost optimization)</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editedEnabled}
                                                onChange={(e) => setEditedEnabled(e.target.checked)}
                                                disabled={!isAuthenticated}
                                                className="w-4 h-4 rounded border-white/20 bg-void-900 text-primary focus:ring-primary/30 disabled:opacity-50"
                                            />
                                            <span className="text-sm">Enable this agent</span>
                                        </label>
                                    </div>
                                </section>

                                {/* System Prompt */}
                                <section aria-labelledby="prompt-label">
                                    <label id="prompt-label" className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-between">
                                        System Prompt
                                        <span className="text-xs opacity-50 font-normal">Markdown supported</span>
                                    </label>
                                    <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                                        <textarea
                                            value={editedPrompt}
                                            onChange={(e) => setEditedPrompt(e.target.value)}
                                            placeholder="Enter the system prompt for this agent..."
                                            disabled={!isAuthenticated}
                                            aria-describedby="prompt-label"
                                            className="w-full h-48 p-4 bg-transparent border-0 resize-none focus:ring-0 text-sm font-mono leading-relaxed text-foreground/90 custom-scrollbar outline-none disabled:opacity-50"
                                            spellCheck={false}
                                        />
                                    </div>
                                </section>

                                {/* Metrics Panel */}
                                <section aria-labelledby="metrics-label">
                                    <h4 id="metrics-label" className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Performance Metrics (Last 7 Days)
                                    </h4>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                                <Clock className="w-3 h-3" />
                                                Avg Response
                                            </div>
                                            <div className="text-xl font-bold">{metrics.avgResponseTime}s</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                                <DollarSign className="w-3 h-3" />
                                                Total Cost
                                            </div>
                                            <div className="text-xl font-bold">${metrics.totalCost.toFixed(2)}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                                <Check className="w-3 h-3" />
                                                Success Rate
                                            </div>
                                            <div className="text-xl font-bold">{metrics.successRate}%</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                                <Zap className="w-3 h-3" />
                                                Total Calls
                                            </div>
                                            <div className="text-xl font-bold">{metrics.totalCalls}</div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Footer Actions */}
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
                                    disabled={!isAuthenticated || !hasChanges() || isSaving}
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
