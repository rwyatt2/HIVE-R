import { useState, useEffect } from 'react';
import { Sparkles, X, Search, Filter, Star, Download, Check, Puzzle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

import { PluginBuilder } from '../PluginBuilder';

interface AgentPlugin {
    id: string;
    name: string;
    version: string;
    author: string;
    authorId: string;
    description: string;
    longDescription?: string;
    agentName: string;
    systemPromptExtension?: string;
    tags: string[];
    icon?: string;
    downloads?: number;
    averageRating?: number;
    ratingCount?: number;
    createdAt: string;
}

interface PluginListResponse {
    plugins: AgentPlugin[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface MarketplaceProps {
    onClose?: () => void;
    onOpenBuilder: () => void;
    accessToken?: string | null;
    variant?: 'modal' | 'page';
}

export function Marketplace({ onClose, onOpenBuilder, variant = 'modal' }: MarketplaceProps) {
    const [plugins, setPlugins] = useState<AgentPlugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [search, setSearch] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest'>('newest');
    const [selectedPlugin, setSelectedPlugin] = useState<AgentPlugin | null>(null);
    const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

    // Load plugins
    useEffect(() => {
        const loadPlugins = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (agentFilter) params.set('agent', agentFilter);
                params.set('sort', sortBy);

                // Mock data if API fails or is not ready
                const response = await fetch(`/plugins?${params}`).catch(() => null);
                if (response && response.ok) {
                    const data: PluginListResponse = await response.json();
                    setPlugins(data.plugins);
                } else {
                    // Fallback mock data for UI testing
                    setPlugins([
                        { id: '1', name: 'React Expert', version: '1.0.0', author: 'HIVE-R Team', authorId: 'admin', description: 'Adds specialized knowledge about React 19 features and performance optimization patterns.', agentName: 'Builder', tags: ['react', 'frontend'], icon: '⚛️', downloads: 1240, averageRating: 4.8, ratingCount: 42, createdAt: new Date().toISOString() },
                        { id: '2', name: 'Security Auditor', version: '2.1.0', author: 'SecTeam', authorId: 'sec', description: 'Enhances Security agent with OWASP Top 10 vulnerability checks.', agentName: 'Security', tags: ['security', 'audit'], icon: '🔒', downloads: 856, averageRating: 4.9, ratingCount: 28, createdAt: new Date().toISOString() },
                        { id: '3', name: 'Python Data Science', version: '0.9.5', author: 'DataWiz', authorId: 'data', description: 'Pandas and NumPy optimization strategies for data analysis tasks.', agentName: 'Data Analyst', tags: ['python', 'data'], icon: '🐍', downloads: 543, averageRating: 4.5, ratingCount: 15, createdAt: new Date().toISOString() },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load plugins:', error);
            } finally {
                setLoading(false);
            }
        };

        const loadInstalledPlugins = async () => {
            try {
                const response = await fetch('/plugins/installed').catch(() => null);
                if (response && response.ok) {
                    const data = await response.json();
                    setInstalledPlugins(new Set(data.plugins.map((p: AgentPlugin) => p.id)));
                }
            } catch (error) {
                console.error('Failed to load installed plugins:', error);
            }
        };

        loadPlugins();
        loadInstalledPlugins();
    }, [search, agentFilter, sortBy]);

    const installPlugin = async (pluginId: string) => {
        setInstalledPlugins(prev => new Set([...prev, pluginId]));
        try {
            await fetch(`/plugins/${pluginId}/install`, { method: 'POST' });
        } catch (e) { console.error(e) }
    };

    const uninstallPlugin = async (pluginId: string) => {
        setInstalledPlugins(prev => {
            const next = new Set(prev);
            next.delete(pluginId);
            return next;
        });
        try {
            await fetch(`/plugins/${pluginId}/uninstall`, { method: 'DELETE' });
        } catch (e) { console.error(e) }
    };

    const agents = [
        'Router', 'Founder', 'PM', 'UX', 'Designer', 'Accessibility',
        'Planner', 'Security', 'Builder', 'Reviewer', 'Tester', 'TechWriter', 'SRE'
    ];

    const isModal = variant === 'modal';

    return (
        <div className={cn(
            isModal && "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200",
            !isModal && "h-full w-full"
        )}>
            {!isModal && (
                <div className="w-full space-y-2 mb-6 md:mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Plugin Marketplace</h1>
                            <p className="text-starlight-400">Discover and extend your agents' capabilities</p>
                        </div>
                        <Button variant="secondary" onClick={() => setShowBuilder(true)}>
                            + Create Plugin
                        </Button>
                    </div>
                </div>
            )}

            <Card
                variant="glassmorphic"
                className={cn(
                    "w-full flex flex-col overflow-hidden shadow-2xl relative",
                    isModal
                        ? "max-w-6xl h-[85vh] border-white/10 bg-void-950/95"
                        : "flex-1 border-white/6 bg-void-950/95"
                )}
            >

                {/* Header (Modal Only) */}
                {isModal && (
                    <div className="flex items-center justify-between p-6 border-b backdrop-blur-sm border-white/5 bg-void-950/95">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Plugin Marketplace</h2>
                                <p className="text-sm text-muted-foreground">Discover and extend your agents' capabilities</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={() => setShowBuilder(true)}>
                                + Create Plugin
                            </Button>
                            {onClose && (
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className={cn(
                    "p-4 border-b flex flex-wrap gap-4 items-center",
                    isModal ? "border-white/5 bg-void-950/95" : "border-white/6 bg-void-950/95"
                )}>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search plugins..."
                            className="bg-white/5 pl-9 border-white/10 focus:border-primary/50"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={agentFilter}
                            onChange={(e) => setAgentFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-primary/50 outline-none hover:bg-white/5 cursor-pointer"
                        >
                            <option value="">All Agents</option>
                            {agents.map(agent => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-primary/50 outline-none hover:bg-white/5 cursor-pointer"
                        >
                            <option value="newest">Newest</option>
                            <option value="downloads">Most Downloads</option>
                            <option value="rating">Highest Rated</option>
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {selectedPlugin ? (
                        <PluginDetails
                            plugin={selectedPlugin}
                            isInstalled={installedPlugins.has(selectedPlugin.id)}
                            onBack={() => setSelectedPlugin(null)}
                            onInstall={() => installPlugin(selectedPlugin.id)}
                            onUninstall={() => uninstallPlugin(selectedPlugin.id)}
                        />
                    ) : (loading ? (
                        <div className="flex-1 h-full flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : plugins.length === 0 ? (
                        <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground p-12">
                            <Puzzle className="h-16 w-16 mb-6 opacity-20 text-foreground" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No plugins found</h3>
                            <p className="mb-8 text-starlight-400">Be the first to create one!</p>
                            <Button onClick={onOpenBuilder} size="lg" className="px-8">Create Plugin</Button>
                        </div>
                    ) : (
                        <div className={cn(
                            "p-6",
                            isModal ? "h-full overflow-y-auto custom-scrollbar" : ""
                        )}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {plugins.map(plugin => (
                                    <PluginCard
                                        key={plugin.id}
                                        plugin={plugin}
                                        isInstalled={installedPlugins.has(plugin.id)}
                                        onClick={() => setSelectedPlugin(plugin)}
                                        onInstall={() => installPlugin(plugin.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {showBuilder && (
                <PluginBuilder
                    onClose={() => setShowBuilder(false)}
                    onSave={(plugin: any) => {
                        console.log('Saving plugin:', plugin);
                        setShowBuilder(false);
                    }}
                />
            )}
        </div>
    );
}

function PluginCard({ plugin, isInstalled, onClick, onInstall }: { plugin: AgentPlugin, isInstalled: boolean, onClick: () => void, onInstall: () => void }) {
    return (
        <Card
            variant="glassmorphic"
            className="p-5 cursor-pointer group hover:bg-white/5 transition-all border-white/5 hover:border-primary/30 flex flex-col h-full"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                        {plugin.icon || '🔌'}
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-none mb-1 group-hover:text-primary transition-colors">{plugin.name}</h3>
                        <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                    </div>
                </div>
                {isInstalled && (
                    <Badge variant="success" className="gap-1 px-1.5">
                        <Check className="w-3 h-3" />
                    </Badge>
                )}
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{plugin.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> {plugin.downloads || 0}
                    </span>
                    {plugin.averageRating && (
                        <span className="flex items-center gap-1 text-warning">
                            <Star className="w-3 h-3 fill-current" /> {plugin.averageRating.toFixed(1)}
                        </span>
                    )}
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded bg-white/5 border border-white/5">
                    {plugin.agentName}
                </div>
            </div>

            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isInstalled) onInstall();
                }}
                variant={isInstalled ? "ghost" : "secondary"}
                size="sm"
                className={`mt-4 w-full ${isInstalled ? 'text-success hover:text-success/80 pointer-events-none opacity-50' : ''}`}
            >
                {isInstalled ? 'Installed' : 'Install'}
            </Button>
        </Card>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PluginDetails({ plugin, isInstalled, onBack, onInstall, onUninstall }: any) {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-8 animate-in slide-in-from-right-4 duration-300">
            <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
                ← Back to Browse
            </Button>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-5xl border border-white/10 shadow-2xl">
                        {plugin.icon || '🔌'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{plugin.name}</h2>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                                    <Badge variant="outline">v{plugin.version}</Badge>
                                    <span>by <span className="text-foreground font-medium">{plugin.author}</span></span>
                                    <span>•</span>
                                    <span>Updated {new Date(plugin.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Button
                                variant={isInstalled ? "destructive" : "gradient"}
                                size="lg"
                                onClick={isInstalled ? onUninstall : onInstall}
                                className="min-w-[140px] shadow-glow"
                            >
                                {isInstalled ? 'Uninstall' : 'Install Plugin'}
                            </Button>
                        </div>

                        <div className="flex gap-2 mb-6">
                            {plugin.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-void-950/95 border border-white/5 text-center">
                        <div className="text-2xl font-bold mb-1">{plugin.downloads || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Downloads</div>
                    </div>
                    <div className="p-4 rounded-xl bg-void-950/95 border border-white/5 text-center">
                        <div className="text-2xl font-bold mb-1 flex items-center justify-center gap-1">
                            {plugin.averageRating?.toFixed(1) || '-'} <Star className="w-4 h-4 text-warning fill-current" />
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{plugin.ratingCount || 0} Reviews</div>
                    </div>
                    <div className="p-4 rounded-xl bg-void-950/95 border border-white/5 text-center col-span-2 flex items-center justify-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Target Agent</div>
                            <div className="font-bold text-lg">{plugin.agentName}</div>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-3xl">🤖</div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        About this Plugin
                    </h3>
                    <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                        <p>{plugin.longDescription || plugin.description}</p>
                    </div>
                </div>

                {/* Extension Code Preview */}
                {plugin.systemPromptExtension && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">System Prompt Extension</h3>
                        <Card variant="glass" className="bg-void-950/95 font-mono text-xs p-4 overflow-x-auto border-white/10">
                            <pre className="text-muted-foreground">{plugin.systemPromptExtension}</pre>
                        </Card>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Marketplace;
