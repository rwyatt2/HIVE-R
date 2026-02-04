/**
 * Agent Config Page Component
 * 
 * Displays all agents and allows editing their system prompts.
 */

import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AgentConfigPage.css';

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
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
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
                    // Set initial selection only on first load
                    if (data.agents.length > 0) {
                        const firstAgent = data.agents[0];
                        setSelectedAgent(firstAgent.name);
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
        setSelectedAgent(agentName);
        const agent = agents.find(a => a.name === agentName);
        if (agent) {
            setEditedPrompt(agent.systemPrompt);
            setOriginalPrompt(agent.systemPrompt);
        }
    };

    const handleSave = async () => {
        if (!selectedAgent || !isAuthenticated) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/agents/config/${selectedAgent}`, {
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
                    a.name === selectedAgent ? updatedConfig : a
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
        if (!selectedAgent || !isAuthenticated) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/agents/config/${selectedAgent}/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const resetConfig = await response.json();
                setAgents(prev => prev.map(a =>
                    a.name === selectedAgent ? resetConfig : a
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

    const currentAgent = agents.find(a => a.name === selectedAgent);
    const hasChanges = editedPrompt !== originalPrompt;

    if (isLoading) {
        return (
            <div className="agent-config-overlay">
                <div className="agent-config-page">
                    <div className="config-loading">
                        <span className="typing-indicator">
                            <span></span><span></span><span></span>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="agent-config-overlay">
            <div className="agent-config-page">
                <div className="config-header">
                    <h2>⚙️ Agent Configuration</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {!isAuthenticated && (
                    <div className="config-auth-warning">
                        <AlertCircle size={18} />
                        <span>Sign in to edit agent configurations</span>
                    </div>
                )}

                <div className="config-content">
                    <div className="agent-list">
                        {agents.map(agent => (
                            <button
                                key={agent.name}
                                className={`agent-list-item ${agent.name === selectedAgent ? 'active' : ''} ${agent.isCustomized ? 'customized' : ''}`}
                                onClick={() => handleSelectAgent(agent.name)}
                            >
                                <span className="agent-emoji">{agent.emoji}</span>
                                <span className="agent-display-name">{agent.displayName}</span>
                                {agent.isCustomized && <span className="customized-badge">•</span>}
                            </button>
                        ))}
                    </div>

                    <div className="agent-editor">
                        {currentAgent && (
                            <>
                                <div className="editor-header">
                                    <h3>
                                        {currentAgent.emoji} {currentAgent.displayName}
                                        {currentAgent.isCustomized && (
                                            <span className="modified-tag">Modified</span>
                                        )}
                                    </h3>
                                </div>

                                <div className="editor-body">
                                    <label>System Prompt</label>
                                    <textarea
                                        value={editedPrompt}
                                        onChange={(e) => setEditedPrompt(e.target.value)}
                                        placeholder="Enter the system prompt for this agent..."
                                        disabled={!isAuthenticated}
                                        rows={12}
                                    />
                                </div>

                                {message && (
                                    <div className={`editor-message ${message.type}`}>
                                        {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                        {message.text}
                                    </div>
                                )}

                                <div className="editor-actions">
                                    <button
                                        className="reset-btn"
                                        onClick={handleReset}
                                        disabled={!isAuthenticated || !currentAgent.isCustomized || isSaving}
                                    >
                                        <RotateCcw size={16} />
                                        Reset to Default
                                    </button>
                                    <button
                                        className="save-btn"
                                        onClick={handleSave}
                                        disabled={!isAuthenticated || !hasChanges || isSaving}
                                    >
                                        <Save size={16} />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
