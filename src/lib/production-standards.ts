/**
 * Production Code Standards
 * 
 * Injected into all agents to ensure production-ready code generation.
 * These are non-negotiable standards for all generated code.
 */

// ============================================================================
// PRODUCTION STANDARDS
// ============================================================================

export const PRODUCTION_CODE_STANDARDS = `
## 🚨 PRODUCTION CODE REQUIREMENTS (Non-Negotiable)

You are building PRODUCTION-READY code, not prototypes. Every line of code must be:

### 1. Error Resilient
- EVERY async call wrapped in try/catch with proper error handling
- User-friendly error messages (never expose stack traces)
- Graceful degradation when services fail
- Retry logic for transient failures

### 2. Type Safe
- NO 'any' types - use proper TypeScript generics
- Strict null checks - handle undefined cases
- Validate all external inputs with Zod or similar
- Define explicit return types

### 3. Accessible (WCAG 2.1 AA)
- Semantic HTML (proper heading hierarchy, landmarks)
- ARIA labels on interactive elements
- Keyboard navigable (focus management)
- Color contrast ≥ 4.5:1 for text
- Screen reader compatible

### 4. Performant
- Lazy load non-critical components
- Optimize images (WebP, proper sizing)
- Bundle size budget: < 200KB initial JS
- No memory leaks (clean up effects/subscriptions)
- Use React.memo/useMemo for expensive computations

### 5. Secure
- Validate and sanitize ALL user inputs
- Use parameterized queries (no SQL injection)
- Implement CSRF protection
- Set secure HTTP headers (CSP, X-Frame-Options)
- Never log sensitive data (passwords, tokens, PII)

### 6. Tested
- Unit tests for business logic (≥80% coverage)
- Integration tests for API endpoints
- E2E tests for critical user flows
- Edge case coverage (empty states, errors)

### 7. Observable
- Structured logging with correlation IDs
- Error tracking (Sentry, LogRocket, etc.)
- Performance monitoring
- Health check endpoints

### 8. Maintainable
- Self-documenting code (clear names, no magic numbers)
- JSDoc for public APIs
- README for setup/deployment
- Changelog for breaking changes
`;

// ============================================================================
// AGENT-SPECIFIC STANDARDS
// ============================================================================

export const BUILDER_PRODUCTION_STANDARDS = `
${PRODUCTION_CODE_STANDARDS}

## Builder-Specific Requirements

### Code Structure
- Follow existing project patterns (don't introduce new conventions)
- Keep files under 300 lines (split if larger)
- One component per file
- Co-locate tests with components

### Dependencies
- Prefer built-in APIs over new dependencies
- If adding a dependency, justify the bundle size cost
- Check for security vulnerabilities before using

### Performance Checklist
Before completing any component:
- [ ] No console.logs in production code
- [ ] Loading states for async operations
- [ ] Error boundaries around risky components
- [ ] Virtualization for large lists
`;

export const DESIGNER_PRODUCTION_STANDARDS = `
${PRODUCTION_CODE_STANDARDS}

## Designer-Specific Requirements

### Visual Standards
- Mobile-first responsive design
- Touch targets ≥ 44x44px
- Loading skeletons (not spinners) for content
- Smooth transitions (150-300ms)

### Design System
- Use design tokens, not hardcoded values
- Support dark mode from day 1
- Test on real devices, not just Chrome DevTools
- Consider reduced motion preferences

### Accessibility First
- Design focus states before hover states
- Ensure color is not the only indicator
- Test with VoiceOver/NVDA
`;

export const REVIEWER_PRODUCTION_STANDARDS = `
${PRODUCTION_CODE_STANDARDS}

## Code Review Checklist

### Must Block (Critical)
- [ ] Security vulnerabilities
- [ ] Missing error handling
- [ ] Breaking accessibility
- [ ] Memory leaks
- [ ] Missing input validation

### Should Address (Important)
- [ ] Missing tests
- [ ] Poor performance
- [ ] Inconsistent patterns
- [ ] Missing TypeScript types

### Consider (Nice to Have)
- [ ] Code comments
- [ ] Variable naming
- [ ] File organization
`;

export const TESTER_PRODUCTION_STANDARDS = `
${PRODUCTION_CODE_STANDARDS}

## Testing Requirements

### Test Quality
- Tests should be deterministic (no flaky tests)
- Use meaningful assertions (not just "toExist")
- Test behavior, not implementation
- Mock external services, not internal modules

### Coverage Targets
- Business logic: ≥80%
- API endpoints: 100%
- Critical paths: E2E tests
- Edge cases: Explicit tests

### Test Structure
- Arrange-Act-Assert pattern
- One logical assertion per test
- Descriptive test names that explain intent
`;

// ============================================================================
// ROI MINDSET
// ============================================================================

export const ROI_MINDSET = `
## 💰 ROI-Focused Development

Every decision should consider:

### Build vs Buy
- Don't build what you can npm install (if maintained)
- Don't npm install what takes 10 lines to write
- Evaluate maintenance burden, not just initial effort

### Technical Debt
- No "TODOs" without linked tickets
- Fix broken windows immediately
- Refactor while context is fresh

### Scalability
- Would this survive 10,000 concurrent users?
- What happens when data grows 100x?
- How do we monitor this in production?

### Operational Cost
- Consider hosting costs (compute, bandwidth)
- Consider developer time to maintain
- Consider support burden (clear error messages reduce tickets)
`;

// ============================================================================
// COMBINED STANDARDS
// ============================================================================

export function getStandardsForAgent(agentName: string): string {
    switch (agentName) {
        case "Builder":
            return BUILDER_PRODUCTION_STANDARDS + "\n" + ROI_MINDSET;
        case "Designer":
            return DESIGNER_PRODUCTION_STANDARDS + "\n" + ROI_MINDSET;
        case "Reviewer":
            return REVIEWER_PRODUCTION_STANDARDS + "\n" + ROI_MINDSET;
        case "Tester":
            return TESTER_PRODUCTION_STANDARDS + "\n" + ROI_MINDSET;
        default:
            return PRODUCTION_CODE_STANDARDS + "\n" + ROI_MINDSET;
    }
}
