/**
 * Dashboard Page — "Command Center"
 * 
 * System metrics and agent activity dashboard.
 * Enterprise Minimal Design System.
 */

import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Zap, AlertCircle, CheckCircle2, Clock, BarChart3, TrendingUp, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
            <div className="h-full w-full py-4 md:py-6 flex items-center justify-center">
                <div className="max-w-lg w-full text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Server Unreachable</h1>
                        <p className="text-muted-foreground mt-2">
                            {error}
                            {apiBase && <span className="block mt-1 text-xs font-mono">Tried: {apiBase}</span>}
                        </p>
                    </div>
                    <Card>
                        <CardContent className="p-6">
                            <code className="text-sm font-mono text-primary">npm run dev</code>
                            <p className="text-xs text-muted-foreground mt-2">Run this in the HIVE-R root directory</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const memoryPercent = metrics
        ? Math.round((metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100)
        : 0;

    const agentEntries = metrics?.agents ? Object.entries(metrics.agents) : [];

    return (
        <div className="h-full w-full space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Monitor your HIVE-R agent system in real time</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Status"
                    value={health?.status || 'Offline'}
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    trend={health ? 'Connected' : 'Disconnected'}
                    trendUp={!!health}
                />
                <MetricCard
                    title="Active Agents"
                    value={(health?.agents || 0).toString()}
                    icon={<Server className="w-4 h-4 text-blue-500" />}
                />
                <MetricCard
                    title="Uptime"
                    value={metrics?.system.uptimeHuman || '-'}
                    icon={<Clock className="w-4 h-4 text-violet-500" />}
                />
                <MetricCard
                    title="Total Requests"
                    value={(metrics?.requests.total || 0).toLocaleString()}
                    icon={<Zap className="w-4 h-4 text-amber-500" />}
                    trend={`${((metrics?.requests.errorRate || 0) * 100).toFixed(1)}% errors`}
                    trendUp={false} // Error rate is bad if high, but here just display
                />
            </div>

            {/* Memory + Performance Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Memory Usage */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memoryPercent}%</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            {metrics ? `${(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(1)} MB used of ${(metrics.system.memory.heapTotal / 1024 / 1024).toFixed(1)} MB` : '-'}
                        </p>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-1000"
                                style={{ width: `${memoryPercent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* System Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Info</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {[
                            { label: 'Version', value: health?.version || '-' },
                            { label: 'Total Requests', value: metrics?.requests.total?.toLocaleString() || '0' },
                            { label: 'Error Rate', value: `${((metrics?.requests.errorRate || 0) * 100).toFixed(2)}%` },
                            { label: 'Agent Count', value: health?.agents?.toString() || '0' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{item.label}</span>
                                <span className="text-sm font-mono font-medium">{item.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Agent Activity Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Agent Activity</CardTitle>
                    </div>
                    <Badge variant="secondary">{agentEntries.length} agents</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Agent</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Invocations</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Avg Duration</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Error Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentEntries.length > 0 ? (
                                    agentEntries.map(([agent, data]) => (
                                        <tr key={agent} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-sm font-medium">{agent}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{data.invocations}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{data.avgDuration}ms</td>
                                            <td className="px-6 py-4">
                                                <Badge 
                                                    variant={data.errorRate > 0.1 ? "destructive" : "outline"} 
                                                    className={data.errorRate <= 0.1 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""}
                                                >
                                                    {(data.errorRate * 100).toFixed(1)}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Cpu className="w-8 h-8 text-muted-foreground/50" />
                                                <p className="text-sm text-muted-foreground">No agent activity yet</p>
                                                <p className="text-xs text-muted-foreground/70">Send a message in the Studio to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
