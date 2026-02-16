/**
 * Settings Page — "Control Panel"
 * 
 * Profile, organization, billing, and API key management.
 * Enterprise Minimal Design System.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Building2, CreditCard, Key, Save, Plus, Zap, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'organization' | 'billing' | 'api' | 'notifications';

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const tabParam = searchParams.get('tab') as SettingsTab | null;
        if (tabParam && tabs.some(tab => tab.id === tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    return (
        <div className="h-full w-full space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Layout */}
            <div className="flex flex-col gap-6">
                {/* Horizontal Nav */}
                <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id)
                                    setSearchParams(tab.id === 'profile' ? {} : { tab: tab.id })
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-[3px]",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0 max-w-4xl">
                    {/* Profile */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Settings</CardTitle>
                                    <CardDescription>Manage your personal information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-5 pb-6 border-b border-border">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary ring-4 ring-background">
                                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{user?.email || 'user@example.com'}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
                                            <Input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="bg-muted/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Display Name</label>
                                            <Input
                                                type="text"
                                                placeholder="Your name"
                                            />
                                        </div>
                                    </div>

                                    <Button className="mt-4">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Organization */}
                    {activeTab === 'organization' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organization</CardTitle>
                                    <CardDescription>Manage your team and organization settings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Building2 className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Create an Organization</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
                                            Collaborate with your team on HIVE-R projects
                                        </p>
                                        <Button variant="outline">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Organization
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Billing */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Billing & Usage</CardTitle>
                                    <CardDescription>Manage your subscription and monitor usage</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-5 border border-border rounded-xl bg-secondary/20 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold">Free Plan</h3>
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200">Current</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">1,000 requests/month • 100K tokens/month</p>
                                        </div>
                                        <Button>
                                            <Zap className="w-4 h-4 mr-2" />
                                            Upgrade to Pro
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium">This Month's Usage</h3>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full w-1/4 bg-blue-500 rounded-full" />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                            <span>250 / 1,000 requests</span>
                                            <span>25%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* API Keys */}
                    {activeTab === 'api' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>API Keys</CardTitle>
                                    <CardDescription>Manage API keys for programmatic access to HIVE-R</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Key className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-6">No API keys yet</p>
                                        <Button variant="outline">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Generate API Key
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Settings</CardTitle>
                                    <CardDescription>Control how we keep you updated</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        {
                                            label: 'Product updates',
                                            description: 'New features, product announcements, and improvements.'
                                        },
                                        {
                                            label: 'Billing alerts',
                                            description: 'Usage thresholds, invoices, and payment updates.'
                                        },
                                        {
                                            label: 'Security notifications',
                                            description: 'Login activity and security‑related alerts.'
                                        }
                                    ].map(item => (
                                        <div
                                            key={item.label}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:bg-secondary/20 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">{item.label}</div>
                                                <div className="text-xs text-muted-foreground">{item.description}</div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                defaultChecked
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
