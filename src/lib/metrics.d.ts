/**
 * HIVE-R Metrics Collection
 * Tracks system performance and operational health
 */
declare class MetricsCollector {
    private startTime;
    private requests;
    private agents;
    private totalRequests;
    private totalErrors;
    /**
     * Record an HTTP request
     */
    recordRequest(path: string, duration: number, isError: boolean): void;
    /**
     * Record an agent invocation
     */
    recordAgent(agentName: string, duration: number, isError: boolean): void;
    /**
     * Get all metrics
     */
    getMetrics(): {
        system: {
            uptime: number;
            uptimeHuman: string;
            memory: {
                heapUsed: number;
                heapTotal: number;
                rss: number;
            };
            nodeVersion: string;
        };
        requests: {
            total: number;
            errors: number;
            errorRate: number;
            byPath: Record<string, {
                count: number;
                avgDuration: number;
                errorRate: number;
            }>;
        };
        agents: Record<string, {
            invocations: number;
            avgDuration: number;
            errorRate: number;
        }>;
        timestamp: string;
    };
    /**
     * Get Prometheus-format metrics
     */
    getPrometheusMetrics(): string;
    private formatDuration;
    /**
     * Reset all metrics
     */
    reset(): void;
}
export declare const metrics: MetricsCollector;
export {};
//# sourceMappingURL=metrics.d.ts.map