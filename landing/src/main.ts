import './style.css'

// ============================================================================
// HIVE-R Landing Page
// ============================================================================

const agents = [
    { name: 'Router', emoji: '🧭', role: 'Traffic Controller', team: 'Core' },
    { name: 'Founder', emoji: '👔', role: 'Strategic Vision', team: 'Strategy' },
    { name: 'Product Manager', emoji: '📋', role: 'Requirements', team: 'Strategy' },
    { name: 'UX Researcher', emoji: '🔬', role: 'User Insights', team: 'Strategy' },
    { name: 'Designer', emoji: '🎨', role: 'UI/UX Design', team: 'Design' },
    { name: 'Accessibility', emoji: '♿', role: 'WCAG Compliance', team: 'Design' },
    { name: 'Planner', emoji: '📐', role: 'Architecture', team: 'Build' },
    { name: 'Security', emoji: '🔒', role: 'Threat Modeling', team: 'Build' },
    { name: 'Builder', emoji: '🛠️', role: 'Code Generation', team: 'Build' },
    { name: 'Reviewer', emoji: '👀', role: 'Code Review', team: 'Build' },
    { name: 'Tester', emoji: '🧪', role: 'Quality Assurance', team: 'Build' },
    { name: 'Tech Writer', emoji: '✍️', role: 'Documentation', team: 'Ship' },
    { name: 'SRE', emoji: '🚀', role: 'Deployment', team: 'Ship' },
    { name: 'Data Analyst', emoji: '📊', role: 'Analytics', team: 'Ship' },
];

const demoScenarios = [
    { prompt: 'Build a login page', agents: ['Designer', 'Builder', 'Tester'] },
    { prompt: 'Create a REST API', agents: ['Planner', 'Builder', 'Tester', 'Tech Writer'] },
    { prompt: 'Design a dashboard', agents: ['UX Researcher', 'Designer', 'Builder'] },
];

