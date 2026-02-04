import React, { useState, useEffect } from 'react';
import './PluginBuilder.css';

// ============================================================================
// TYPES
// ============================================================================

interface PluginTool {
    name: string;
    description: string;
    parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        required: boolean;
    }>;
}

interface PluginFormData {
    name: string;
    version: string;
    description: string;
    longDescription: string;
    agentName: string;
    systemPromptExtension: string;
    tools: PluginTool[];
    tags: string[];
    icon: string;
    homepage: string;
    repository: string;
}

interface Agent {
    name: string;
    emoji: string;
    role: string;
}

// ============================================================================
// AGENT LIST
// ============================================================================

const AGENTS: Agent[] = [
    { name: 'Router', emoji: '🧭', role: 'Routes requests to appropriate agents' },
    { name: 'Founder', emoji: '💡', role: 'Defines vision and business goals' },
    { name: 'PM', emoji: '📋', role: 'Creates product requirements' },
    { name: 'UX', emoji: '🎯', role: 'Designs user experience flows' },
    { name: 'Designer', emoji: '🎨', role: 'Creates visual designs' },
    { name: 'Accessibility', emoji: '♿', role: 'Ensures accessibility compliance' },
    { name: 'Planner', emoji: '📐', role: 'Plans implementation architecture' },
    { name: 'Security', emoji: '🔒', role: 'Reviews for security issues' },
    { name: 'Builder', emoji: '🛠️', role: 'Writes the code' },
    { name: 'Reviewer', emoji: '👀', role: 'Reviews code quality' },
    { name: 'Tester', emoji: '🧪', role: 'Creates and runs tests' },
    { name: 'TechWriter', emoji: '📚', role: 'Writes documentation' },
    { name: 'SRE', emoji: '🚀', role: 'Manages deployment' }
];

// ============================================================================
// COMPONENT
// ============================================================================

interface PluginBuilderProps {
    onClose: () => void;
    accessToken: string | null;
}

