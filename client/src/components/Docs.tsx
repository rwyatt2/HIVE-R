/**
 * Getting Started Documentation Component
 */

import './Docs.css';

interface DocsProps {
    onClose: () => void;
}

export function Docs({ onClose }: DocsProps) {
    return (
        <div className="docs-overlay">
            <div className="docs-panel">
                <div className="docs-header">
                    <h1>📚 Getting Started with HIVE-R</h1>
                    <button className="docs-close" onClick={onClose}>×</button>
                </div>
                <div className="docs-content">
                    <section>
                        <h2>Overview</h2>
                        <p>HIVE-R is an AI-powered development team with 13 specialized agents that can help build features for your project. Here's how to set it up in Cursor and use it for another project.</p>
                    </section>

                    <section>
                        <h2>Part 1: Initial Setup in Cursor</h2>

                        <h3>1. Clone the Repository</h3>
                        <pre><code>{`# Open Cursor terminal (Ctrl/Cmd + \`)
git clone https://github.com/rwyatt2/HIVE-R.git
cd HIVE-R`}</code></pre>

                        <h3>2. Install Dependencies</h3>
                        <pre><code>npm install</code></pre>

                        <h3>3. Set Up Environment Variables</h3>
                        <p><strong>Create your .env file:</strong></p>
                        <pre><code>cp .env.example .env</code></pre>

                        <p><strong>Edit .env with your API keys:</strong></p>
                        <pre><code>{`# Required - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Optional but recommended
ANTHROPIC_API_KEY=sk-ant-...
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=hive-r

# GitHub Integration (for auto-PRs)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
GITHUB_DEFAULT_BASE=main

# Workspace (where HIVE-R will work)
HIVE_WORKSPACE=../your-project-name`}</code></pre>

                        <div className="docs-alert">
                            <strong>🔒 Security Note:</strong> Never commit .env to git - it's already in .gitignore
                        </div>
                    </section>

                    <section>
                        <h2>Part 2: Configure HIVE-R for Your Project</h2>

                        <h3>4. Set Your Project Workspace</h3>
                        <p>In your .env file, set where HIVE-R should work:</p>

                        <p><strong>Option A: Work on a separate project (recommended)</strong></p>
                        <pre><code>HIVE_WORKSPACE=../your-other-project</code></pre>

                        <p><strong>Option B: Work in a subdirectory</strong></p>
                        <pre><code>HIVE_WORKSPACE=./output</code></pre>

                        <h3>5. Start the Backend Server</h3>
                        <pre><code>npm run dev</code></pre>
                        <p>You should see:</p>
                        <pre><code>🐝 HIVE-R API running on http://localhost:3000</code></pre>
                    </section>

                    <section>
                        <h2>Part 3: Start the Visual Interface</h2>

                        <h3>6. Open a New Terminal in Cursor</h3>
                        <p>Keep the backend running and open a second terminal:</p>
                        <pre><code>{`# In Cursor: Terminal → New Terminal
cd client
npm install
npm run dev`}</code></pre>

                        <h3>7. Access HIVE-R Studio</h3>
                        <p>Open your browser to:</p>
                        <pre><code>http://localhost:5173</code></pre>
                        <p>You'll see the HIVE-R Studio dashboard with:</p>
                        <ul>
                            <li>Chat interface to talk to agents</li>
                            <li>Agent activity monitor</li>
                            <li>Conversation history</li>
                            <li>Real-time updates</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Part 4: Using HIVE-R on Your Project</h2>

                        <h3>8. Start a Conversation</h3>
                        <p>In the HIVE-R Studio interface, you can request features like:</p>

                        <p><strong>Example requests:</strong></p>
                        <pre><code>{`"Build a login page with email/password authentication"

"Create a REST API endpoint for user registration with validation"

"Add a dashboard component with charts showing sales data"

"Set up a PostgreSQL database schema for an e-commerce store"

"Write tests for the authentication module"`}</code></pre>

                        <h3>9. How Agents Work Together</h3>
                        <p>The system will automatically route your request through specialized agents:</p>
                        <ol>
                            <li><strong>Product Manager</strong> - Defines requirements</li>
                            <li><strong>UX Designer</strong> - Creates user experience</li>
                            <li><strong>Frontend Engineer</strong> - Builds UI components</li>
                            <li><strong>Backend Engineer</strong> - Creates APIs and logic</li>
                            <li><strong>Database Architect</strong> - Designs schemas</li>
                            <li><strong>QA Engineer</strong> - Tests everything</li>
                            <li><strong>DevOps/SRE</strong> - Handles deployment</li>
                        </ol>

                        <h3>10. Files Are Created in Your Workspace</h3>
                        <p>All generated code appears in the HIVE_WORKSPACE directory you configured:</p>
                        <pre><code>{`your-project/
├── src/
│   ├── components/   # UI components
│   ├── api/          # Backend endpoints
│   ├── lib/          # Utilities
│   └── tests/        # Test files
└── ...`}</code></pre>
                    </section>

                    <section>
                        <h2>Part 5: Advanced Features</h2>

                        <h3>11. GitHub Integration (Auto-PRs)</h3>
                        <p>To have agents automatically create pull requests:</p>

                        <p><strong>Get a GitHub token:</strong></p>
                        <ol>
                            <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                            <li>Generate new token with <code>repo</code> scope</li>
                            <li>Add to your .env:</li>
                        </ol>
                        <pre><code>{`GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=your-project-name`}</code></pre>

                        <p><strong>Usage:</strong></p>
                        <pre><code>"Ship the login feature as a PR"</code></pre>

                        <p>The SRE agent will:</p>
                        <ul>
                            <li>Create a feature branch</li>
                            <li>Commit changes</li>
                            <li>Push to GitHub</li>
                            <li>Open a pull request</li>
                        </ul>

                        <h3>12. Using the Design System</h3>
                        <p>HIVE-R includes a built-in design system. Agents automatically use these tokens when generating UI:</p>
                        <p>Export for your framework:</p>
                        <pre><code>{`# For Tailwind
cp design-system-export/tailwind.config.js ../your-project/

# For CSS variables
cp design-system-export/variables.css ../your-project/src/`}</code></pre>

                        <h3>13. Custom Agents (Plugins)</h3>
                        <p>You can add specialized agents for your project:</p>
                        <p><strong>Create plugins/my-agent.js:</strong></p>
                        <pre><code>{`export default {
  name: "SpecialistAgent",
  description: "Handles specific domain logic for my project",
  systemPrompt: "You are an expert in...",
  capabilities: ["domain-specific-task"],
  
  async execute({ state, llm }) {
    // Your custom logic
    return {
      content: "Result...",
      next: "Router"
    };
  }
};`}</code></pre>
                        <p>The router will automatically detect and route to your agent.</p>
                    </section>

                    <section>
                        <h2>Part 6: Alternative Usage Methods</h2>

                        <h3>14. API-Only Usage (No UI)</h3>
                        <p>If you prefer using curl or integrating with your own tools:</p>
                        <pre><code>{`# Start just the backend
npm run dev

# Make requests via curl
curl -X POST http://localhost:3000/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Build a login component",
    "threadId": "my-project-123"
  }'`}</code></pre>

                        <h3>15. VS Code/Cursor Integration</h3>
                        <p><strong>Use Cursor's AI chat with HIVE-R running:</strong></p>
                        <ol>
                            <li>Keep HIVE-R backend running</li>
                            <li>In Cursor, use Cmd+K or Cmd+L</li>
                            <li>Reference HIVE-R's output: "Review the code HIVE-R generated in ./output"</li>
                            <li>Iterate with both systems</li>
                        </ol>
                    </section>

                    <section>
                        <h2>Part 7: Best Practices</h2>

                        <h3>16. Effective Prompting</h3>
                        <p><strong>Be specific:</strong></p>
                        <div className="docs-comparison">
                            <div className="bad">❌ "Make a form"</div>
                            <div className="good">✅ "Create a contact form with name, email, message fields, validation, and submission to /api/contact"</div>
                        </div>

                        <p><strong>Break down large features:</strong></p>
                        <pre><code>{`1. "Design the database schema for a blog"
2. "Create the blog post API endpoints"
3. "Build the blog post UI components"`}</code></pre>

                        <p><strong>Iterate:</strong></p>
                        <pre><code>{`"Add loading states to the login form"
"Update the login to use OAuth instead"`}</code></pre>

                        <h3>17. Managing Conversations</h3>
                        <p>Each conversation has a threadId that persists in the database:</p>
                        <pre><code>{`// Continue previous work
{
  "message": "Add error handling",
  "threadId": "feature-123"
}

// Start fresh
{
  "message": "Build a new feature",
  "threadId": "feature-124"
}`}</code></pre>
                    </section>

                    <section>
                        <h2>Part 8: Troubleshooting</h2>

                        <h3>Common Issues</h3>

                        <p><strong>Port already in use:</strong></p>
                        <pre><code>{`# Change in src/index.ts
const PORT = 3001; // or any available port`}</code></pre>

                        <p><strong>API key errors:</strong></p>
                        <ul>
                            <li>Verify keys in .env are correct</li>
                            <li>Restart the server after changing .env</li>
                        </ul>

                        <p><strong>Files not appearing:</strong></p>
                        <ul>
                            <li>Check HIVE_WORKSPACE path is correct</li>
                            <li>Ensure you have write permissions</li>
                        </ul>

                        <p><strong>Agents stuck in loop:</strong></p>
                        <ul>
                            <li>The system has built-in max iterations (20)</li>
                            <li>Check the terminal for error logs</li>
                            <li>Restart the conversation with a new threadId</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Part 9: Production Deployment</h2>

                        <h3>18. Deploy with Docker</h3>
                        <pre><code>{`# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f`}</code></pre>

                        <h3>19. Environment for Production</h3>
                        <pre><code>{`NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://... # For production DB`}</code></pre>
                    </section>

                    <section>
                        <h2>Quick Reference Commands</h2>
                        <pre><code>{`# Start development
npm run dev                    # Backend
cd client && npm run dev       # Frontend

# Build for production
npm run build

# Run tests
npm test

# View database
sqlite3 data/hive.db`}</code></pre>
                    </section>

                    <section>
                        <h2>What's Next?</h2>
                        <ol>
                            <li><strong>Test it out</strong>: Start with a simple request like "Create a hello world component"</li>
                            <li><strong>Integrate</strong>: Copy generated code into your actual project</li>
                            <li><strong>Iterate</strong>: Refine with follow-up requests</li>
                            <li><strong>Automate</strong>: Use the GitHub integration for automated PRs</li>
                            <li><strong>Extend</strong>: Add custom plugins for your specific needs</li>
                        </ol>
                        <p>The agents learn from your conversation history, so the more you work with them, the better they understand your project's patterns and requirements!</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
