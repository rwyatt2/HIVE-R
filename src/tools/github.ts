/**
 * GitHub Integration Tools
 * 
 * Enables agents to create branches, commit/push code, and open PRs.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../lib/logger.js";

const execAsync = promisify(exec);

// ============================================================================
// CONFIG
// ============================================================================

interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
    defaultBase: string;
}

function getGitHubConfig(): GitHubConfig {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const defaultBase = process.env.GITHUB_DEFAULT_BASE || "main";

    if (!token || !owner || !repo) {
        throw new Error("GitHub config missing. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO in .env");
    }

    return { token, owner, repo, defaultBase };
}

function getWorkingDir(): string {
    return process.env.HIVE_WORKSPACE || process.cwd();
}

// ============================================================================
// GIT CLI TOOLS
// ============================================================================

/**
 * Create and checkout a new git branch
 */
export const createBranchTool = tool(
    async ({ branchName, fromBranch }) => {
        const cwd = getWorkingDir();

        try {
            // Fetch latest
            await execAsync(`git fetch origin`, { cwd });

            // Checkout base branch first if specified
            if (fromBranch) {
                await execAsync(`git checkout ${fromBranch}`, { cwd });
                await execAsync(`git pull origin ${fromBranch}`, { cwd });
            }

            // Create new branch
            await execAsync(`git checkout -b ${branchName}`, { cwd });

            logger.info(`🌿 Created branch: ${branchName}`);
            return JSON.stringify({ success: true, branch: branchName });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to create branch: ${msg}`);
            return JSON.stringify({ success: false, error: msg });
        }
    },
    {
        name: "create_git_branch",
        description: "Create a new git branch and switch to it",
        schema: z.object({
            branchName: z.string().describe("Name of the new branch (e.g., 'feat/login')"),
            fromBranch: z.string().optional().describe("Base branch to branch from (default: current branch)"),
        }),
    }
);

/**
 * Stage, commit, and push changes
 */
export const commitAndPushTool = tool(
    async ({ message, branchName, files }) => {
        const cwd = getWorkingDir();

        try {
            // Stage files
            const filesToStage = files?.length ? files.join(" ") : ".";
            await execAsync(`git add ${filesToStage}`, { cwd });

            // Commit
            await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd });

            // Get current branch if not specified
            let branch = branchName;
            if (!branch) {
                const { stdout } = await execAsync(`git rev-parse --abbrev-ref HEAD`, { cwd });
                branch = stdout.trim();
            }

            // Push
            await execAsync(`git push -u origin ${branch}`, { cwd });

            logger.info(`📤 Pushed to ${branch}: ${message}`);
            return JSON.stringify({ success: true, branch, message });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to commit/push: ${msg}`);
            return JSON.stringify({ success: false, error: msg });
        }
    },
    {
        name: "commit_and_push",
        description: "Stage changes, commit with a message, and push to origin",
        schema: z.object({
            message: z.string().describe("Commit message"),
            branchName: z.string().optional().describe("Branch to push to (default: current branch)"),
            files: z.array(z.string()).optional().describe("Specific files to stage (default: all changes)"),
        }),
    }
);

/**
 * Get current git status
 */
export const gitStatusTool = tool(
    async () => {
        const cwd = getWorkingDir();

        try {
            const { stdout: status } = await execAsync(`git status --short`, { cwd });
            const { stdout: branch } = await execAsync(`git rev-parse --abbrev-ref HEAD`, { cwd });

            return JSON.stringify({
                branch: branch.trim(),
                changes: status.trim().split("\n").filter(Boolean),
                hasChanges: status.trim().length > 0,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: msg });
        }
    },
    {
        name: "git_status",
        description: "Get current git status (branch, uncommitted changes)",
        schema: z.object({}),
    }
);

// ============================================================================
// GITHUB API TOOLS
// ============================================================================

/**
 * Create a Pull Request via GitHub API
 */
export const createPullRequestTool = tool(
    async ({ title, body, head, base }) => {
        const config = getGitHubConfig();
        const baseBranch = base || config.defaultBase;

        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/pulls`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.token}`,
                    "Accept": "application/vnd.github+json",
                    "Content-Type": "application/json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                body: JSON.stringify({
                    title,
                    body: body || "",
                    head,
                    base: baseBranch,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`GitHub API error: ${response.status} - ${error}`);
            }

            const pr = await response.json() as { number: number; html_url: string };

            logger.info(`🎉 Created PR #${pr.number}: ${pr.html_url}`);
            return JSON.stringify({
                success: true,
                prNumber: pr.number,
                url: pr.html_url,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to create PR: ${msg}`);
            return JSON.stringify({ success: false, error: msg });
        }
    },
    {
        name: "create_pull_request",
        description: "Create a Pull Request on GitHub",
        schema: z.object({
            title: z.string().describe("PR title"),
            body: z.string().optional().describe("PR description (markdown)"),
            head: z.string().describe("Branch with changes (e.g., 'feat/login')"),
            base: z.string().optional().describe("Target branch (default: 'main')"),
        }),
    }
);

/**
 * Get open Pull Requests
 */
export const listPullRequestsTool = tool(
    async ({ state }) => {
        const config = getGitHubConfig();
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/pulls?state=${state || "open"}`;

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${config.token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const prs = await response.json() as Array<{
                number: number;
                title: string;
                html_url: string;
                user: { login: string };
                head: { ref: string };
            }>;

            return JSON.stringify({
                count: prs.length,
                pullRequests: prs.map(pr => ({
                    number: pr.number,
                    title: pr.title,
                    url: pr.html_url,
                    author: pr.user.login,
                    branch: pr.head.ref,
                })),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: msg });
        }
    },
    {
        name: "list_pull_requests",
        description: "List Pull Requests on the repository",
        schema: z.object({
            state: z.enum(["open", "closed", "all"]).optional().describe("Filter by state (default: open)"),
        }),
    }
);

// ============================================================================
// EXPORTS
// ============================================================================

export const githubTools = [
    createBranchTool,
    commitAndPushTool,
    gitStatusTool,
    createPullRequestTool,
    listPullRequestsTool,
];