function renderApp() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-content">
        <a href="/" class="nav-logo">
          <span class="logo-emoji">🐝</span>
          <span class="logo-text">HIVE-R</span>
        </a>
        <div class="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="/docs">Docs</a>
          <a href="/demo" class="nav-cta">Try Demo</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Your <span class="gradient-text">AI Development Team</span>
        </h1>
        <p class="hero-subtitle">
          13 AI agents that work together to build your product—from initial idea to deployed code. No hiring. No coordination. Just results.
        </p>
        <div class="hero-ctas">
          <a href="/demo" class="btn btn-primary">
            <span>Try Demo</span>
            <span class="btn-arrow">→</span>
          </a>
          <a href="/docs" class="btn btn-secondary">
            <span>View Documentation</span>
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="agent-graph">
          ${renderAgentGraph()}
        </div>
      </div>
    </section>

    <!-- Problem/Solution -->
    <section class="problem-solution">
      <div class="container">
        <div class="ps-grid">
          <div class="ps-card problem">
            <div class="ps-icon">😤</div>
            <h3>The Old Way</h3>
            <ul>
              <li>Hire 10+ specialists</li>
              <li>Coordinate across timezones</li>
              <li>Wait weeks for reviews</li>
              <li>Budget $500K+ annually</li>
            </ul>
          </div>
          <div class="ps-arrow">→</div>
          <div class="ps-card solution">
            <div class="ps-icon">🐝</div>
            <h3>The HIVE-R Way</h3>
            <ul>
              <li>13 AI agents, always available</li>
              <li>Instant collaboration</li>
              <li>Code in minutes, not weeks</li>
              <li>Fraction of the cost</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Features (Agents) -->
    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title">Meet Your Team</h2>
        <p class="section-subtitle">Specialized AI agents working together seamlessly</p>
        
        <div class="team-sections">
          ${renderTeamSection('Strategy', 'What to build', agents.filter(a => a.team === 'Strategy'))}
          ${renderTeamSection('Design', 'How it looks', agents.filter(a => a.team === 'Design'))}
          ${renderTeamSection('Build', 'The code', agents.filter(a => a.team === 'Build'))}
          ${renderTeamSection('Ship', 'Get it live', agents.filter(a => a.team === 'Ship'))}
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="how-it-works">
      <div class="container">
        <h2 class="section-title">How It Works</h2>
        <p class="section-subtitle">Three simple steps to production-ready code</p>
        
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Describe</h3>
            <p>Tell HIVE-R what you want to build in plain English</p>
          </div>
          <div class="step-connector">
            <div class="connector-line"></div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>Collaborate</h3>
            <p>Watch as agents work together—designing, coding, testing</p>
          </div>
          <div class="step-connector">
            <div class="connector-line"></div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>Ship</h3>
            <p>Get production-ready code with docs and deployment configs</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Demo Preview -->
    <section class="demo-preview">
      <div class="container">
        <h2 class="section-title">See It In Action</h2>
        <p class="section-subtitle">Try these prompts in our live demo</p>
        
        <div class="demo-scenarios">
          ${demoScenarios.map(s => `
            <a href="/demo?prompt=${encodeURIComponent(s.prompt)}" class="demo-card">
              <div class="demo-prompt">"${s.prompt}"</div>
              <div class="demo-agents">
                ${s.agents.map(a => {
        const agent = agents.find(ag => ag.name === a);
        return `<span class="demo-agent">${agent?.emoji || '🤖'}</span>`;
    }).join('')}
              </div>
              <div class="demo-action">Try this →</div>
            </a>
          `).join('')}
        </div>
        
        <div class="demo-cta">
          <a href="/demo" class="btn btn-primary btn-large">
            Launch Full Demo
          </a>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta">
      <div class="container">
        <h2>Ready to Build?</h2>
        <p>Start building with your AI development team today</p>
        <div class="cta-buttons">
          <a href="/app" class="btn btn-primary btn-large">Get Started</a>
          <a href="https://github.com/HIVE-R/hive-r" class="btn btn-secondary btn-large" target="_blank">
            ⭐ Star on GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="logo-emoji">🐝</span>
            <span class="logo-text">HIVE-R</span>
            <p>Your AI Development Team</p>
          </div>
          <div class="footer-links">
            <div class="footer-column">
              <h4>Product</h4>
              <a href="/app">Studio</a>
              <a href="/demo">Demo</a>
              <a href="/docs">Documentation</a>
            </div>
            <div class="footer-column">
              <h4>Resources</h4>
              <a href="/docs/guide/getting-started">Getting Started</a>
              <a href="/docs/api/endpoints">API Reference</a>
              <a href="/docs/concepts/agents">Agents Guide</a>
            </div>
            <div class="footer-column">
              <h4>Community</h4>
              <a href="https://github.com/HIVE-R/hive-r" target="_blank">GitHub</a>
              <a href="https://discord.gg/hive-r" target="_blank">Discord</a>
              <a href="https://twitter.com/hive_r_ai" target="_blank">Twitter</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 HIVE-R. Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  `;

    // Add animation classes after render
    requestAnimationFrame(() => {
        document.querySelectorAll('.agent-node').forEach((node, i) => {
            setTimeout(() => {
                node.classList.add('visible');
            }, i * 100);
        });
    });
}

function renderAgentGraph(): string {
    return `
    <div class="graph-center">
      <div class="agent-node router">
        <span class="agent-emoji">🧭</span>
        <span class="agent-name">Router</span>
      </div>
    </div>
    <div class="graph-ring">
      ${agents.filter(a => a.name !== 'Router').slice(0, 8).map((agent, i) => `
        <div class="agent-node" style="--i: ${i}; --total: 8;">
          <span class="agent-emoji">${agent.emoji}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTeamSection(name: string, description: string, teamAgents: typeof agents): string {
    return `
    <div class="team-section">
      <div class="team-header">
        <h3>${name}</h3>
        <span class="team-desc">${description}</span>
      </div>
      <div class="team-agents">
        ${teamAgents.map(agent => `
          <div class="agent-card">
            <div class="agent-card-emoji">${agent.emoji}</div>
            <div class="agent-card-info">
              <div class="agent-card-name">${agent.name}</div>
              <div class="agent-card-role">${agent.role}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Initialize
document.addEventListener('DOMContentLoaded', renderApp);
