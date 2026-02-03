/**
 * HIVE-R Metrics Collection
 * Tracks system performance and operational health
 */

interface RequestMetric {
    count: number;
    totalDuration: number;
    errors: number;
}

interface AgentMetric {
    invocations: number;
    totalDuration: number;
    errors: number;
}

class MetricsCollector {
    private startTime = Date.now();
    private requests: Map<string, RequestMetric> = new Map();
    private agents: Map<string, AgentMetric> = new Map();
    private totalRequests = 0;
    private totalErrors = 0;

    /**
     * Record an HTTP request
     */
    recordRequest(path: string, duration: number, isError: boolean) {
        this.totalRequests++;
        if (isError) this.totalErrors++;

        const existing = this.requests.get(path) || { count: 0, totalDuration: 0, errors: 0 };
        existing.count++;
        existing.totalDuration += duration;
        if (isError) existing.errors++;
        this.requests.set(path, existing);
    }

    /**
     * Record an agent invocation
     */
    recordAgent(agentName: string, duration: number, isError: boolean) {
        const existing = this.agents.get(agentName) || { invocations: 0, totalDuration: 0, errors: 0 };
        existing.invocations++;
        existing.totalDuration += duration;
        if (isError) existing.errors++;
        this.agents.set(agentName, existing);
    }

    /**
     * Get all metrics
     */
    getMetrics() {
        const uptimeMs = Date.now() - this.startTime;
        const memory = process.memoryUsage();

        const requestMetrics: Record<string, { count: number; avgDuration: number; errorRate: number }> = {};
        for (const [path, metric] of this.requests) {
            requestMetrics[path] = {
                count: metric.count,
                avgDuration: Math.round(metric.totalDuration / metric.count),
                errorRate: metric.count > 0 ? metric.errors / metric.count : 0,
            };
        }

        const agentMetrics: Record<string, { invocations: number; avgDuration: number; errorRate: number }> = {};
        for (const [agent, metric] of this.agents) {
            agentMetrics[agent] = {
                invocations: metric.invocations,
                avgDuration: Math.round(metric.totalDuration / metric.invocations),
                errorRate: metric.invocations > 0 ? metric.errors / metric.invocations : 0,
            };
        }

        return {
            system: {
                uptime: uptimeMs,
                uptimeHuman: this.formatDuration(uptimeMs),
                memory: {
                    heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
                    rss: Math.round(memory.rss / 1024 / 1024),
                },
                nodeVersion: process.version,
            },
            requests: {
                total: this.totalRequests,
                errors: this.totalErrors,
                errorRate: this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0,
                byPath: requestMetrics,
            },
            agents: agentMetrics,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get Prometheus-format metrics
     */
    getPrometheusMetrics(): string {
        const metrics = this.getMetrics();
        const lines: string[] = [];

        // System metrics
        lines.push(`# HELP hive_uptime_seconds System uptime in seconds`);
        lines.push(`# TYPE hive_uptime_seconds gauge`);
        lines.push(`hive_uptime_seconds ${Math.round(metrics.system.uptime / 1000)}`);

        lines.push(`# HELP hive_memory_heap_bytes Heap memory usage in bytes`);
        lines.push(`# TYPE hive_memory_heap_bytes gauge`);
        lines.push(`hive_memory_heap_bytes ${metrics.system.memory.heapUsed * 1024 * 1024}`);

        // Request metrics
        lines.push(`# HELP hive_requests_total Total HTTP requests`);
        lines.push(`# TYPE hive_requests_total counter`);
        lines.push(`hive_requests_total ${metrics.requests.total}`);

        lines.push(`# HELP hive_errors_total Total errors`);
        lines.push(`# TYPE hive_errors_total counter`);
        lines.push(`hive_errors_total ${metrics.requests.errors}`);

        // Agent metrics
        lines.push(`# HELP hive_agent_invocations_total Agent invocations by name`);
        lines.push(`# TYPE hive_agent_invocations_total counter`);
        for (const [agent, data] of Object.entries(metrics.agents)) {
            lines.push(`hive_agent_invocations_total{agent="${agent}"} ${data.invocations}`);
        }

        return lines.join("\n");
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.requests.clear();
        this.agents.clear();
        this.totalRequests = 0;
        this.totalErrors = 0;
    }
}

// Singleton instance
export const metrics = new MetricsCollector();
