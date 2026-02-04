# 🐝 How to Use HIVE-R Agents in a New Project

This guide explains how to leverage your HIVE-R Agent Swarm (Founder, PM, Builder) to build software in a completely new, empty project using **Cursor** or **Claude Desktop**.

---

## 🟢 Prerequisites

1.  **HIVE-R Installed**: You must have the HIVE-R repository on your machine.
    - Path: `/Users/mnstr/Desktop/HIVE-R`
2.  **Node.js**: Installed on your system.

---

## 1. Setup in Cursor (Recommended)

Cursor is the best way to use HIVE-R because it allows the agents to see your active files.

### Step A: Get the Command
Copy this command (this is the absolute path to your HIVE-R brain):

```bash
/usr/local/bin/node --import tsx/esm /Users/mnstr/Desktop/HIVE-R/src/mcp-server.ts
```

> **Note**: If `/usr/local/bin/node` is not your node path, run `which node` in your terminal and replace it. Alternatively, you can use:
> `npx -y tsx /Users/mnstr/Desktop/HIVE-R/src/mcp-server.ts`

### Step B: Configure Cursor
1.  Open **Cursor**.
2.  Open **Cursor Settings** (Cmd + Shift + J, or accessible via the gear icon > Settings).
3.  Navigate to **Features** > **MCP Servers**.
4.  Click **+ Add New MCP Server**.
5.  Fill in the details:
    - **Name**: `hive-swarm`
    - **Type**: `command`
    - **Command**: *(Paste the command from Step A)*
6.  Click **Add**. You should see a green connection status.

### Step C: Create a New Project
1.  Create a new folder: `mkdir my-new-startup`.
2.  Open it in Cursor: `code my-new-startup`.
3.  Open the **Composer** (Cmd + I) or the **AI Pane** (Cmd + L).

---

## 2. Setup in Claude Desktop

1.  Open your Claude Desktop config file:
    - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
2.  Add the `hive-swarm` to the `mcpServers` object:

```json
{
  "mcpServers": {
    "hive-swarm": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/mnstr/Desktop/HIVE-R/src/mcp-server.ts"
      ]
    }
  }
}
```
3.  Restart Claude Desktop. The 🔌 icon should appear.

---

## 3. Making Your First Prompt

Now that you are connected, you can "summon" the swarm.

### Example: The "Founder" Kickoff
In your new blank project, open the AI Chat and type:

> "I want to start a new project. Use the `consult_hive_swarm` tool.
>
> **My Idea**: A dashboard for tracking personal carbon footprints.
>
> Please act as the **Founder** and **Product Manager** to write a PRD and then have the **Builder** scaffolding the initial React app in this directory."

### Example: The "Refactor" Request
If you have an existing file open:

> "Consult the swarm. I want the **Security** agent to review this `auth.ts` file for vulnerabilities and then have the **Builder** fix them."

---

## 💡 How It Works
1.  **You** send a prompt in Cursor.
2.  **Cursor** sends it to `src/mcp-server.ts`.
3.  **HIVE-R** spins up the graph (router -> agents).
4.  **Agents** execute logic, using tools to write files *in your current project* (because they inherit the CWD from Cursor).
5.  **Response** is sent back to Cursor.

Enjoy your AI workforce! 🐝
