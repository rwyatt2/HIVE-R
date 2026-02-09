/**
 * Dashboard Page — "Command Center"
 * 
 * System metrics and agent activity dashboard.
 * Pure Tailwind with Bionic Minimalism design tokens.
 */

import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Zap, AlertCircle, CheckCircle2, Clock, BarChart3, TrendingUp, Server } from 'lucide-react';

interface Metrics {
    system: {
        uptime: number;
        uptimeHuman: string;
        memory: {
            heapUsed: number;
            heapTotal: number;
        };
    };
    requests: {
        total: number;
        errors: number;
        errorRate: number;
    };
    agents: Record<string, { invocations: number; avgDuration: number; errorRate: number }>;
}

interface HealthData {
    status: string;
    version: string;
    agents: number;
    uptime: number;
}

const getApiCandidates = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    return [
        import.meta.env.VITE_API_URL,
        origin || null,
        hostname ? `http://${hostname}:3000` : null,
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ].filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index);
};

// ─── Stat Card Component ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, subtitle, color = 'electric-violet' }: {
    icon: typeof Activity;
    label: string;
    value: string | number;
    subtitle?: string;
    color?: string;
}) {
    const colorMap: Record<string, string> = {
        'electric-violet': 'text-electric-violet bg-electric-violet/10 border-electric-violet/20',
        'honey': 'text-honey bg-honey/10 border-honey/20',
        'cyber-cyan': 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20',
        'emerald': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        'reactor-red': 'text-reactor-red bg-reactor-red/10 border-reactor-red/20',
    };

    return (
        <div className="bg-void-950/95 backdrop-blur-2xl border border-white/6 rounded-2xl p-6 hover:border-white/12 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-starlight-400 tracking-wide uppercase">{label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color] || colorMap['electric-violet']}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
            {subtitle && <div className="text-xs text-starlight-400 mt-1">{subtitle}</div>}
        </div>
    );
}

export function DashboardPage() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiBase, setApiBase] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('hive-access-token');
            const headers: HeadersInit = token
                ? { Authorization: `Bearer ${token}` }
                : {};
            const candidates = getApiCandidates();
            const bases = apiBase ? [apiBase, ...candidates] : candidates;

            for (const base of bases) {
                try {
                    const [healthRes, metricsRes] = await Promise.all([
                        fetch(`${base}/health`, { headers }),
                        fetch(`${base}/metrics/summary`, { headers }),
                    ]);

                    const healthOk = healthRes.ok;
                    const metricsOk = metricsRes.ok;

                    if (healthOk) setHealth(await healthRes.json());
                    if (metricsOk) setMetrics(await metricsRes.json());

                    if (healthOk || metricsOk) {
                        setError(null);
                        setApiBase(base);
                        return;
                    }
                } catch {
                    continue;
                }
            }

            setError('Cannot connect to HIVE-R server');
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <div className="h-full w-full py-4 md:py-6">
                <div className="max-w-lg mx-auto text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-reactor-red/10 border border-reactor-red/20 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-reactor-red" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Server Unreachable</h1>
                    <p className="text-starlight-400">
                        {error}
                        {apiBase && <span className="block mt-2 text-xs font-mono text-starlight-500">Tried: {apiBase}</span>}
                    </p>
                    <div className="bg-void-900/60 border border-white/6 rounded-2xl p-5">
                        <code className="text-sm font-mono text-cyber-cyan">npm run dev</code>
                        <p className="text-xs text-starlight-400 mt-2">Run this in the HIVE-R root directory</p>
                    </div>
                </div>
            </div>
        );
    }

    const memoryPercent = metrics
        ? Math.round((metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100)
        : 0;

    const agentEntries = metrics?.agents ? Object.entries(metrics.agents) : [];

    return (
        <div className="h-full w-full">
            <div className="w-full space-y-6 md:space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-starlight-400">Monitor your HIVE-R agent system in real time</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={CheckCircle2}
                        label="Status"
                        value={health?.status || 'Offline'}
                        subtitle={health ? 'Connected' : 'Disconnected'}
                        color={health ? 'emerald' : 'reactor-red'}
                    />
                    <StatCard
                        icon={Server}
                        label="Agents"
                        value={health?.agents || 0}
                        subtitle="Active agents"
                        color="electric-violet"
                    />
                    <StatCard
                        icon={Clock}
                        label="Uptime"
                        value={metrics?.system.uptimeHuman || '-'}
                        color="cyber-cyan"
                    />
                    <StatCard
                        icon={Zap}
                        label="Requests"
                        value={metrics?.requests.total || 0}
                        subtitle={`${(metrics?.requests.errorRate ?? 0 * 100).toFixed(1)}% error rate`}
                        color="honey"
                    />
                </div>

                {/* Memory + Performance Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Memory Usage */}
                    <div className="bg-void-950/95 backdrop-blur-2xl border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                                    <HardDrive className="w-5 h-5 text-cyber-cyan" />
                                </div>
                                <h2 className="text-sm font-semibold text-white">Memory Usage</h2>
                            </div>
                            <span className="text-xs font-mono text-starlight-400">{memoryPercent}%</span>
                        </div>

                        <div className="space-y-3">
                            <div className="h-3 bg-void-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-cyber-cyan to-electric-violet rounded-full transition-all duration-1000"
                                    style={{ width: `${memoryPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-starlight-400 font-mono">
                                <span>{metrics ? `${(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(1)} MB used` : '-'}</span>
                                <span>{metrics ? `${(metrics.system.memory.heapTotal / 1024 / 1024).toFixed(1)} MB total` : '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-void-950/95 backdrop-blur-2xl border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-electric-violet/10 border border-electric-violet/20 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-electric-violet" />
                            </div>
                            <h2 className="text-sm font-semibold text-white">System Info</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Version', value: health?.version || '-' },
                                { label: 'Total Requests', value: metrics?.requests.total?.toLocaleString() || '0' },
                                { label: 'Error Rate', value: `${((metrics?.requests.errorRate || 0) * 100).toFixed(2)}%` },
                                { label: 'Agent Count', value: health?.agents?.toString() || '0' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-xs text-starlight-400">{item.label}</span>
                                    <span className="text-sm font-mono text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Agent Activity Table */}
                <div className="bg-void-950/95 backdrop-blur-2xl border border-white/6 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-white/6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-honey/10 border border-honey/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-honey" />
                            </div>
                            <h2 className="text-sm font-semibold text-white">Agent Activity</h2>
                        </div>
                        <span className="text-xs text-starlight-400">{agentEntries.length} agents</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/4">
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Agent</th>
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Invocations</th>
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Avg Duration</th>
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Error Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentEntries.length > 0 ? (
                                    agentEntries.map(([agent, data]) => (
                                        <tr key={agent} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                    <span className="text-sm font-medium text-white">{agent}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-starlight-400">{data.invocations}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-starlight-400">{data.avgDuration}ms</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-mono ${data.errorRate > 0.1 ? 'text-reactor-red' : 'text-emerald-400'}`}>
                                                    {(data.errorRate * 100).toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Cpu className="w-8 h-8 text-starlight-700" />
                                                <p className="text-sm text-starlight-400">No agent activity yet</p>
                                                <p className="text-xs text-starlight-700">Send a message in the Studio to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
