import React, { useState, useEffect } from 'react';
import './Marketplace.css';

// ============================================================================
// TYPES
// ============================================================================

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

interface PluginRating {
    id: string;
    pluginId: string;
    userId: string;
    userName: string;
    stars: number;
    review?: string;
    createdAt: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface MarketplaceProps {
    onClose: () => void;
    onOpenBuilder: () => void;
    accessToken: string | null;
}

export function Marketplace({ onClose, onOpenBuilder, accessToken }: MarketplaceProps) {
    const [plugins, setPlugins] = useState<AgentPlugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest'>('newest');
    const [selectedPlugin, setSelectedPlugin] = useState<AgentPlugin | null>(null);
    const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

    // Load plugins
    useEffect(() => {
        loadPlugins();
        loadInstalledPlugins();
    }, [search, agentFilter, sortBy]);

    const loadPlugins = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (agentFilter) params.set('agent', agentFilter);
            params.set('sort', sortBy);

            const response = await fetch(`/plugins?${params}`);
            const data: PluginListResponse = await response.json();
            setPlugins(data.plugins);
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadInstalledPlugins = async () => {
        try {
            const response = await fetch('/plugins/installed');
            const data = await response.json();
            setInstalledPlugins(new Set(data.plugins.map((p: AgentPlugin) => p.id)));
        } catch (error) {
            console.error('Failed to load installed plugins:', error);
        }
    };

    const installPlugin = async (pluginId: string) => {
        try {
            const response = await fetch(`/plugins/${pluginId}/install`, {
                method: 'POST'
            });

            if (response.ok) {
                setInstalledPlugins(prev => new Set([...prev, pluginId]));
            }
        } catch (error) {
            console.error('Failed to install plugin:', error);
        }
    };

    const uninstallPlugin = async (pluginId: string) => {
        try {
            const response = await fetch(`/plugins/${pluginId}/uninstall`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setInstalledPlugins(prev => {
                    const next = new Set(prev);
                    next.delete(pluginId);
                    return next;
                });
            }
        } catch (error) {
            console.error('Failed to uninstall plugin:', error);
        }
    };

    const agents = [
        'Router', 'Founder', 'PM', 'UX', 'Designer', 'Accessibility',
        'Planner', 'Security', 'Builder', 'Reviewer', 'Tester', 'TechWriter', 'SRE'
    ];

    return (
        <div className="marketplace">
            <div className="marketplace-header">
                <div className="header-left">
                    <h2>🔌 Plugin Marketplace</h2>
                    <span className="plugin-count">{plugins.length} plugins</span>
                </div>
                <div className="header-right">
                    <button className="create-btn" onClick={onOpenBuilder}>
                        + Create Plugin
                    </button>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
            </div>

            {/* Filters */}
            <div className="marketplace-filters">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search plugins..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Agents</option>
                    {agents.map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                    ))}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="filter-select"
                >
                    <option value="newest">Newest</option>
                    <option value="downloads">Most Downloads</option>
                    <option value="rating">Highest Rated</option>
                </select>
            </div>

            {/* Plugin Grid */}
            <div className="marketplace-content">
                {selectedPlugin ? (
                    <PluginDetails
                        plugin={selectedPlugin}
                        isInstalled={installedPlugins.has(selectedPlugin.id)}
                        onBack={() => setSelectedPlugin(null)}
                        onInstall={() => installPlugin(selectedPlugin.id)}
                        onUninstall={() => uninstallPlugin(selectedPlugin.id)}
                        accessToken={accessToken}
                    />
                ) : loading ? (
                    <div className="loading">Loading plugins...</div>
                ) : plugins.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📦</span>
                        <h3>No plugins found</h3>
                        <p>Be the first to create a plugin!</p>
                        <button className="create-btn" onClick={onOpenBuilder}>
                            Create Plugin
                        </button>
                    </div>
                ) : (
                    <div className="plugin-grid">
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
                )}
            </div>
        </div>
    );
}

// ============================================================================
// PLUGIN CARD
// ============================================================================

interface PluginCardProps {
    plugin: AgentPlugin;
    isInstalled: boolean;
    onClick: () => void;
    onInstall: () => void;
}

