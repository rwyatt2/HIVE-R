"use client";

import { useEffect, useState } from "react";

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

const HIVE_SERVER = process.env.NEXT_PUBLIC_HIVE_SERVER || "http://localhost:3000";

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, metricsRes] = await Promise.all([
          fetch(`${HIVE_SERVER}/health`),
          fetch(`${HIVE_SERVER}/metrics`),
        ]);

        if (healthRes.ok) {
          setHealth(await healthRes.json());
        }
        if (metricsRes.ok) {
          setMetrics(await metricsRes.json());
        }
        setError(null);
      } catch {
        setError("Cannot connect to HIVE-R server. Is it running?");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-4">🐝</div>
        <h1 className="text-2xl font-bold mb-2">HIVE-R Dashboard</h1>
        <p className="text-red-400">{error}</p>
        <p className="text-zinc-500 mt-2">Run `npm run dev` in the HIVE-R directory</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400">Monitor your HIVE-R agent system</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-400 text-sm mb-1">Status</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${health ? "bg-green-500" : "bg-red-500"}`} />
            {health?.status || "Offline"}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-400 text-sm mb-1">Agents</div>
          <div className="text-2xl font-bold">{health?.agents || 0}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-400 text-sm mb-1">Uptime</div>
          <div className="text-2xl font-bold">{metrics?.system.uptimeHuman || "-"}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-400 text-sm mb-1">Requests</div>
          <div className="text-2xl font-bold">{metrics?.requests.total || 0}</div>
        </div>
      </div>

      {/* Agent Activity */}
      <div>
        <h2 className="text-xl font-bold mb-4">Agent Activity</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-3 text-zinc-400">Agent</th>
                <th className="text-left p-3 text-zinc-400">Invocations</th>
                <th className="text-left p-3 text-zinc-400">Avg Duration</th>
                <th className="text-left p-3 text-zinc-400">Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.agents && Object.entries(metrics.agents).length > 0 ? (
                Object.entries(metrics.agents).map(([agent, data]) => (
                  <tr key={agent} className="border-t border-zinc-800">
                    <td className="p-3 font-medium">{agent}</td>
                    <td className="p-3">{data.invocations}</td>
                    <td className="p-3">{data.avgDuration}ms</td>
                    <td className="p-3">
                      <span className={data.errorRate > 0.1 ? "text-red-400" : "text-green-400"}>
                        {(data.errorRate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-zinc-500">
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
