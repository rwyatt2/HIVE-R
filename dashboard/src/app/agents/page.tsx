"use client";

import { useEffect, useState } from "react";

interface Agent {
    name: string;
    description: string;
    tools: string[];
}

const AGENTS: Agent[] = [
    { name: "Founder", description: "Strategic vision and direction", tools: [] },
    { name: "ProductManager", description: "PRDs and user stories", tools: [] },
    { name: "UXResearcher", description: "User research and insights", tools: ["web_search", "fetch_url"] },
    { name: "Designer", description: "Design specifications", tools: [] },
    { name: "Accessibility", description: "WCAG compliance", tools: [] },
    { name: "Planner", description: "Technical architecture", tools: [] },
    { name: "Security", description: "Security reviews", tools: [] },
    { name: "Builder", description: "Implementation", tools: ["read_file", "write_file", "list_directory"] },
    { name: "Reviewer", description: "Code review", tools: [] },
    { name: "Tester", description: "Test plans", tools: ["run_command", "run_tests"] },
    { name: "TechWriter", description: "Documentation", tools: [] },
    { name: "SRE", description: "Operations", tools: [] },
    { name: "DataAnalyst", description: "Analytics", tools: ["web_search", "fetch_url"] },
];

const HIVE_SERVER = process.env.NEXT_PUBLIC_HIVE_SERVER || "http://localhost:3000";

export default function AgentsPage() {
    const [activeAgents, setActiveAgents] = useState<string[]>([]);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch(`${HIVE_SERVER}/agents`);
                if (res.ok) {
                    const data = await res.json();
                    setActiveAgents(data.agents);
                }
            } catch {
                // ignore
            }
        };
        fetchAgents();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Agents</h1>
                <p className="text-zinc-400">Your HIVE-R team of specialists</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AGENTS.map((agent) => (
                    <div
                        key={agent.name}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-lg">
                                🤖
                            </div>
                            <div>
                                <h3 className="font-bold">{agent.name}</h3>
                                <div
                                    className={`text-xs ${activeAgents.includes(agent.name)
                                            ? "text-green-400"
                                            : "text-zinc-500"
                                        }`}
                                >
                                    {activeAgents.includes(agent.name) ? "● Active" : "○ Ready"}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">{agent.description}</p>
                        {agent.tools.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {agent.tools.map((tool) => (
                                    <span
                                        key={tool}
                                        className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                                    >
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
