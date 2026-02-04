
/**
 * MCP Verification Script
 * Run this to check if your environment is ready for Cursor/MCP
 */
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Check Directory
const cwd = process.cwd();
console.log(`📂 Current Directory: ${cwd}`);

// 2. Load Env
const envPath = path.resolve(cwd, '.env');
if (fs.existsSync(envPath)) {
    console.log(`✅ Found .env at ${envPath}`);
    config({ path: envPath });
} else {
    console.log(`❌ No .env found at ${envPath}`);
}

// 3. Check Variables
const hasKey = !!process.env.OPENAI_API_KEY;
console.log(hasKey ? `✅ OPENAI_API_KEY is Present` : `❌ OPENAI_API_KEY is MISSING`);

// 4. Check Node Version
console.log(`🟢 Node Version: ${process.version}`);
console.log(`🟢 Exec Path: ${process.execPath}`);

if (!hasKey) {
    console.error("\n❌ FATAL: Cannot run MCP server without OPENAI_API_KEY.");
    process.exit(1);
}

console.log("\n✅ Environment looks good! You can use this command in Cursor:");
console.log(`\n${process.execPath} --import tsx/esm ${path.resolve(cwd, 'src/mcp-server.ts')}\n`);
