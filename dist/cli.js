#!/usr/bin/env node
import { parseArgs } from "util";
import { fetch } from "undici";
import * as readline from "readline";
/**
 * HIVE-R Client
 * Interactive CLI to interact with HIVE-R from any project
 */
async function main() {
    const { values, positionals } = parseArgs({
        args: process.argv.slice(2),
        options: {
            server: {
                type: "string",
                short: "s",
                default: "http://localhost:3000",
            },
            help: {
                type: "boolean",
                short: "h",
            },
            interactive: {
                type: "boolean",
                short: "i",
            }
        },
        allowPositionals: true,
    });
    if (values.help) {
        console.log(`
🐝 HIVE-R CLI
Usage: hive [message] [options]

Options:
  -s, --server <url>  HIVE-R server URL (default: http://localhost:3000)
  -i, --interactive   Start interactive chat mode
  -h, --help         Show help

Examples:
  hive "Create a login component"
  hive -i
`);
        process.exit(0);
    }
    const serverUrl = values.server;
    const cwd = process.cwd();
    // If no message provided, default to interactive mode
    if (positionals.length === 0 || values.interactive) {
        await startInteractiveMode(serverUrl, cwd);
    }
    else {
        const message = positionals.join(" ");
        await runOneShot(serverUrl, cwd, message);
    }
}
async function runOneShot(serverUrl, cwd, message) {
    const fullMessage = buildContextMessage(cwd, message);
    console.log(`🐝 Sending to HIVE-R...`);
    await streamResponse(serverUrl, fullMessage);
}
async function startInteractiveMode(serverUrl, cwd) {
    console.log(`
🐝 HIVE-R Interactive Mode
📂 Context: ${cwd}
type 'exit' or 'quit' to leave
`);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'hive> '
    });
    let threadId;
    rl.prompt();
    for await (const line of rl) {
        const input = line.trim();
        if (input === 'exit' || input === 'quit') {
            console.log('Bye! 👋');
            process.exit(0);
        }
        if (!input) {
            rl.prompt();
            continue;
        }
        const fullMessage = buildContextMessage(cwd, input);
        // Pass threadId if we have one to maintain conversation
        threadId = await streamResponse(serverUrl, fullMessage, threadId);
        console.log(); // New line
        rl.prompt();
    }
}
function buildContextMessage(cwd, message) {
    return `
[CONTEXT]
Working Directory: ${cwd}
User Operating System: ${process.platform}

Instruction:
${message}

IMPORTANT:
- When using file tools, ALWAYS use the absolute path provided in Working Directory.
- If you need to run commands, pass 'cwd': '${cwd}' to the run_command tool.
- Do not make assumptions about the file structure, use list_directory first if needed.
`.trim();
}
/**
 * Stream response from server
 * Returns the threadId for continuity
 */
async function streamResponse(serverUrl, message, threadId) {
    try {
        const response = await fetch(`${serverUrl}/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                threadId // Pass if exists
            }),
        });
        if (!response.ok) {
            console.error(`❌ Server error: ${response.status} ${response.statusText}`);
            return threadId;
        }
        if (!response.body) {
            console.error("❌ No response body");
            return threadId;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let currentThreadId = threadId;
        for await (const chunk of response.body) {
            const text = decoder.decode(chunk, { stream: true });
            buffer += text;
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.type === "thread") {
                            currentThreadId = data.threadId;
                        }
                        else if (data.type === "chunk") {
                            process.stdout.write(data.content);
                        }
                        else if (data.type === "agent") {
                            process.stdout.write(`\n\n🤖 [${data.agent}]\n`);
                        }
                        else if (data.type === "done") {
                            // Done
                        }
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
        }
        return currentThreadId;
    }
    catch (error) {
        console.error(`❌ Failed to connect to HIVE-R at ${serverUrl}`);
        console.error("Is the server running? Run 'npm run dev' in the HIVE-R directory.");
        return threadId;
    }
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map