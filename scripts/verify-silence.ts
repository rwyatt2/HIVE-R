
/**
 * Strict Silence Test
 * 
 * Runs the MCP server start command and fails if ANY bytes are written to stdout
 * before the process receives input (we simulate a short wait).
 */
import { spawn } from 'child_process';
import path from 'path';

const mcpServerPath = path.resolve(process.cwd(), 'dist/mcp-server.js');
const nodePath = process.execPath;

console.error('🧪 Starting Strict Silence Test (PROD BUILD)...');
console.error(`Command: ${nodePath} ${mcpServerPath}`);

const child = spawn(nodePath, [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let stdoutData = '';
let stderrData = '';

child.stdout.on('data', (data) => {
    stdoutData += data.toString();
});

child.stderr.on('data', (data) => {
    stderrData += data.toString();
});

// Wait 2 seconds then check
setTimeout(() => {
    console.error('--- LOGS (STDERR) ---');
    console.error(stderrData);
    console.error('---------------------');

    if (stdoutData.length > 0) {
        console.error('❌ FAIL: Standard Output was NOT silent!');
        console.error('--- STDOUT CONTENT ---');
        console.error(stdoutData);
        console.error('----------------------');
        child.kill();
        process.exit(1);
    } else {
        console.error('✅ PASS: Standard Output is perfectly silent.');
        child.kill();
        process.exit(0);
    }
}, 2000);
