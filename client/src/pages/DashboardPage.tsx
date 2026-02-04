/**
 * Dashboard Page
 * 
 * System metrics and agent activity dashboard.
 * Ported from dashboard/src/app/page.tsx to React component.
 */

import { useEffect, useState } from 'react';
import './DashboardPage.css';

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

const HIVE_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function DashboardPage() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers: HeadersInit = token
                    ? { Authorization: `Bearer ${token}` }
                    : {};

                const [healthRes, metricsRes] = await Promise.all([
                    fetch(`${HIVE_SERVER}/health`, { headers }),
                    fetch(`${HIVE_SERVER}/metrics`, { headers }),
                ]);

                if (healthRes.ok) {
                    setHealth(await healthRes.json());
                }
                if (metricsRes.ok) {
                    setMetrics(await metricsRes.json());
                }
                setError(null);
            } catch {
                setError('Cannot connect to HIVE-R server. Is it running?');
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-error">
                    <div className="error-emoji">🐝</div>
                    <h1>HIVE-R Dashboard</h1>
                    <p className="error-message">{error}</p>
                    <p className="error-hint">Run `npm run dev` in the HIVE-R directory</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Monitor your HIVE-R agent system</p>
            </div>

            {/* Status Cards */}
            <div className="status-cards">
                <div className="status-card">
                    <div className="card-label">Status</div>
                    <div className="card-value">
                        <span className={`status-dot ${health ? 'online' : 'offline'}`} />
                        {health?.status || 'Offline'}
                    </div>
                </div>

                <div className="status-card">
                    <div className="card-label">Agents</div>
                    <div className="card-value">{health?.agents || 0}</div>
                </div>

                <div className="status-card">
                    <div className="card-label">Uptime</div>
                    <div className="card-value">{metrics?.system.uptimeHuman || '-'}</div>
                </div>

                <div className="status-card">
                    <div className="card-label">Requests</div>
                    <div className="card-value">{metrics?.requests.total || 0}</div>
                </div>
            </div>

            {/* Memory Usage */}
            {metrics && (
                <div className="dashboard-section">
                    <h2>Memory Usage</h2>
                    <div className="memory-bar-container">
                        <div
                            className="memory-bar"
                            style={{
                                width: `${(metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100}%`
                            }}
                        />
                    </div>
                    <div className="memory-labels">
                        <span>{(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(1)} MB used</span>
                        <span>{(metrics.system.memory.heapTotal / 1024 / 1024).toFixed(1)} MB total</span>
                    </div>
                </div>
            )}

            {/* Agent Activity */}
            <div className="dashboard-section">
                <h2>Agent Activity</h2>
                <div className="agent-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Invocations</th>
                                <th>Avg Duration</th>
                                <th>Error Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics?.agents && Object.entries(metrics.agents).length > 0 ? (
                                Object.entries(metrics.agents).map(([agent, data]) => (
                                    <tr key={agent}>
                                        <td className="agent-name">{agent}</td>
                                        <td>{data.invocations}</td>
                                        <td>{data.avgDuration}ms</td>
                                        <td>
                                            <span className={data.errorRate > 0.1 ? 'error-rate-high' : 'error-rate-low'}>
                                                {(data.errorRate * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="empty-message">
                                        No agent activity yet. Send a message to start!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
