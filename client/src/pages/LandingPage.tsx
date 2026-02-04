/**
 * Landing Page
 * 
 * Marketing homepage for HIVE-R.
 * Ported from landing/src/main.ts to React component.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

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

export function LandingPage() {
    useEffect(() => {
        // Animate agent nodes on mount
        const nodes = document.querySelectorAll('.agent-node');
        nodes.forEach((node, i) => {
            setTimeout(() => {
                node.classList.add('visible');
            }, i * 100);
        });
    }, []);

    const renderTeamSection = (name: string, description: string, teamAgents: typeof agents) => (
        <div className="team-section" key={name}>
            <div className="team-header">
                <h3>{name}</h3>
                <span className="team-desc">{description}</span>
            </div>
            <div className="team-agents">
                {teamAgents.map(agent => (
                    <div className="agent-card" key={agent.name}>
                        <div className="agent-card-emoji">{agent.emoji}</div>
                        <div className="agent-card-info">
                            <div className="agent-card-name">{agent.name}</div>
                            <div className="agent-card-role">{agent.role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Your <span className="gradient-text">AI Development Team</span>
                    </h1>
                    <p className="hero-subtitle">
                        13 AI agents that work together to build your product—from initial idea to deployed code. No hiring. No coordination. Just results.
                    </p>
                    <div className="hero-ctas">
                        <Link to="/demo" className="btn btn-primary">
                            <span>Try Demo</span>
                            <span className="btn-arrow">→</span>
                        </Link>
                        <Link to="/docs" className="btn btn-secondary">
                            <span>View Documentation</span>
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="agent-graph">
                        <div className="graph-center">
                            <div className="agent-node router visible">
                                <span className="agent-emoji">🧭</span>
                                <span className="agent-name">Router</span>
                            </div>
                        </div>
                        <div className="graph-ring">
                            {agents.filter(a => a.name !== 'Router').slice(0, 8).map((agent, i) => (
                                <div
                                    className="agent-node"
                                    key={agent.name}
                                    style={{ '--i': i, '--total': 8 } as React.CSSProperties}
                                >
                                    <span className="agent-emoji">{agent.emoji}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem/Solution */}
            <section className="problem-solution">
                <div className="container">
                    <div className="ps-grid">
                        <div className="ps-card problem">
                            <div className="ps-icon">😤</div>
                            <h3>The Old Way</h3>
                            <ul>
                                <li>Hire 10+ specialists</li>
                                <li>Coordinate across timezones</li>
                                <li>Wait weeks for reviews</li>
                                <li>Budget $500K+ annually</li>
                            </ul>
                        </div>
                        <div className="ps-arrow">→</div>
                        <div className="ps-card solution">
                            <div className="ps-icon">🐝</div>
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

            {/* Features (Agents) */}
            <section id="features" className="features">
                <div className="container">
                    <h2 className="section-title">Meet Your Team</h2>
                    <p className="section-subtitle">Specialized AI agents working together seamlessly</p>

                    <div className="team-sections">
                        {renderTeamSection('Strategy', 'What to build', agents.filter(a => a.team === 'Strategy'))}
                        {renderTeamSection('Design', 'How it looks', agents.filter(a => a.team === 'Design'))}
                        {renderTeamSection('Build', 'The code', agents.filter(a => a.team === 'Build'))}
                        {renderTeamSection('Ship', 'Get it live', agents.filter(a => a.team === 'Ship'))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">Three simple steps to production-ready code</p>

                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Describe</h3>
                            <p>Tell HIVE-R what you want to build in plain English</p>
                        </div>
                        <div className="step-connector">
                            <div className="connector-line"></div>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Collaborate</h3>
                            <p>Watch as agents work together—designing, coding, testing</p>
                        </div>
                        <div className="step-connector">
                            <div className="connector-line"></div>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Ship</h3>
                            <p>Get production-ready code with docs and deployment configs</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Preview */}
            <section className="demo-preview">
                <div className="container">
                    <h2 className="section-title">See It In Action</h2>
                    <p className="section-subtitle">Try these prompts in our live demo</p>

                    <div className="demo-scenarios">
                        {demoScenarios.map(s => (
                            <Link
                                to={`/demo?prompt=${encodeURIComponent(s.prompt)}`}
                                className="demo-card"
                                key={s.prompt}
                            >
                                <div className="demo-prompt">"{s.prompt}"</div>
                                <div className="demo-agents">
                                    {s.agents.map(a => {
                                        const agent = agents.find(ag => ag.name === a);
                                        return <span className="demo-agent" key={a}>{agent?.emoji || '🤖'}</span>;
                                    })}
                                </div>
                                <div className="demo-action">Try this →</div>
                            </Link>
                        ))}
                    </div>

                    <div className="demo-cta">
                        <Link to="/demo" className="btn btn-primary btn-large">
                            Launch Full Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta">
                <div className="container">
                    <h2>Ready to Build?</h2>
                    <p>Start building with your AI development team today</p>
                    <div className="cta-buttons">
                        <Link to="/login" className="btn btn-primary btn-large">Get Started</Link>
                        <a href="https://github.com/rwyatt2/HIVE-R" className="btn btn-secondary btn-large" target="_blank" rel="noreferrer">
                            ⭐ Star on GitHub
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <span className="logo-emoji">🐝</span>
                            <span className="logo-text">HIVE-R</span>
                            <p>Your AI Development Team</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <Link to="/app">Studio</Link>
                                <Link to="/demo">Demo</Link>
                                <Link to="/docs">Documentation</Link>
                            </div>
                            <div className="footer-column">
                                <h4>Resources</h4>
                                <Link to="/docs">Getting Started</Link>
                                <Link to="/docs">API Reference</Link>
                                <Link to="/docs">Agents Guide</Link>
                            </div>
                            <div className="footer-column">
                                <h4>Community</h4>
                                <a href="https://github.com/rwyatt2/HIVE-R" target="_blank" rel="noreferrer">GitHub</a>
                                <a href="https://discord.gg/hive-r" target="_blank" rel="noreferrer">Discord</a>
                                <a href="https://twitter.com/hive_r_ai" target="_blank" rel="noreferrer">Twitter</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 HIVE-R. Open source under MIT License.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
