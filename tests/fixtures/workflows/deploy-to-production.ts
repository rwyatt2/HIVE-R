/**
 * Workflow Fixture: "Deploy this to production"
 *
 * Expected path: Router → SRE → Router → Security → Router → FINISH
 *
 * SRE creates the deployment plan, Security reviews it for production safety.
 */

// ============================================================================
// Router Decisions (3 sequential calls)
// ============================================================================

export const ROUTER_DECISIONS = [
    { next: "SRE", reasoning: "User wants to deploy — SRE should create the deployment strategy and runbook" },
    { next: "Security", reasoning: "Deployment plan ready — Security should review for production safety before shipping" },
    { next: "FINISH", reasoning: "Deployment plan and security review complete — safe to proceed" },
];

// ============================================================================
// SRE Response (simple content via safeAgentCall)
// ============================================================================

export const SRE_RESPONSE = {
    content: `**[SRE]**: Here's the production deployment plan.

# Deployment Strategy: Blue-Green Deployment

## Pre-Deployment Checklist
- [ ] All CI/CD pipelines passing
- [ ] Database migrations tested against staging snapshot
- [ ] Feature flags configured for gradual rollout
- [ ] Rollback procedure documented and tested

## Deployment Steps
1. **Blue Environment**: Current production (v1.2.3)
2. **Green Environment**: New release (v1.3.0)
3. Deploy to green environment
4. Run smoke tests against green
5. Switch load balancer to green
6. Monitor for 30 minutes
7. If healthy: decommission blue
8. If issues: instant rollback to blue

## Monitoring
- **Health Check**: GET /health — expect 200 within 500ms
- **Error Rate**: Alert if 5xx > 0.1% over 5 minutes
- **Latency**: P99 < 2s, alert if > 3s
- **Memory**: Alert if > 80% heap utilization

## Rollback Plan
- **Trigger**: Any P0 alert within first hour
- **Action**: Switch LB back to blue environment
- **Time to Rollback**: < 30 seconds
- **Verification**: Confirm blue health check passing

## Alerting
| Metric | Warning | Critical | Channel |
|--------|---------|----------|---------|
| Error Rate | > 0.05% | > 0.1% | #ops-alerts |
| P99 Latency | > 1.5s | > 3s | #ops-alerts |
| Memory | > 70% | > 85% | PagerDuty |
| CPU | > 60% | > 80% | PagerDuty |`,
};

// ============================================================================
// Security Agent — Production Security Review (structured output)
// ============================================================================

export const SECURITY_REVIEW_ARTIFACT = {
    type: "SecurityReview" as const,
    title: "Security Review: Production Deployment",
    threatModel: [
        {
            threat: "Unauthorized deployment access",
            attackVector: "Compromised CI/CD credentials allowing malicious code deployment",
            impact: "critical" as const,
            likelihood: "low" as const,
        },
        {
            threat: "Supply chain attack via dependencies",
            attackVector: "Malicious package injected during npm install in CI pipeline",
            impact: "critical" as const,
            likelihood: "medium" as const,
        },
        {
            threat: "Data exposure during migration",
            attackVector: "Database migration leaking PII in logs or temporary tables",
            impact: "high" as const,
            likelihood: "low" as const,
        },
    ],
    vulnerabilities: [
        {
            id: "VULN-001",
            description: "Health endpoint does not check downstream dependencies",
            severity: "medium" as const,
            recommendation: "Add deep health check that verifies database and cache connectivity",
        },
        {
            id: "VULN-002",
            description: "No integrity check on deployed artifacts",
            severity: "high" as const,
            recommendation: "Sign deployment artifacts and verify checksums before activation",
        },
    ],
    requirements: [
        "Enable TLS 1.3 for all production traffic",
        "Rotate deployment credentials after each release",
        "Lock npm dependencies with package-lock.json checksums",
        "Enable audit logging for all deployment actions",
    ],
    complianceNotes: [
        "SOC 2 Type II: Deployment must have approval trail",
        "ISO 27001: Change management process required for production changes",
    ],
};

// ============================================================================
// Expected Workflow Results
// ============================================================================

export const EXPECTED_CONTRIBUTORS = ["SRE", "Security"];
export const EXPECTED_AGENT_COUNT = 2;
export const EXPECTED_ROUTER_CALLS = 3;

export const USER_MESSAGE = "Deploy the current build to production. We're on v1.3.0 and everything has passed CI.";
