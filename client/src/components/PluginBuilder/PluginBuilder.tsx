import { useState } from 'react';
import { X, Check, AlertCircle, Sparkles, Terminal, Code, Download, ChevronRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

// Types
interface PluginTool {
    name: string;
    description: string;
    parameters: any[];
    required?: boolean;
}

interface PluginData {
    name: string;
    description: string;
    version: string;
    author: string;
    agentName: string;
    systemPromptExtension: string;
    tags: string[];
    tools: PluginTool[];
}

interface PluginBuilderProps {
    onClose: () => void;
    onSave: (plugin: any) => void;
}

export function PluginBuilder({ onClose, onSave }: PluginBuilderProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<PluginData>({
        name: '',
        description: '',
        version: '1.0.0',
        author: '',
        agentName: 'Router',
        systemPromptExtension: '',
        tags: [],
        tools: []
    });

    const agents = [
        'Router', 'Founder', 'PM', 'UX', 'Designer', 'Accessibility',
        'Planner', 'Security', 'Builder', 'Reviewer', 'Tester', 'TechWriter', 'SRE'
    ];

    const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value.trim();
            if (val && !formData.tags.includes(val)) {
                setFormData({ ...formData, tags: [...formData.tags, val] });
                (e.target as HTMLInputElement).value = '';
            }
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
                parameters: [],
                required: false
            }]
        });
    };

    const updateTool = (index: number, field: keyof PluginTool, value: any) => {
        const newTools = [...formData.tools];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newTools[index] as any)[field] = value;
        setFormData({ ...formData, tools: newTools });
    };

    const removeTool = (index: number) => {
        setFormData({
            ...formData,
            tools: formData.tools.filter((_, i) => i !== index)
        });
    };

    const downloadPlugin = () => {
        const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.name.toLowerCase().replace(/\s+/g, '-')}-plugin.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Plugin Name</label>
                        <Input
                            placeholder="e.g. React Optimizer"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Version</label>
                        <Input
                            placeholder="1.0.0"
                            value={formData.version}
                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                            className="bg-black/20"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                        placeholder="What does this plugin do?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-black/20"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Agent</label>
                    <select
                        className="w-full h-10 px-3 rounded-md bg-black/20 border border-input text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={formData.agentName}
                        onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    >
                        {agents.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Author</label>
                    <Input
                        placeholder="Your Name or Organization"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="bg-black/20"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags (Press Enter)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                            </Badge>
                        ))}
                    </div>
                    <Input
                        placeholder="Add tags..."
                        onKeyDown={handleTagInput}
                        className="bg-black/20"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-primary mb-1">System Prompt Extension</h4>
                        <p className="text-sm text-muted-foreground">
                            This text will be appended to the agent's system prompt to inject new knowledge or behaviors.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2 h-full flex flex-col">
                <textarea
                    className="flex-1 w-full p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-sm leading-relaxed focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none resize-none min-h-[300px]"
                    placeholder="Enter the system prompt instructions here..."
                    value={formData.systemPromptExtension}
                    onChange={(e) => setFormData({ ...formData, systemPromptExtension: e.target.value })}
                />
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Tools & Capabilities</h3>
                <Button variant="outline" size="sm" onClick={addTool}>
                    + Add Tool
                </Button>
            </div>

            {formData.tools.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-lg bg-white/5">
                    <Terminal className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">No custom tools defined.</p>
                    <Button variant="link" onClick={addTool}>Add your first tool</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {formData.tools.map((tool, index) => (
                        <Card key={index} variant="glass" className="p-4 relative group">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => removeTool(index)}
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <div className="grid gap-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Function Name</label>
                                        <Input
                                            value={tool.name}
                                            onChange={(e) => updateTool(index, 'name', e.target.value)}
                                            placeholder="my_function"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                                        <Input
                                            value={tool.description}
                                            onChange={(e) => updateTool(index, 'description', e.target.value)}
                                            placeholder="What does it do?"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReview = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-white/10">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-3xl">
                        🔌
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{formData.name || 'Untitled Plugin'}</h3>
                        <p className="text-muted-foreground">v{formData.version} • {formData.agentName}</p>
                    </div>
                </div>
                <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
                    {formData.description || 'No description provided.'}
                </p>
                <div className="flex gap-2 mt-4">
                    {formData.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="bg-black/20">{tag}</Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card variant="glass" className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4 text-primary" />
                        Prompt Extension
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {formData.systemPromptExtension ? `${formData.systemPromptExtension.length} characters` : 'None'}
                    </p>
                </Card>
                <Card variant="glass" className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-primary" />
                        Tools
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {formData.tools.length} custom tools defined
                    </p>
                </Card>
            </div>

            <div className="flex gap-3">
                <Button className="flex-1" variant="gradient" onClick={() => onSave(formData)}>
                    <Check className="w-4 h-4 mr-2" />
                    Publish Plugin
                </Button>
                <Button className="flex-1" variant="outline" onClick={downloadPlugin}>
                    <Download className="w-4 h-4 mr-2" />
                    Download JSON
                </Button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card variant="glass-elevated" className="w-full max-w-2xl overflow-hidden border-white/10 shadow-2xl relative bg-background-elevated/95">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Plugin Builder
                        </h2>
                        <p className="text-sm text-muted-foreground">Create custom capabilities for your agents</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Steps */}
                <div className="px-6 py-4 flex gap-2 border-b border-white/5 bg-black/20">
                    {[1, 2, 3, 4].map(s => (
                        <div
                            key={s}
                            className={`flex-1 h-1 rounded-full transition-all ${step >= s ? 'bg-primary shadow-glow-sm' : 'bg-white/10'}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 min-h-[400px]">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderReview()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/5 bg-black/20">
                    <Button
                        variant="ghost"
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
                    >
                        Back
                    </Button>

                    {step < 4 ? (
                        <Button
                            variant="secondary"
                            onClick={() => setStep(s => Math.min(4, s + 1))}
                            className="gap-2"
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Ready to publish?
                        </div>
                    )}
                </div>

            </Card>
        </div>
    );
}

export default PluginBuilder;
