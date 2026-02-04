
/**
 * MCP Invocation Test
 * 
 * Simulates a client talking to the HIVE-R MCP server via JSON-RPC.
 * Verification Steps:
 * 1. Initialize
 * 2. List Tools
 * 3. Call 'consult_hive_swarm' with a simple ping
 */

import { spawn } from 'child_process';
import path from 'path';

const serverPath = path.resolve(process.cwd(), 'dist/mcp-server.js');
const serverProcess = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

console.log(`🚀 Spawning: node ${serverPath}`);

let buffer = '';

serverProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    console.log(`[SERVER]: ${chunk}`);
    buffer += chunk;

    // Try to parse messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep last incomplete line

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            handleMessage(msg);
        } catch (e) {
            console.error('Failed to parse:', line);
        }
    }
});

serverProcess.stderr.on('data', (data) => {
    console.error(`[STDERR]: ${data}`);
});

let step = 0;

function send(msg: any) {
    const str = JSON.stringify(msg) + '\n';
    console.log(`[CLIENT]: ${str.trim()}`);
    serverProcess.stdin.write(str);
}

function handleMessage(msg: any) {
    if (msg.id === 1) {
        console.log('✅ Initialization response received.');
        // Step 2: List tools
        send({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list"
        });
    } else if (msg.id === 2) {
        console.log('✅ Tools list received.');
        console.log(JSON.stringify(msg.result, null, 2));

        // Step 3: Consult swarm (short timeout test)
        console.log('🧪 Testing swarm invocation...');
        send({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
                name: "consult_hive_swarm",
                arguments: {
                    message: "Are you online? Reply with just 'Yes'."
                }
            }
        });
    } else if (msg.id === 3) {
        console.log('✅ Swarm response received!');
        console.log(JSON.stringify(msg.result, null, 2));
        process.exit(0);
    }
}

// Step 1: Initialize
send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" }
    }
});

// Timeout after 30s
setTimeout(() => {
    console.error('❌ Timeout waiting for response');
    serverProcess.kill();
    process.exit(1);
}, 30000);
