/**
 * CostDashboard — LLM Cost Visualization
 *
 * Fetches from /admin/costs/* endpoints and renders:
 *   - Big number cards (today, month, projection)
 *   - Budget gauge
 *   - Line chart (30-day trend)
 *   - Bar chart (cost per agent)
 *   - Table (top 10 expensive queries)
 *
 * Auto-refreshes every 30 seconds.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import './CostDashboard.css';

// ============================================================================
// Types
// ============================================================================

interface TodayData {
    data: { date: string; totalCost: number; totalTokensIn: number; totalTokensOut: number; callCount: number };
    budget: { daily: number; remaining: number };
    cached: boolean;
}

interface AgentCost {
    agentName: string;
    totalCost: number;
    totalTokensIn: number;
    totalTokensOut: number;
    callCount: number;
    avgLatencyMs: number;
}

interface TrendDay {
    date: string;
    totalCost: number;
    callCount: number;
    totalTokensIn: number;
    totalTokensOut: number;
}

interface TrendData {
    days: number;
    trend: TrendDay[];
    totals: { totalCost: number; totalCalls: number; totalTokensIn: number; totalTokensOut: number };
}

interface TopQuery {
    id: string;
    agentName: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    threadId?: string;
    createdAt: string;
}

interface ProjectionData {
    data: {
        currentDailyCost: number;
        projectedMonthlyCost: number;
        daysAnalyzed: number;
        dailyAverage: number;
        trend: 'increasing' | 'decreasing' | 'stable';
        trendPercentage: number;
    };
    cached: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const HIVE_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL = 30_000; // 30 seconds

// Agent colors for the bar chart
const AGENT_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6d28d9', '#be185d',
];

// ============================================================================
// Fetcher
// ============================================================================

async function fetchCostAPI<T>(path: string): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${HIVE_SERVER}/admin/costs${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        throw new Error(`API ${res.status}: ${res.statusText}`);
    }

    return res.json();
}

// ============================================================================
// Helper
// ============================================================================

function fmtCost(cost: number): string {
    if (cost >= 1) return `$${cost.toFixed(2)}`;
    if (cost >= 0.01) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(4)}`;
}

function fmtTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function fmtDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Custom Recharts Tooltip
// ============================================================================

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(15, 15, 15, 0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.75rem',
        }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color, fontWeight: 600 }}>
                    {p.name}: {typeof p.value === 'number' ? fmtCost(p.value) : p.value}
                </p>
            ))}
        </div>
    );
}

// ============================================================================
// CostDashboard Component
// ============================================================================

export function CostDashboard() {
    const [today, setToday] = useState<TodayData | null>(null);
    const [agents, setAgents] = useState<AgentCost[]>([]);
    const [trend, setTrend] = useState<TrendData | null>(null);
    const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
    const [projection, setProjection] = useState<ProjectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchAll = useCallback(async () => {
        try {
            const [todayRes, agentsRes, trendRes, topRes, projRes] = await Promise.all([
                fetchCostAPI<TodayData>('/today'),
                fetchCostAPI<{ data: AgentCost[] }>('/by-agent?period=month'),
                fetchCostAPI<TrendData>('/trend?days=30'),
                fetchCostAPI<{ data: TopQuery[] }>('/top-queries?limit=10'),
                fetchCostAPI<ProjectionData>('/projection'),
            ]);

            setToday(todayRes);
            setAgents(agentsRes.data || []);
            setTrend(trendRes);
            setTopQueries(topRes.data || []);
            setProjection(projRes);
            setError(null);
            setLastRefresh(new Date());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchAll]);

    // ── Loading State ──
    if (loading) {
        return (
            <div className="cost-dashboard">
                <div className="cost-loading">
                    <span className="cost-spinner">⏳</span> Loading cost data…
                </div>
            </div>
        );
    }

    // ── Error State ──
    if (error) {
        return (
            <div className="cost-dashboard">
                <div className="cost-error">
                    ⚠️ {error} — costs may require admin access
                </div>
            </div>
        );
    }

    const budgetPercent = today
        ? Math.min(100, (today.data.totalCost / today.budget.daily) * 100)
        : 0;

    const budgetStatus = budgetPercent > 90 ? 'danger' : budgetPercent > 70 ? 'warning' : 'safe';

    // Format trend data for chart
    const trendChartData = (trend?.trend || []).map(d => ({
        date: fmtDate(d.date),
        cost: d.totalCost,
        calls: d.callCount,
    }));

    // Format agent data for chart
    const agentChartData = agents.slice(0, 8).map(a => ({
        name: a.agentName,
        cost: a.totalCost,
    }));

    return (
        <div className="cost-dashboard">
            <div className="cost-dashboard-title">💰 LLM Cost Dashboard</div>
            <div className="cost-refresh-info">
                Auto-refreshes every 30s · Last update: {lastRefresh.toLocaleTimeString()}
            </div>

            {/* ── Big Number Cards ── */}
            <div className="cost-metric-cards">
                <div className="cost-metric-card">
                    <div className="cost-card-emoji">📊</div>
                    <div className="cost-card-label">Today's Spend</div>
                    <div className="cost-card-value">{fmtCost(today?.data.totalCost || 0)}</div>
                    <div className="cost-card-sub">{today?.data.callCount || 0} API calls</div>
                </div>

                <div className="cost-metric-card">
                    <div className="cost-card-emoji">📅</div>
                    <div className="cost-card-label">This Month</div>
                    <div className="cost-card-value">{fmtCost(trend?.totals.totalCost || 0)}</div>
                    <div className="cost-card-sub">{fmtTokens(trend?.totals.totalTokensIn || 0)} tokens in</div>
                </div>

                <div className="cost-metric-card">
                    <div className="cost-card-emoji">🔮</div>
                    <div className="cost-card-label">Monthly Projection</div>
                    <div className="cost-card-value">{fmtCost(projection?.data.projectedMonthlyCost || 0)}</div>
                    <div className="cost-card-sub">
                        {projection?.data.trend && (
                            <span className={`trend-badge ${projection.data.trend}`}>
                                {projection.data.trend === 'increasing' ? '↑' :
                                    projection.data.trend === 'decreasing' ? '↓' : '→'}
                                {' '}{Math.abs(projection.data.trendPercentage)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="cost-metric-card">
                    <div className="cost-card-emoji">⚡</div>
                    <div className="cost-card-label">Daily Average</div>
                    <div className="cost-card-value">{fmtCost(projection?.data.dailyAverage || 0)}</div>
                    <div className="cost-card-sub">{projection?.data.daysAnalyzed || 0} days analyzed</div>
                </div>
            </div>

            {/* ── Budget Gauge ── */}
            <div className="budget-gauge">
                <div className="budget-gauge-header">
                    <span className="budget-gauge-label">🎯 Daily Budget</span>
                    <span className="budget-gauge-amount">
                        {fmtCost(today?.data.totalCost || 0)} / {fmtCost(today?.budget.daily || 50)}
                    </span>
                </div>
                <div className="budget-bar-track">
                    <div
                        className={`budget-bar-fill ${budgetStatus}`}
                        style={{ width: `${budgetPercent}%` }}
                    />
                </div>
                <div className="budget-labels">
                    <span>{budgetPercent.toFixed(1)}% used</span>
                    <span>{fmtCost(today?.budget.remaining || 0)} remaining</span>
                </div>
            </div>

            {/* ── Charts Grid ── */}
            <div className="cost-charts-grid">
                {/* Line Chart: 30-day Trend */}
                <div className="cost-chart-card">
                    <div className="cost-chart-title">📈 Cost Trend (30 Days)</div>
                    {trendChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={trendChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="cost"
                                    name="Cost"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ fill: '#8b5cf6', r: 3 }}
                                    activeDot={{ r: 5, fill: '#a78bfa' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="cost-chart-empty">No trend data yet</div>
                    )}
                </div>

                {/* Bar Chart: Cost per Agent */}
                <div className="cost-chart-card">
                    <div className="cost-chart-title">🤖 Cost by Agent (Month)</div>
                    {agentChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={agentChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    type="number"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    width={90}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="cost" name="Cost" radius={[0, 4, 4, 0]} barSize={16}>
                                    {agentChartData.map((_, i) => (
                                        <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="cost-chart-empty">No agent data yet</div>
                    )}
                </div>
            </div>

            {/* ── Top Queries Table ── */}
            <div className="cost-table-card">
                <div className="cost-table-header">🔥 Top 10 Most Expensive Queries</div>
                <table className="cost-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Agent</th>
                            <th>Model</th>
                            <th>Tokens In</th>
                            <th>Tokens Out</th>
                            <th>Cost</th>
                            <th>Latency</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topQueries.length > 0 ? (
                            topQueries.map((q, i) => (
                                <tr key={q.id}>
                                    <td>{i + 1}</td>
                                    <td><span className="agent-badge">{q.agentName}</span></td>
                                    <td><span className="model-badge">{q.model}</span></td>
                                    <td>{fmtTokens(q.tokensIn)}</td>
                                    <td>{fmtTokens(q.tokensOut)}</td>
                                    <td><span className="cost-highlight">{fmtCost(q.costUsd)}</span></td>
                                    <td>{(q.latencyMs / 1000).toFixed(1)}s</td>
                                    <td style={{ color: 'rgba(255,255,255,0.4)' }}>{fmtDate(q.createdAt)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="empty-message">
                                    No queries recorded yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CostDashboard;
