/**
 * OpenTelemetry Tracer Initialisation for HIVE-R
 *
 * IMPORTANT: This file MUST be imported before any other module that uses
 * Node.js built-in `http` — OTel's auto-instrumentation patches the module
 * at import time.
 *
 * Environment variables:
 *   OTEL_ENABLED          — set to "true" to activate tracing (default: false)
 *   OTEL_EXPORTER_URL     — OTLP HTTP endpoint (default: http://localhost:4318)
 *   OTEL_SAMPLE_RATE      — 0.0–1.0 sampling ratio (default: 1.0 in dev, 0.1 in prod)
 *   OTEL_SERVICE_NAME     — service name tag (default: hive-r)
 */

import { trace, context, SpanStatusCode, type Span, type Tracer } from "@opentelemetry/api";

// Only bootstrap the SDK if tracing is enabled
const isEnabled = process.env.OTEL_ENABLED === "true";

if (isEnabled) {
    // Dynamic imports — avoid loading heavy SDK when tracing is off
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { HttpInstrumentation } = await import("@opentelemetry/instrumentation-http");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const semConv = await import("@opentelemetry/semantic-conventions");

    const sampleRate = parseFloat(
        process.env.OTEL_SAMPLE_RATE ??
        (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
    );

    // Build sampler if sub-100% sampling requested
    let sampler: any;
    if (sampleRate < 1.0) {
        const traceBase = await import("@opentelemetry/sdk-trace-base");
        sampler = new traceBase.TraceIdRatioBasedSampler(sampleRate);
    }

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [semConv.ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "hive-r",
            [semConv.ATTR_SERVICE_VERSION]: "1.0.0",
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${process.env.OTEL_EXPORTER_URL ?? "http://localhost:4318"}/v1/traces`,
        }),
        instrumentations: [new HttpInstrumentation()],
        ...(sampler ? { sampler } : {}),
    });

    sdk.start();

    // Graceful shutdown
    const shutdown = () => {
        sdk
            .shutdown()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // eslint-disable-next-line no-console
    console.log(
        `[otel] Tracing enabled — exporting to ${process.env.OTEL_EXPORTER_URL ?? "http://localhost:4318"} (sample rate: ${sampleRate})`,
    );
}

// ============================================================================
// PUBLIC API — safe to call even when tracing is disabled (no-ops)
// ============================================================================

const TRACER_NAME = "hive-r";

/** Get the singleton tracer instance (no-op tracer when OTel is disabled). */
export function getTracer(): Tracer {
    return trace.getTracer(TRACER_NAME);
}

/**
 * Run an async function inside a new child span.
 *
 * Usage:
 *   const result = await withSpan("hive.agent.Builder", async (span) => {
 *       span.setAttribute("agent.model", "gpt-4o");
 *       return await doWork();
 *   });
 */
export async function withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
): Promise<T> {
    const tracer = getTracer();
    return tracer.startActiveSpan(name, async (span) => {
        try {
            if (attributes) {
                for (const [k, v] of Object.entries(attributes)) {
                    span.setAttribute(k, v);
                }
            }
            const result = await fn(span);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (err) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: err instanceof Error ? err.message : String(err),
            });
            span.recordException(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            span.end();
        }
    });
}

/**
 * Get the currently active span (if any).
 * Returns undefined when no span is active or tracing is disabled.
 */
export function getActiveSpan(): Span | undefined {
    return trace.getActiveSpan();
}

// Re-export context for advanced propagation
export { context, SpanStatusCode };
