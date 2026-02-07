/**
 * Workflow Fixture: "Build a simple React app"
 *
 * Expected path: Router → Founder → Router → PM → Router → Planner → Router → Builder → Router → FINISH
 *
 * Provides sequential mock responses for each agent invocation.
 */

// ============================================================================
// Router Decisions (5 sequential calls)
// ============================================================================

export const ROUTER_DECISIONS = [
    { next: "Founder", reasoning: "New product idea — need Founder to validate the vision first" },
    { next: "ProductManager", reasoning: "Founder approved — PM needs to create a PRD with requirements" },
    { next: "Planner", reasoning: "PRD complete — Planner should create implementation architecture" },
    { next: "Builder", reasoning: "Technical plan ready — Builder should implement the React app" },
    { next: "FINISH", reasoning: "React app has been built — all requested work is complete" },
];

// ============================================================================
// Founder Response
// ============================================================================

export const FOUNDER_RESPONSE = {
    content: `**[Founder]**: Great idea — a simple React app is perfect for validating our component architecture.

## Strategic Assessment
- **Market Timing**: React is mature and well-supported — right time to build.
- **10x Thinking**: A clean component architecture will serve as the foundation for future features.
- **Resource Reality**: This is achievable in a single sprint.

**Verdict**: ✅ Proceed. Start with a clean Create React App setup, focus on component structure.`,
};

// ============================================================================
// ProductManager PRD (structured output)
// ============================================================================

export const PM_PRD_ARTIFACT = {
    type: "PRD" as const,
    title: "Simple React Application",
    goal: "Build a clean, well-structured React application with core components",
    successMetrics: [
        "App renders without errors",
        "Component architecture is modular and reusable",
        "All core pages are navigable",
    ],
    userStories: [
        {
            id: "US-001",
            title: "View Home Page",
            asA: "user",
            iWant: "to see a home page with navigation",
            soThat: "I can understand what the app offers",
            acceptanceCriteria: [
                "Home page renders with header, main content, and footer",
                "Navigation links are visible and functional",
            ],
            priority: "P0" as const,
        },
        {
            id: "US-002",
            title: "Navigate Between Pages",
            asA: "user",
            iWant: "to click navigation links to move between pages",
            soThat: "I can access different sections of the app",
            acceptanceCriteria: [
                "React Router handles client-side navigation",
                "Active page is highlighted in nav",
            ],
            priority: "P0" as const,
        },
    ],
    outOfScope: ["Backend API", "Authentication", "Database integration"],
    openQuestions: ["Should we use TypeScript or JavaScript?"],
};

// ============================================================================
// Planner TechPlan (structured output)
// ============================================================================

export const PLANNER_TECHPLAN_ARTIFACT = {
    type: "TechPlan" as const,
    title: "React App Architecture",
    overview: "A Vite-powered React app with TypeScript, React Router for navigation, and a modular component structure.",
    architecture: {
        components: [
            {
                name: "App Shell",
                responsibility: "Root layout with header, footer, and router outlet",
                interfaces: ["<App />", "<Layout />"],
            },
            {
                name: "Pages",
                responsibility: "Page-level components for each route",
                interfaces: ["<HomePage />", "<AboutPage />"],
            },
            {
                name: "UI Components",
                responsibility: "Reusable presentational components",
                interfaces: ["<Button />", "<Card />", "<Nav />"],
            },
        ],
        dataFlow: "React Router handles URL → Page mapping. Props flow down from pages to UI components.",
    },
    implementationSteps: [
        {
            order: 1,
            task: "Scaffold Vite + React + TypeScript project",
            files: ["package.json", "vite.config.ts", "tsconfig.json"],
            dependencies: [],
        },
        {
            order: 2,
            task: "Create App shell with React Router",
            files: ["src/App.tsx", "src/Layout.tsx"],
            dependencies: ["step-1"],
        },
        {
            order: 3,
            task: "Build page components",
            files: ["src/pages/Home.tsx", "src/pages/About.tsx"],
            dependencies: ["step-2"],
        },
        {
            order: 4,
            task: "Create reusable UI components",
            files: ["src/components/Button.tsx", "src/components/Card.tsx", "src/components/Nav.tsx"],
            dependencies: ["step-2"],
        },
    ],
    risks: [
        {
            risk: "Vite config issues with TypeScript paths",
            mitigation: "Use standard tsconfig paths and test early",
            severity: "low" as const,
        },
    ],
};

// ============================================================================
// Builder Response (tool calls)
// ============================================================================

export const BUILDER_TOOL_RESPONSE = {
    content: "I'll scaffold the React app and create the core components.",
    tool_calls: [
        {
            name: "write_file",
            args: { filePath: "src/App.tsx", content: "import React from 'react';\nexport default function App() { return <div>Hello React</div>; }" },
            id: "call_build_1",
        },
        {
            name: "write_file",
            args: { filePath: "src/components/Nav.tsx", content: "export function Nav() { return <nav>Navigation</nav>; }" },
            id: "call_build_2",
        },
        {
            name: "run_command",
            args: { command: "npm run build" },
            id: "call_build_3",
        },
    ],
};

// ============================================================================
// Expected Workflow Results
// ============================================================================

export const EXPECTED_CONTRIBUTORS = ["Founder", "ProductManager", "Planner", "Builder"];
export const EXPECTED_AGENT_COUNT = 4;
export const EXPECTED_ROUTER_CALLS = 5;

export const USER_MESSAGE = "Build me a simple React app with a home page and navigation";
