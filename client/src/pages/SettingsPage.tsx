/**
 * Settings Page — "Control Panel"
 * 
 * Profile, organization, billing, and API key management.
 * Pure Tailwind with Bionic Minimalism design tokens.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Building2, CreditCard, Key, Save, Plus, Zap } from 'lucide-react';

type SettingsTab = 'profile' | 'organization' | 'billing' | 'api';

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
];

export function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    return (
        <div className="min-h-screen bg-void-950 pt-24 pb-16 px-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-starlight-400">Manage your account and preferences</p>
                </div>

                {/* Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Nav */}
                    <nav className="lg:w-56 shrink-0 space-y-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-electric-violet/10 text-electric-violet border border-electric-violet/20'
                                            : 'text-starlight-400 hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-void-900/40 backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 lg:p-8">
                            {/* Profile */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white mb-1">Profile Settings</h2>
                                        <p className="text-sm text-starlight-400">Manage your personal information</p>
                                    </div>

                                    <div className="flex items-center gap-5 pb-6 border-b border-white/[0.06]">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-violet to-[#8B5CF6] flex items-center justify-center text-2xl font-bold text-white shadow-neon-violet">
                                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{user?.email || 'user@example.com'}</div>
                                            <div className="text-xs text-starlight-400 mt-0.5">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-starlight-400 uppercase tracking-wider">Email</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full h-10 px-4 bg-void-800/40 border border-white/[0.06] rounded-lg text-sm text-starlight-400 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-starlight-400 uppercase tracking-wider">Display Name</label>
                                            <input
                                                type="text"
                                                placeholder="Your name"
                                                className="w-full h-10 px-4 bg-void-800/60 border border-white/[0.08] rounded-lg text-sm text-white placeholder-starlight-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric-violet hover:bg-electric-indigo text-white text-sm font-medium rounded-lg transition-colors shadow-neon-violet">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            )}

                            {/* Organization */}
                            {activeTab === 'organization' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white mb-1">Organization</h2>
                                        <p className="text-sm text-starlight-400">Manage your team and organization settings</p>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
                                            <Building2 className="w-10 h-10 text-starlight-700" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Create an Organization</h3>
                                        <p className="text-sm text-starlight-400 max-w-sm mb-6">Collaborate with your team on HIVE-R projects</p>
                                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric-violet hover:bg-electric-indigo text-white text-sm font-medium rounded-lg transition-colors">
                                            <Plus className="w-4 h-4" />
                                            Create Organization
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Billing */}
                            {activeTab === 'billing' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white mb-1">Billing & Usage</h2>
                                        <p className="text-sm text-starlight-400">Manage your subscription and monitor usage</p>
                                    </div>

                                    {/* Current Plan */}
                                    <div className="bg-void-800/40 border border-white/[0.06] rounded-xl p-5 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-white">Free Plan</h3>
                                                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-honey/10 text-honey border border-honey/20 rounded-full">Current</span>
                                            </div>
                                            <p className="text-xs text-starlight-400 mt-1">1,000 requests/month • 100K tokens/month</p>
                                        </div>
                                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-violet to-[#8B5CF6] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-neon-violet">
                                            <Zap className="w-4 h-4" />
                                            Upgrade to Pro
                                        </button>
                                    </div>

                                    {/* Usage */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-white">This Month's Usage</h3>
                                        <div className="h-3 bg-void-800 rounded-full overflow-hidden">
                                            <div className="h-full w-1/4 bg-gradient-to-r from-electric-violet to-cyber-cyan rounded-full transition-all duration-700" />
                                        </div>
                                        <div className="flex justify-between text-xs text-starlight-400 font-mono">
                                            <span>250 / 1,000 requests</span>
                                            <span>25%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* API Keys */}
                            {activeTab === 'api' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white mb-1">API Keys</h2>
                                        <p className="text-sm text-starlight-400">Manage API keys for programmatic access to HIVE-R</p>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
                                            <Key className="w-10 h-10 text-starlight-700" />
                                        </div>
                                        <p className="text-sm text-starlight-400 mb-6">No API keys yet</p>
                                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric-violet hover:bg-electric-indigo text-white text-sm font-medium rounded-lg transition-colors">
                                            <Plus className="w-4 h-4" />
                                            Generate API Key
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
