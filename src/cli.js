#!/usr/bin/env node
import { parseArgs } from "util";
import { fetch } from "undici";
/**
 * HIVE-R Client
 * Simple CLI to interact with HIVE-R from any project
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
        },
        allowPositionals: true,
    });
    if (values.help) {
        console.log(`
🐝 HIVE-R CLI
Usage: hive [message]

Options:
  -s, --server <url>  HIVE-R server URL (default: http://localhost:3000)
  -h, --help         Show help

Examples:
  hive "Create a login component"
  hive "Analyze this project"
`);
        process.exit(0);
    }
    const message = positionals.join(" ");
    if (!message) {
        console.error("❌ Error: Please provide a message.");
        console.log('Try: hive "Create a hello world file"');
        process.exit(1);
    }
    const serverUrl = values.server;
    const cwd = process.cwd();
    // Inject context about the current working directory
    const fullMessage = `
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
    console.log(`🐝 Sending to HIVE-R...`);
    try {
        const response = await fetch(`${serverUrl}/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: fullMessage,
            }),
        });
        if (!response.ok) {
            console.error(`❌ Server error: ${response.status} ${response.statusText}`);
            process.exit(1);
        }
        if (!response.body) {
            console.error("❌ No response body");
            process.exit(1);
        }
        // Handle SSE stream
        const decoder = new TextDecoder();
        let buffer = "";
        // simple SSE parser
        for await (const chunk of response.body) {
            const text = decoder.decode(chunk, { stream: true });
            buffer += text;
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // keep incomplete line
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.type === "chunk") {
                            process.stdout.write(data.content);
                        }
                        else if (data.type === "agent") {
                            console.log(`\n\n🤖 [${data.agent}]\n`);
                        }
                        else if (data.type === "done") {
                            console.log("\n\n✅ Done");
                            process.exit(0);
                        }
                    }
                    catch (e) {
                        // ignore parse errors
                    }
                }
            }
        }
    }
    catch (error) {
        console.error(`❌ Failed to connect to HIVE-R at ${serverUrl}`);
        console.error("Is the server running? Run 'npm run dev' in the HIVE-R directory.");
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map