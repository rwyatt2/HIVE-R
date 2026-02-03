/**
 * Code Validation Tools
 *
 * Tools for agents to validate code quality, security, and performance.
 */
import { z } from "zod";
export declare const eslintValidateTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
}, {
    filePath: string;
}, string, "eslint_validate">;
export declare const typescriptCheckTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
}, {
    filePath: string;
}, string, "typescript_check">;
export declare const securityScanTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>, {
    code: string;
}, {
    code: string;
}, string, "security_scan">;
export declare const accessibilityCheckTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>, {
    code: string;
}, {
    code: string;
}, string, "accessibility_check">;
export declare const bundleSizeEstimateTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    dependencies: z.ZodArray<z.ZodString>;
}, z.core.$strip>, {
    dependencies: string[];
}, {
    dependencies: string[];
}, string, "bundle_size_estimate">;
export declare const validationTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
}, {
    filePath: string;
}, string, "eslint_validate"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
}, {
    filePath: string;
}, string, "typescript_check"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>, {
    code: string;
}, {
    code: string;
}, string, "security_scan"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>, {
    code: string;
}, {
    code: string;
}, string, "accessibility_check"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    dependencies: z.ZodArray<z.ZodString>;
}, z.core.$strip>, {
    dependencies: string[];
}, {
    dependencies: string[];
}, string, "bundle_size_estimate">)[];
//# sourceMappingURL=code-validator.d.ts.map