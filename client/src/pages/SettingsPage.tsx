/**
 * Settings Page
 * 
 * User settings, organization management, and billing.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.css';

type SettingsTab = 'profile' | 'organization' | 'billing' | 'api';

export function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'organization', label: 'Organization', icon: '🏢' },
        { id: 'billing', label: 'Billing', icon: '💳' },
        { id: 'api', label: 'API Keys', icon: '🔑' },
    ];

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account and preferences</p>
            </div>

            <div className="settings-layout">
                {/* Sidebar */}
                <nav className="settings-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="nav-icon">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h2>Profile Settings</h2>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={user?.email || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input type="text" placeholder="Your name" />
                            </div>
                            <button className="btn-save">Save Changes</button>
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <div className="settings-section">
                            <h2>Organization</h2>
                            <p className="section-desc">
                                Manage your team and organization settings.
                            </p>
                            <div className="org-placeholder">
                                <div className="placeholder-icon">🏢</div>
                                <h3>Create an Organization</h3>
                                <p>Collaborate with your team on HIVE-R projects</p>
                                <button className="btn-primary">Create Organization</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="settings-section">
                            <h2>Billing & Usage</h2>

                            <div className="plan-card">
                                <div className="plan-info">
                                    <h3>Free Plan</h3>
                                    <p>1,000 requests/month • 100K tokens/month</p>
                                </div>
                                <button className="btn-upgrade">Upgrade to Pro</button>
                            </div>

                            <div className="usage-stats">
                                <h3>This Month's Usage</h3>
                                <div className="usage-bar-container">
                                    <div className="usage-bar" style={{ width: '25%' }} />
                                </div>
                                <div className="usage-labels">
                                    <span>250 / 1,000 requests</span>
                                    <span>25%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="settings-section">
                            <h2>API Keys</h2>
                            <p className="section-desc">
                                Manage API keys for programmatic access to HIVE-R.
                            </p>

                            <div className="api-key-list">
                                <div className="api-key-empty">
                                    <div className="placeholder-icon">🔑</div>
                                    <p>No API keys yet</p>
                                    <button className="btn-primary">Generate API Key</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