export function PluginBuilder({ onClose, accessToken }: PluginBuilderProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<PluginFormData>({
        name: '',
        version: '1.0.0',
        description: '',
        longDescription: '',
        agentName: '',
        systemPromptExtension: '',
        tools: [],
        tags: [],
        icon: '🔌',
        homepage: '',
        repository: ''
    });
    const [tagInput, setTagInput] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Validate current step
    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.name.length >= 3 && formData.description.length >= 10;
            case 2:
                return formData.agentName !== '';
            case 3:
                return true; // Optional step
            case 4:
                return true; // Review step
            default:
                return false;
        }
    };

    const addTag = () => {
        if (tagInput && formData.tags.length < 5 && !formData.tags.includes(tagInput)) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput] });
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    const addTool = () => {
        setFormData({
            ...formData,
            tools: [...formData.tools, {
                name: '',
                description: '',
                parameters: []
            }]
        });
    };

    const updateTool = (index: number, field: keyof PluginTool, value: unknown) => {
        const newTools = [...formData.tools];
        newTools[index] = { ...newTools[index], [field]: value };
        setFormData({ ...formData, tools: newTools });
    };

    const removeTool = (index: number) => {
        setFormData({
            ...formData,
            tools: formData.tools.filter((_, i) => i !== index)
        });
    };

    const generatePluginJSON = () => {
        return JSON.stringify({
            name: formData.name,
            version: formData.version,
            description: formData.description,
            longDescription: formData.longDescription || undefined,
            agentName: formData.agentName,
            systemPromptExtension: formData.systemPromptExtension || undefined,
            tools: formData.tools.length > 0 ? formData.tools : undefined,
            tags: formData.tags,
            icon: formData.icon || undefined,
            homepage: formData.homepage || undefined,
            repository: formData.repository || undefined
        }, null, 2);
    };

    const publishPlugin = async () => {
        if (!accessToken) {
            setError('You must be logged in to publish plugins');
            return;
        }

        setPublishing(true);
        setError(null);

        try {
            const response = await fetch('/plugins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    version: formData.version,
                    description: formData.description,
                    longDescription: formData.longDescription || undefined,
                    agentName: formData.agentName,
                    systemPromptExtension: formData.systemPromptExtension || undefined,
                    tools: formData.tools.length > 0 ? formData.tools : undefined,
                    tags: formData.tags,
                    icon: formData.icon || undefined,
                    homepage: formData.homepage || undefined,
                    repository: formData.repository || undefined
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to publish plugin');
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish');
        } finally {
            setPublishing(false);
        }
    };

    const downloadPlugin = () => {
        const blob = new Blob([generatePluginJSON()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.name.toLowerCase().replace(/\s+/g, '-')}-plugin.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (success) {
        return (
            <div className="plugin-builder">
                <div className="plugin-builder-header">
                    <h2>🎉 Plugin Published!</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="plugin-builder-content success-content">
                    <div className="success-icon">✅</div>
                    <h3>{formData.name}</h3>
                    <p>Your plugin has been published to the HIVE-R Marketplace.</p>
                    <p>Users can now find and install it!</p>
                    <button className="primary-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="plugin-builder">
            <div className="plugin-builder-header">
                <h2>🔌 Plugin Builder</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Progress Steps */}
            <div className="builder-steps">
                {['Basics', 'Agent', 'Extensions', 'Review'].map((label, i) => (
                    <div
                        key={label}
                        className={`step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'complete' : ''}`}
                        onClick={() => step > i + 1 && setStep(i + 1)}
                    >
                        <span className="step-number">{step > i + 1 ? '✓' : i + 1}</span>
                        <span className="step-label">{label}</span>
                    </div>
                ))}
            </div>

            <div className="plugin-builder-content">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="builder-step">
                        <h3>Plugin Information</h3>

                        <div className="form-group">
                            <label>Plugin Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="My Awesome Plugin"
                                maxLength={50}
                            />
                            <span className="hint">{formData.name.length}/50 characters</span>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Version *</label>
                                <input
                                    type="text"
                                    value={formData.version}
                                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                    placeholder="1.0.0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Icon (Emoji)</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="🔌"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Short Description *</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of what your plugin does"
                                maxLength={200}
                            />
                            <span className="hint">{formData.description.length}/200 characters</span>
                        </div>

                        <div className="form-group">
                            <label>Long Description</label>
                            <textarea
                                value={formData.longDescription}
                                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                                placeholder="Detailed description with features, use cases, etc."
                                rows={4}
                                maxLength={2000}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tags</label>
                            <div className="tag-input">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    placeholder="Add a tag"
                                    maxLength={20}
                                />
                                <button type="button" onClick={addTag}>Add</button>
                            </div>
                            <div className="tags-list">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="tag">
                                        {tag}
                                        <button onClick={() => removeTag(tag)}>✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Agent Selection */}
                {step === 2 && (
                    <div className="builder-step">
                        <h3>Select Target Agent</h3>
                        <p className="step-description">
                            Choose which agent your plugin will extend.
                            The plugin's prompt extension will be added to this agent's instructions.
                        </p>

                        <div className="agent-grid">
                            {AGENTS.map(agent => (
                                <div
                                    key={agent.name}
                                    className={`agent-card ${formData.agentName === agent.name ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, agentName: agent.name })}
                                >
                                    <span className="agent-emoji">{agent.emoji}</span>
                                    <span className="agent-name">{agent.name}</span>
                                    <span className="agent-role">{agent.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Extensions */}
                {step === 3 && (
                    <div className="builder-step">
                        <h3>Define Extensions</h3>

                        <div className="form-group">
                            <label>System Prompt Extension</label>
                            <p className="hint">
                                This text will be appended to the agent's system prompt.
                                Use it to add new capabilities or modify behavior.
                            </p>
                            <textarea
                                value={formData.systemPromptExtension}
                                onChange={(e) => setFormData({ ...formData, systemPromptExtension: e.target.value })}
                                placeholder={`Example:\n\n## Additional Guidelines\n\nWhen building React components:\n- Always use TypeScript\n- Include PropTypes validation\n- Add JSDoc comments`}
                                rows={8}
                                maxLength={5000}
                            />
                        </div>

                        <div className="form-group">
                            <label>Custom Tools (Optional)</label>
                            <p className="hint">
                                Define additional tools the agent can use.
                                Tools must have an endpoint to call.
                            </p>

                            {formData.tools.map((tool, i) => (
                                <div key={i} className="tool-card">
                                    <div className="tool-header">
                                        <span>Tool {i + 1}</span>
                                        <button onClick={() => removeTool(i)}>Remove</button>
                                    </div>
                                    <div className="form-row">
                                        <input
                                            type="text"
                                            value={tool.name}
                                            onChange={(e) => updateTool(i, 'name', e.target.value)}
                                            placeholder="tool_name"
                                        />
                                        <input
                                            type="text"
                                            value={tool.description}
                                            onChange={(e) => updateTool(i, 'description', e.target.value)}
                                            placeholder="Description"
                                        />
                                    </div>
                                </div>
                            ))}

                            {formData.tools.length < 5 && (
                                <button type="button" className="add-tool-btn" onClick={addTool}>
                                    + Add Tool
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="builder-step">
                        <h3>Review & Publish</h3>

                        <div className="preview-card">
                            <div className="preview-header">
                                <span className="preview-icon">{formData.icon}</span>
                                <div>
                                    <h4>{formData.name}</h4>
                                    <span className="preview-version">v{formData.version}</span>
                                </div>
                            </div>
                            <p className="preview-description">{formData.description}</p>
                            <div className="preview-meta">
                                <span className="preview-agent">
                                    {AGENTS.find(a => a.name === formData.agentName)?.emoji} {formData.agentName}
                                </span>
                                {formData.tags.map(tag => (
                                    <span key={tag} className="preview-tag">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div className="json-preview">
                            <h4>Plugin JSON</h4>
                            <pre>{generatePluginJSON()}</pre>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label>Optional Links</label>
                            <input
                                type="url"
                                value={formData.homepage}
                                onChange={(e) => setFormData({ ...formData, homepage: e.target.value })}
                                placeholder="Homepage URL"
                            />
                            <input
                                type="url"
                                value={formData.repository}
                                onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                                placeholder="Repository URL"
                                style={{ marginTop: '8px' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="plugin-builder-footer">
                {step > 1 && (
                    <button className="secondary-btn" onClick={() => setStep(step - 1)}>
                        ← Back
                    </button>
                )}
                <div className="footer-spacer" />

                {step === 4 ? (
                    <>
                        <button className="secondary-btn" onClick={downloadPlugin}>
                            Download JSON
                        </button>
                        <button
                            className="primary-btn"
                            onClick={publishPlugin}
                            disabled={publishing || !accessToken}
                        >
                            {publishing ? 'Publishing...' : accessToken ? 'Publish to Marketplace' : 'Login to Publish'}
                        </button>
                    </>
                ) : (
                    <button
                        className="primary-btn"
                        onClick={() => setStep(step + 1)}
                        disabled={!canProceed()}
                    >
                        Next →
                    </button>
                )}
            </div>
        </div>
    );
}

export default PluginBuilder;
