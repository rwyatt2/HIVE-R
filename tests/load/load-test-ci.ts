/**
 * CI-Friendly Load Testing for HIVE-R
 * 
 * Lightweight load test designed for CI pipelines.
 * Returns non-zero exit code if performance targets are not met.
 * 
 * Run with: npm run test:load:ci
 */

const BASE_URL = process.env.HIVE_URL || "http://localhost:3000";
const CONCURRENT_SESSIONS = parseInt(process.env.CI_LOAD_CONCURRENT || "5");
const REQUESTS_PER_SESSION = parseInt(process.env.CI_LOAD_REQUESTS || "3");

// Performance targets (in milliseconds)
const TARGETS = {
    p50: parseInt(process.env.CI_TARGET_P50 || "3000"),
    p95: parseInt(process.env.CI_TARGET_P95 || "10000"),
    p99: parseInt(process.env.CI_TARGET_P99 || "30000"),
    errorRate: parseFloat(process.env.CI_TARGET_ERROR_RATE || "0.05"), // 5%
};

interface TestResult {
    passed: boolean;
    totalRequests: number;
    successfulRequests: number;
    errorRate: number;
    p50: number;
    p95: number;
    p99: number;
    violations: string[];
}

const TEST_PROMPTS = [
    "Hello, can you help me?",
    "What is 2 + 2?",
    "Explain TypeScript briefly",
];

async function makeRequest(sessionId: string, requestId: number): Promise<{ duration: number; success: boolean }> {
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
                threadId: `ci-load-${sessionId}`,
            }),
        });

        return {
            duration: Date.now() - startTime,
            success: response.ok,
        };
    } catch {
        return {
            duration: Date.now() - startTime,
            success: false,
        };
    }
}

async function runSession(sessionId: string): Promise<Array<{ duration: number; success: boolean }>> {
    const results = [];
    for (let i = 0; i < REQUESTS_PER_SESSION; i++) {
        results.push(await makeRequest(sessionId, i));
        await new Promise(r => setTimeout(r, 50)); // Small delay
    }
    return results;
}

function calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
}

async function runCILoadTest(): Promise<TestResult> {
    console.log("🧪 HIVE-R CI Load Test");
    console.log("═══════════════════════════════════════");
    console.log(`Target: ${BASE_URL}`);
    console.log(`Sessions: ${CONCURRENT_SESSIONS} × ${REQUESTS_PER_SESSION} requests`);
    console.log(`Total: ${CONCURRENT_SESSIONS * REQUESTS_PER_SESSION} requests`);
    console.log("═══════════════════════════════════════\n");

    // Run sessions concurrently
    const sessionPromises = Array.from(
        { length: CONCURRENT_SESSIONS },
        (_, i) => runSession(`session-${i}`)
    );

    const allResults = (await Promise.all(sessionPromises)).flat();

    // Calculate metrics
    const durations = allResults.map(r => r.duration);
    const successCount = allResults.filter(r => r.success).length;
    const errorRate = 1 - (successCount / allResults.length);

    const p50 = calculatePercentile(durations, 50);
    const p95 = calculatePercentile(durations, 95);
    const p99 = calculatePercentile(durations, 99);

    // Check violations
    const violations: string[] = [];

    if (p50 > TARGETS.p50) {
        violations.push(`P50 ${p50}ms > ${TARGETS.p50}ms target`);
    }
    if (p95 > TARGETS.p95) {
        violations.push(`P95 ${p95}ms > ${TARGETS.p95}ms target`);
    }
    if (p99 > TARGETS.p99) {
        violations.push(`P99 ${p99}ms > ${TARGETS.p99}ms target`);
    }
    if (errorRate > TARGETS.errorRate) {
        violations.push(`Error rate ${(errorRate * 100).toFixed(1)}% > ${(TARGETS.errorRate * 100)}% target`);
    }

    const passed = violations.length === 0;

    // Output results
    console.log("📊 Results");
    console.log("───────────────────────────────────────");
    console.log(`Total:     ${allResults.length} requests`);
    console.log(`Success:   ${successCount} (${((successCount / allResults.length) * 100).toFixed(1)}%)`);
    console.log(`Failed:    ${allResults.length - successCount}`);
    console.log("");
    console.log("⏱️  Response Times");
    console.log("───────────────────────────────────────");
    console.log(`P50:       ${p50}ms (target: ${TARGETS.p50}ms)`);
    console.log(`P95:       ${p95}ms (target: ${TARGETS.p95}ms)`);
    console.log(`P99:       ${p99}ms (target: ${TARGETS.p99}ms)`);
    console.log("═══════════════════════════════════════\n");

    if (passed) {
        console.log("✅ All performance targets met!");
    } else {
        console.log("❌ Performance targets not met:");
        violations.forEach(v => console.log(`   • ${v}`));
    }

    return {
        passed,
        totalRequests: allResults.length,
        successfulRequests: successCount,
        errorRate,
        p50,
        p95,
        p99,
        violations,
    };
}

// Output JSON for CI parsing
async function main() {
    try {
        const result = await runCILoadTest();

        // Output JSON summary for CI systems
        console.log("\n📄 JSON Report:");
        console.log(JSON.stringify(result, null, 2));

        // Exit with appropriate code
        process.exit(result.passed ? 0 : 1);
    } catch (error) {
        console.error("❌ Load test failed:", error);
        process.exit(2);
    }
}

main();
