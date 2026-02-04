# HIVE-R Model Context Protocol (MCP) Server

Connect your HIVE-R Agent Swarm to **Cursor**, **Claude Code**, or other MCP-compatible tools.

## 🚀 Quick Setup

### 1. Prerequisites
- Ensure you have the HIVE-R project set up.
- Run `npm install` in the root directory.

### 2. Configure for Cursor

1. Open Cursor Settings (`Cmd + ,`)
2. Go to **Features** > **MCP Servers**
3. Click **+ Add New MCP Server**
4. Enter the following details:
   - **Name**: `hive-r`
   - **Type**: `command`
   - **Command**: `npm run mcp` (or full path: `/Users/mnstr/.nvm/versions/node/v20.x/bin/node /path/to/HIVE-R/src/mcp-server.ts` via `tsx`)

   **Recommended Command (Absolute Path):**
   ```bash
   /usr/local/bin/node /Users/mnstr/Desktop/HIVE-R/dist/mcp-server.js
   ```
   *(Adjust paths to match your Node.js and project location if needed. This uses the production build to ensure stability)*

### 3. Usage

Once connected, you can ask Cursor things like:

> "Consult the HIVE-R swarm to plan a new simplified login page."

Or explicitly use the tool:

> "Use `consult_hive_swarm` to analyze the project structure."

---

## 🛠️ CLI Usage

You can also run it directly in your terminal to verify it's working:

```bash
npm run mcp
```
*(This starts the server on stdio, so it will wait for JSON-RPC input. Use an MCP inspector to test interatively.)*

## 🤖 Available Tools

### `consult_hive_swarm`
- **Description**: Consults the full HIVE-R agent team (Founder -> PM -> Builder -> Reviewer).
- **Input**: `message` (string)
- **Output**: The final response from the swarm.
