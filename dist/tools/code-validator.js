/**
 * Code Validation Tools
 *
 * Tools for agents to validate code quality, security, and performance.
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
const execAsync = promisify(exec);
const WORKSPACE = process.env.HIVE_WORKSPACE || process.cwd();
// ============================================================================
// ESLINT VALIDATION
// ============================================================================
export const eslintValidateTool = tool(async ({ filePath }) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(WORKSPACE, filePath);
    try {
        // Check if file exists
        await fs.access(fullPath);
        // Run ESLint
        const { stdout, stderr } = await execAsync(`npx eslint "${fullPath}" --format json 2>/dev/null || true`, { cwd: WORKSPACE });
        if (!stdout.trim()) {
            return "✅ ESLint: No issues found";
        }
        try {
            const results = JSON.parse(stdout);
            const issues = results[0]?.messages || [];
            if (issues.length === 0) {
                return "✅ ESLint: No issues found";
            }
            const formatted = issues.map((msg) => {
                const severity = msg.severity === 2 ? "❌ ERROR" : "⚠️ WARN";
                return `${severity} [L${msg.line}]: ${msg.message} (${msg.ruleId})`;
            }).join("\n");
            return `ESLint Results:\n${formatted}`;
        }
        catch {
            return `ESLint output: ${stdout}`;
        }
    }
    catch (error) {
        return `Error running ESLint: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "eslint_validate",
    description: "Run ESLint on a file to check for code quality issues",
    schema: z.object({
        filePath: z.string().describe("Path to the file to validate"),
    }),
});
// ============================================================================
// TYPESCRIPT TYPE CHECK
// ============================================================================
export const typescriptCheckTool = tool(async ({ filePath }) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(WORKSPACE, filePath);
    try {
        const { stdout, stderr } = await execAsync(`npx tsc --noEmit --skipLibCheck "${fullPath}" 2>&1 || true`, { cwd: WORKSPACE });
        const output = stdout || stderr;
        if (!output.trim() || output.includes("error TS")) {
            const errors = output.split("\n").filter(l => l.includes("error TS"));
            if (errors.length === 0) {
                return "✅ TypeScript: No type errors";
            }
            return `TypeScript Errors:\n${errors.join("\n")}`;
        }
        return "✅ TypeScript: No type errors";
    }
    catch (error) {
        return `Error running TypeScript check: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "typescript_check",
    description: "Run TypeScript type checking on a file",
    schema: z.object({
        filePath: z.string().describe("Path to the TypeScript file to check"),
    }),
});
// ============================================================================
// SECURITY SCAN
// ============================================================================
export const securityScanTool = tool(async ({ code }) => {
    const issues = [];
    // Check for common security issues
    const securityPatterns = [
        { pattern: /eval\s*\(/g, issue: "❌ CRITICAL: eval() is dangerous, use alternatives" },
        { pattern: /innerHTML\s*=/g, issue: "⚠️ HIGH: innerHTML can lead to XSS, use textContent or sanitize" },
        { pattern: /dangerouslySetInnerHTML/g, issue: "⚠️ HIGH: dangerouslySetInnerHTML requires careful sanitization" },
        { pattern: /document\.write/g, issue: "⚠️ HIGH: document.write is unsafe and blocks parsing" },
        { pattern: /localStorage\.setItem\([^)]*password/gi, issue: "❌ CRITICAL: Never store passwords in localStorage" },
        { pattern: /localStorage\.setItem\([^)]*token/gi, issue: "⚠️ MEDIUM: Consider httpOnly cookies for tokens" },
        { pattern: /console\.(log|warn|error|debug)/g, issue: "⚠️ LOW: Remove console statements in production" },
        { pattern: /['"]password['"]\s*:\s*['"][^'"]+['"]/gi, issue: "❌ CRITICAL: Hardcoded password detected" },
        { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, issue: "❌ CRITICAL: Hardcoded API key detected" },
        { pattern: /\bexec\s*\(/g, issue: "⚠️ HIGH: exec() can lead to command injection" },
        { pattern: /\$\{.*\}.*sql/gi, issue: "⚠️ HIGH: Potential SQL injection, use parameterized queries" },
        { pattern: /new\s+Function\s*\(/g, issue: "❌ CRITICAL: new Function() is similar to eval()" },
    ];
    for (const { pattern, issue } of securityPatterns) {
        const matches = code.match(pattern);
        if (matches) {
            issues.push(`${issue} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
        }
    }
    if (issues.length === 0) {
        return "✅ Security Scan: No obvious vulnerabilities detected";
    }
    return `Security Scan Results:\n${issues.join("\n")}`;
}, {
    name: "security_scan",
    description: "Scan code for common security vulnerabilities",
    schema: z.object({
        code: z.string().describe("The code to scan for security issues"),
    }),
});
// ============================================================================
// ACCESSIBILITY CHECK
// ============================================================================
export const accessibilityCheckTool = tool(async ({ code }) => {
    const issues = [];
    // Check for common accessibility issues in HTML/JSX
    const a11yPatterns = [
        { pattern: /<img[^>]*(?!alt=)[^>]*>/g, issue: "❌ Images must have alt attributes" },
        { pattern: /<input[^>]*(?!aria-label|aria-labelledby|id)[^>]*>/g, issue: "⚠️ Inputs should have labels" },
        { pattern: /<button[^>]*>\s*<\/button>/g, issue: "❌ Empty buttons are not accessible" },
        { pattern: /onClick\s*=\s*{[^}]*}\s*(?!.*onKeyDown)/g, issue: "⚠️ onClick should have keyboard equivalent" },
        { pattern: /<div[^>]*onClick/g, issue: "⚠️ Use <button> instead of clickable <div>" },
        { pattern: /tabIndex\s*=\s*{?\s*-?\d{2,}/g, issue: "⚠️ Avoid tabIndex > 0, use 0 or -1" },
        { pattern: /color:\s*#[a-fA-F0-9]{3,6}/g, issue: "ℹ️ Verify color contrast meets WCAG AA (4.5:1)" },
        { pattern: /<a[^>]*href\s*=\s*['"]#['"]/g, issue: "⚠️ Anchor with href='#' should be a button" },
    ];
    for (const { pattern, issue } of a11yPatterns) {
        const matches = code.match(pattern);
        if (matches) {
            issues.push(issue);
        }
    }
    // Check for heading hierarchy
    const headings = code.match(/<h[1-6]/g) || [];
    if (headings.length > 0) {
        const levels = headings.map(h => parseInt(h.charAt(2)));
        for (let i = 1; i < levels.length; i++) {
            if (levels[i] - levels[i - 1] > 1) {
                issues.push(`⚠️ Heading skip detected: h${levels[i - 1]} to h${levels[i]}`);
            }
        }
    }
    if (issues.length === 0) {
        return "✅ Accessibility Check: No obvious issues detected";
    }
    return `Accessibility Check Results:\n${issues.join("\n")}`;
}, {
    name: "accessibility_check",
    description: "Check code for common accessibility issues (WCAG)",
    schema: z.object({
        code: z.string().describe("The HTML/JSX code to check for accessibility"),
    }),
});
// ============================================================================
// BUNDLE SIZE ESTIMATE
// ============================================================================
export const bundleSizeEstimateTool = tool(async ({ dependencies }) => {
    const estimates = [];
    let totalSize = 0;
    // Known package sizes (approximate gzipped sizes in KB)
    const packageSizes = {
        "react": 6,
        "react-dom": 40,
        "lodash": 70,
        "moment": 67,
        "axios": 13,
        "date-fns": 20,
        "zod": 12,
        "framer-motion": 55,
        "tailwindcss": 0, // CSS only
        "@tanstack/react-query": 13,
        "zustand": 3,
        "jotai": 4,
        "swr": 10,
    };
    for (const dep of dependencies) {
        const size = packageSizes[dep.toLowerCase()];
        if (size !== undefined) {
            estimates.push(`${dep}: ~${size}KB gzipped`);
            totalSize += size;
        }
        else {
            estimates.push(`${dep}: size unknown (check bundlephobia.com)`);
        }
    }
    const budget = 200; // KB
    const status = totalSize <= budget ? "✅" : "⚠️";
    return `Bundle Size Estimate:\n${estimates.join("\n")}\n\n${status} Total: ~${totalSize}KB (budget: ${budget}KB)`;
}, {
    name: "bundle_size_estimate",
    description: "Estimate bundle size impact of dependencies",
    schema: z.object({
        dependencies: z.array(z.string()).describe("List of npm package names"),
    }),
});
// Export all validation tools
export const validationTools = [
    eslintValidateTool,
    typescriptCheckTool,
    securityScanTool,
    accessibilityCheckTool,
    bundleSizeEstimateTool,
];
//# sourceMappingURL=code-validator.js.map