function PluginCard({ plugin, isInstalled, onClick, onInstall }: PluginCardProps) {
    return (
        <div className="plugin-card" onClick={onClick}>
            <div className="card-header">
                <span className="plugin-icon">{plugin.icon || '🔌'}</span>
                <div className="card-meta">
                    <h4>{plugin.name}</h4>
                    <span className="plugin-version">v{plugin.version}</span>
                </div>
            </div>

            <p className="plugin-description">{plugin.description}</p>

            <div className="card-footer">
                <span className="plugin-agent">{plugin.agentName}</span>
                <div className="plugin-stats">
                    {plugin.averageRating !== undefined && plugin.averageRating > 0 && (
                        <span className="stat">
                            ⭐ {plugin.averageRating.toFixed(1)}
                        </span>
                    )}
                    <span className="stat">
                        ⬇️ {plugin.downloads || 0}
                    </span>
                </div>
            </div>

            <button
                className={`install-btn ${isInstalled ? 'installed' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isInstalled) onInstall();
                }}
            >
                {isInstalled ? '✓ Installed' : 'Install'}
            </button>
        </div>
    );
}

// ============================================================================
// PLUGIN DETAILS
// ============================================================================

interface PluginDetailsProps {
    plugin: AgentPlugin;
    isInstalled: boolean;
    onBack: () => void;
    onInstall: () => void;
    onUninstall: () => void;
    accessToken: string | null;
}

function PluginDetails({
    plugin,
    isInstalled,
    onBack,
    onInstall,
    onUninstall,
    accessToken
}: PluginDetailsProps) {
    const [ratings, setRatings] = useState<PluginRating[]>([]);
    const [userRating, setUserRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRatings();
    }, [plugin.id]);

    const loadRatings = async () => {
        try {
            const response = await fetch(`/plugins/${plugin.id}/ratings`);
            const data = await response.json();
            setRatings(data.ratings);
        } catch (error) {
            console.error('Failed to load ratings:', error);
        }
    };

    const submitRating = async () => {
        if (!accessToken || userRating === 0) return;

        setSubmitting(true);
        try {
            await fetch(`/plugins/${plugin.id}/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    stars: userRating,
                    review: userReview || undefined
                })
            });
            loadRatings();
            setUserRating(0);
            setUserReview('');
        } catch (error) {
            console.error('Failed to submit rating:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="plugin-details">
            <button className="back-btn" onClick={onBack}>← Back</button>

            <div className="details-header">
                <span className="details-icon">{plugin.icon || '🔌'}</span>
                <div>
                    <h2>{plugin.name}</h2>
                    <div className="details-meta">
                        <span>v{plugin.version}</span>
                        <span>by {plugin.author}</span>
                        <span>for {plugin.agentName}</span>
                    </div>
                </div>
            </div>

            <div className="details-stats">
                <div className="stat-item">
                    <span className="stat-value">⬇️ {plugin.downloads || 0}</span>
                    <span className="stat-label">Downloads</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">
                        ⭐ {plugin.averageRating?.toFixed(1) || 'No ratings'}
                    </span>
                    <span className="stat-label">{plugin.ratingCount || 0} reviews</span>
                </div>
            </div>

            <div className="details-actions">
                {isInstalled ? (
                    <button className="uninstall-btn" onClick={onUninstall}>
                        Uninstall
                    </button>
                ) : (
                    <button className="install-btn primary" onClick={onInstall}>
                        Install Plugin
                    </button>
                )}
            </div>

            <div className="details-section">
                <h3>Description</h3>
                <p>{plugin.longDescription || plugin.description}</p>
            </div>

            {plugin.tags.length > 0 && (
                <div className="details-section">
                    <h3>Tags</h3>
                    <div className="tags-list">
                        {plugin.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                </div>
            )}

            {plugin.systemPromptExtension && (
                <div className="details-section">
                    <h3>Prompt Extension</h3>
                    <pre className="code-block">{plugin.systemPromptExtension}</pre>
                </div>
            )}

            <div className="details-section">
                <h3>Reviews</h3>

                {accessToken && (
                    <div className="rating-form">
                        <div className="star-input">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`star ${userRating >= star ? 'active' : ''}`}
                                    onClick={() => setUserRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Write a review (optional)"
                            value={userReview}
                            onChange={(e) => setUserReview(e.target.value)}
                            rows={3}
                        />
                        <button
                            className="submit-btn"
                            onClick={submitRating}
                            disabled={submitting || userRating === 0}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                )}

                {ratings.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                    <div className="reviews-list">
                        {ratings.map(rating => (
                            <div key={rating.id} className="review-card">
                                <div className="review-header">
                                    <span className="review-stars">
                                        {'★'.repeat(rating.stars)}
                                        {'☆'.repeat(5 - rating.stars)}
                                    </span>
                                    <span className="review-author">{rating.userName}</span>
                                </div>
                                {rating.review && (
                                    <p className="review-text">{rating.review}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Marketplace;
