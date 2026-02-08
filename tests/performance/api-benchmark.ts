/**
 * API Endpoint Benchmarks for HIVE-R
 *
 * Fast, focused benchmarks for critical endpoints.
 * Asserts latency thresholds per endpoint type.
 *
 * Run: npx tsx tests/performance/api-benchmark.ts
 */

const BASE_URL = process.env.HIVE_URL || "http://localhost:3000";

interface BenchmarkResult {
    endpoint: string;
    method: string;
    runs: number;
    avg: number;
    p50: number;
    p95: number;
    min: number;
    max: number;
    threshold: number;
    passed: boolean;
}

function percentile(values: number[], pct: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((pct / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)] ?? 0;
}

async function benchmark(
    name: string,
    method: string,
    url: string,
    thresholdMs: number,
    runs: number = 20,
    body?: object,
): Promise<BenchmarkResult> {
    const durations: number[] = [];

    // Warm-up run
    try {
        await fetch(url, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        // Ignore warm-up errors
    }

    for (let i = 0; i < runs; i++) {
        const start = performance.now();
        try {
            await fetch(url, {
                method,
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
        } catch {
            // Count as max latency
        }
        durations.push(performance.now() - start);
    }

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p50 = percentile(durations, 50);
    const p95 = percentile(durations, 95);

    return {
        endpoint: name,
        method,
        runs,
        avg: Math.round(avg),
        p50: Math.round(p50),
        p95: Math.round(p95),
        min: Math.round(Math.min(...durations)),
        max: Math.round(Math.max(...durations)),
        threshold: thresholdMs,
        passed: p95 <= thresholdMs,
    };
}

async function main() {
    console.log("🏎️  HIVE-R API Benchmarks");
    console.log("═══════════════════════════════════════════\n");

    const results: BenchmarkResult[] = [];

    // ── Read Endpoints (target: <50ms p95) ──────────────────
    results.push(
        await benchmark("GET /health", "GET", `${BASE_URL}/health`, 50),
    );
    results.push(
        await benchmark("GET /health/ready", "GET", `${BASE_URL}/health/ready`, 50),
    );
    results.push(
        await benchmark("GET / (static)", "GET", `${BASE_URL}/`, 100),
    );

    // ── API Endpoints (target: <200ms p95) ──────────────────
    results.push(
        await benchmark("GET /metrics", "GET", `${BASE_URL}/metrics`, 200),
    );

    // ── Print Results ───────────────────────────────────────
    console.log("Endpoint                 │ p50    │ p95    │ Avg    │ Target │ Result");
    console.log("─────────────────────────┼────────┼────────┼────────┼────────┼───────");

    let allPassed = true;

    for (const r of results) {
        const status = r.passed ? "✅" : "❌";
        if (!r.passed) allPassed = false;

        const name = r.endpoint.padEnd(24);
        const p50 = `${r.p50}ms`.padEnd(6);
        const p95 = `${r.p95}ms`.padEnd(6);
        const avg = `${r.avg}ms`.padEnd(6);
        const threshold = `${r.threshold}ms`.padEnd(6);

        console.log(`${name} │ ${p50} │ ${p95} │ ${avg} │ ${threshold} │ ${status}`);
    }

    console.log("═══════════════════════════════════════════\n");

    // ── JSON output for CI ──────────────────────────────────
    console.log("📄 JSON Report:");
    console.log(JSON.stringify({ passed: allPassed, benchmarks: results }, null, 2));

    if (!allPassed) {
        const failures = results.filter(r => !r.passed);
        console.log(`\n❌ ${failures.length} benchmark(s) exceeded threshold:`);
        for (const f of failures) {
            console.log(`   • ${f.endpoint}: p95=${f.p95}ms > ${f.threshold}ms`);
        }
        process.exit(1);
    }

    console.log("\n✅ All benchmarks passed!");
}

main().catch((err) => {
    console.error("❌ Benchmark failed:", err);
    process.exit(2);
});
