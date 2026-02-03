/**
 * Load Testing Harness for HIVE-R
 * 
 * Stress tests the system with concurrent sessions.
 * Run with: npx tsx tests/load/load-test.ts
 */

const BASE_URL = process.env.HIVE_URL || "http://localhost:3000";
const CONCURRENT_SESSIONS = parseInt(process.env.LOAD_CONCURRENT || "10");
const REQUESTS_PER_SESSION = parseInt(process.env.LOAD_REQUESTS || "5");

interface RequestMetric {
    sessionId: string;
    requestId: number;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    statusCode: number;
    error?: string;
}

interface LoadTestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalDuration: number;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    requestsPerSecond: number;
    metrics: RequestMetric[];
}

const TEST_PROMPTS = [
    "Create a simple hello world function",
    "Design a button component",
    "What are the best practices for error handling?",
    "Create a user authentication flow",
    "Build a TODO list component",
];

async function makeRequest(sessionId: string, requestId: number): Promise<RequestMetric> {
    const startTime = Date.now();
    const prompt = TEST_PROMPTS[requestId % TEST_PROMPTS.length];

    try {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(process.env.HIVE_API_KEY && { "Authorization": `Bearer ${process.env.HIVE_API_KEY}` }),
            },
            body: JSON.stringify({
                message: prompt,
                threadId: `load-test-${sessionId}`,
            }),
        });

        const endTime = Date.now();

        return {
            sessionId,
            requestId,
            startTime,
            endTime,
            duration: endTime - startTime,
            success: response.ok,
            statusCode: response.status,
        };
    } catch (error) {
        const endTime = Date.now();
        return {
            sessionId,
            requestId,
            startTime,
            endTime,
            duration: endTime - startTime,
            success: false,
            statusCode: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

async function runSession(sessionId: string): Promise<RequestMetric[]> {
    const metrics: RequestMetric[] = [];

    for (let i = 0; i < REQUESTS_PER_SESSION; i++) {
        const metric = await makeRequest(sessionId, i);
        metrics.push(metric);

        // Small delay between requests in same session
        await new Promise(r => setTimeout(r, 100));
    }

    return metrics;
}

function calculatePercentile(durations: number[], percentile: number): number {
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
}

async function runLoadTest(): Promise<LoadTestResult> {
    console.log(`\n🔥 HIVE-R Load Test`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Target: ${BASE_URL}`);
    console.log(`Concurrent Sessions: ${CONCURRENT_SESSIONS}`);
    console.log(`Requests per Session: ${REQUESTS_PER_SESSION}`);
    console.log(`Total Requests: ${CONCURRENT_SESSIONS * REQUESTS_PER_SESSION}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const startTime = Date.now();

    // Run all sessions concurrently
    const sessionPromises: Promise<RequestMetric[]>[] = [];
    for (let i = 0; i < CONCURRENT_SESSIONS; i++) {
        sessionPromises.push(runSession(`session-${i}`));
    }

    const sessionResults = await Promise.all(sessionPromises);
    const allMetrics = sessionResults.flat();

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Calculate stats
    const durations = allMetrics.map(m => m.duration);
    const successCount = allMetrics.filter(m => m.success).length;

    const result: LoadTestResult = {
        totalRequests: allMetrics.length,
        successfulRequests: successCount,
        failedRequests: allMetrics.length - successCount,
        totalDuration,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: calculatePercentile(durations, 50),
        p95: calculatePercentile(durations, 95),
        p99: calculatePercentile(durations, 99),
        requestsPerSecond: (allMetrics.length / totalDuration) * 1000,
        metrics: allMetrics,
    };

    // Print results
    console.log(`\n📊 Results`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total Requests:  ${result.totalRequests}`);
    console.log(`Successful:      ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed:          ${result.failedRequests}`);
    console.log(`Total Duration:  ${(result.totalDuration / 1000).toFixed(2)}s`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n⏱️ Response Times`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Average:  ${(result.avgDuration / 1000).toFixed(2)}s`);
    console.log(`P50:      ${(result.p50 / 1000).toFixed(2)}s`);
    console.log(`P95:      ${(result.p95 / 1000).toFixed(2)}s`);
    console.log(`P99:      ${(result.p99 / 1000).toFixed(2)}s`);
    console.log(`RPS:      ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Check against targets
    const targets = { p50: 3000, p95: 10000, p99: 30000 };
    const passed = result.p50 <= targets.p50 && result.p95 <= targets.p95 && result.p99 <= targets.p99;

    if (passed) {
        console.log(`✅ All performance targets met!`);
    } else {
        console.log(`⚠️ Some targets missed:`);
        if (result.p50 > targets.p50) console.log(`   P50: ${result.p50}ms > ${targets.p50}ms target`);
        if (result.p95 > targets.p95) console.log(`   P95: ${result.p95}ms > ${targets.p95}ms target`);
        if (result.p99 > targets.p99) console.log(`   P99: ${result.p99}ms > ${targets.p99}ms target`);
    }

    return result;
}

// Run if executed directly
runLoadTest().catch(console.error);
