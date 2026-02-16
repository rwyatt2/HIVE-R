/**
 * HIVE-R Landing Page - "The Awakening"
 * 
 * Enterprise Minimal Design System (Vercel/Anthropic inspired).
 * Clean, typography-driven, functional.
 */

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight, Zap, Shield, Rocket, Code2, Users, Eye, Layers, Bot, ChevronRight, Play, Star, Activity,
    Globe, Briefcase, ClipboardList, Search, Palette, Accessibility, GitBranch, ShieldCheck,
    Hammer, FlaskConical, FileText, Hexagon, MessageCircle, DollarSign, CalendarClock, BrainCircuit,
    CheckCircle2, X, type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ─── Agent Data ─────────────────────────────────────────────────────────────
const agents: { id: string; name: string; Icon: LucideIcon; role: string; description: string; capabilities?: string[]; color: string }[] = [
    { 
        id: 'router', 
        name: 'Router', 
        Icon: Globe, 
        role: 'Orchestrator', 
        description: "Coordinates the entire swarm.",
        capabilities: ["Route requests", "Manage state", "Error handling"],
        color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20"
    },
    { 
        id: 'founder', 
        name: 'Founder', 
        Icon: Briefcase, 
        role: 'Strategy', 
        description: "Defines product vision and goals.",
        capabilities: ["Market analysis", "Feature prioritization", "Roadmap planning"],
        color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
    },
    { 
        id: 'pm', 
        name: 'PM', 
        Icon: ClipboardList, 
        role: 'Requirements', 
        description: "Translates vision into specs.",
        capabilities: ["User stories", "Acceptance criteria", "Scope management"],
        color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
    },
    { 
        id: 'ux', 
        name: 'UX Researcher', 
        Icon: Search, 
        role: 'User Insights', 
        description: "Analyzes user needs and flows.",
        capabilities: ["User personas", "Journey mapping", "Usability testing"],
        color: "text-pink-400 bg-pink-400/10 border-pink-400/20"
    },
    { 
        id: 'designer', 
        name: 'Designer', 
        Icon: Palette, 
        role: 'UI/UX', 
        description: "Creates visual design systems.",
        capabilities: ["Design systems", "Component libraries", "Responsive layouts"],
        color: "text-pink-400 bg-pink-400/10 border-pink-400/20"
    },
    { 
        id: 'a11y', 
        name: 'A11y', 
        Icon: Accessibility, 
        role: 'Accessibility', 
        description: "Ensures WCAG compliance.",
        capabilities: ["WCAG audits", "Screen reader testing", "Contrast checks"],
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    },
    { 
        id: 'planner', 
        name: 'Planner', 
        Icon: GitBranch, 
        role: 'Architecture', 
        description: "Structures the codebase.",
        capabilities: ["System design", "Database schema", "API design"],
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    },
    { 
        id: 'security', 
        name: 'Security', 
        Icon: ShieldCheck, 
        role: 'Security', 
        description: "Audits for vulnerabilities.",
        capabilities: ["Dependency scanning", "Code analysis", "Penetration testing"],
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    },
    { 
        id: 'builder', 
        name: 'Builder', 
        Icon: Hammer, 
        role: 'Code Gen', 
        description: "Writes production-ready code.",
        capabilities: ["React/TypeScript", "Node.js", "Tailwind CSS"],
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    },
    { 
        id: 'reviewer', 
        name: 'Reviewer', 
        Icon: Eye, 
        role: 'Code Review', 
        description: "Optimizes and refactors code.",
        capabilities: ["Code quality", "Performance tuning", "Best practices"],
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    },
    { 
        id: 'tester', 
        name: 'Tester', 
        Icon: FlaskConical, 
        role: 'QA', 
        description: "Runs integration tests.",
        capabilities: ["Unit testing", "E2E testing", "Regression testing"],
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    },
    { 
        id: 'writer', 
        name: 'Tech Writer', 
        Icon: FileText, 
        role: 'Docs', 
        description: "Generates documentation.",
        capabilities: ["API docs", "User guides", "README generation"],
        color: "text-violet-400 bg-violet-400/10 border-violet-400/20"
    },
    { 
        id: 'sre', 
        name: 'SRE', 
        Icon: Rocket, 
        role: 'Deploy', 
        description: "Manages infrastructure.",
        capabilities: ["CI/CD pipelines", "Cloud deployment", "Monitoring"],
        color: "text-orange-400 bg-orange-400/10 border-orange-400/20"
    },
];

const metrics = [
    { label: 'Idea to Launch', value: '15min', icon: Zap },
    { label: 'Cost vs Agency', value: '$0', icon: Code2 },
    { label: 'Lighthouse Score', value: '98', icon: Rocket },
    { label: 'Security Rating', value: 'A+', icon: Shield },
];

const steps = [
    { num: '01', title: 'Describe', desc: 'Describe your product idea like you would to a co-founder. No technical knowledge needed.', icon: Bot },
    { num: '02', title: 'Collaborate', desc: 'Watch your AI team design screens, write code, run security checks, and test everything - live.', icon: Users },
    { num: '03', title: 'Ship', desc: 'Get a production-ready app with monitoring, security, and everything needed to go live.', icon: Rocket },
];

// ─── Main Landing Page ──────────────────────────────────────────────────────
export function LandingPage() {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const { scrollY } = useScroll();
    const backgroundY = useTransform(scrollY, [0, 1000], [0, 200]);
    const backgroundOpacity = useTransform(scrollY, [0, 300], [0.4, 0.1]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/10">
            {/* ─── Background Grid ─── */}
            <motion.div 
                style={{ y: backgroundY, opacity: backgroundOpacity }}
                className="fixed inset-0 bg-honeycomb-pattern pointer-events-none z-0" 
            />
            <div className="fixed inset-0 bg-linear-to-b from-transparent via-background/50 to-background pointer-events-none z-0" />

            {/* ─── HERO ─────────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
                
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-default">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Public Beta
                        <span className="mx-1 text-border">|</span>
                        v1.0.0
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Your Portable <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 bg-clip-text text-transparent">AI Software Team.</span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Stop paying $15k–50k for an MVP that takes months. Describe your idea in plain English
                    and 13 AI specialists will design, build, test, and deploy it — in about 15 minutes.
                </motion.p>

                {/* CTA Group */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Link to="/demo">
                        <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                            Try Live Demo
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                    <Link to="/docs">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8 bg-background/50 backdrop-blur-sm">
                            Documentation
                        </Button>
                    </Link>
                </motion.div>

                {/* Social Proof */}
                <motion.div
                    className="mt-12 pt-8 border-t border-border/40 w-full max-w-md flex justify-between items-center text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                   <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-foreground text-foreground" />
                        <Star className="w-4 h-4 fill-foreground text-foreground" />
                        <Star className="w-4 h-4 fill-foreground text-foreground" />
                        <Star className="w-4 h-4 fill-foreground text-foreground" />
                        <Star className="w-4 h-4 fill-foreground text-foreground" />
                        <span className="ml-2 font-medium text-foreground">500+</span> Founders
                   </div>
                   <div className="h-4 w-px bg-border"></div>
                   <div>
                       <span className="font-medium text-foreground">$0</span> Beta Pricing
                   </div>
                </motion.div>
            </div>

            {/* ─── METRICS BAR ──────────────────────────────────────── */}
            <section className="relative z-10 py-12 border-y border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    >
                        {metrics.map((m) => {
                            const Icon = m.icon;
                            return (
                                <motion.div key={m.label} variants={fadeInUp} className="flex flex-col items-center md:items-start space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Icon className="w-4 h-4 text-primary/60" />
                                        <span className="text-sm font-medium uppercase tracking-wider">{m.label}</span>
                                    </div>
                                    <div className="text-3xl md:text-4xl font-bold text-foreground font-mono tracking-tighter">
                                        {m.value}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ─── FEATURES GRID ─────────────────────────────────────── */}
            <section className="relative py-32 z-10">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-16"
                    >
                        <h2 className="text-3xl font-bold tracking-tight mb-4">The new standard for building software.</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Traditional agencies are slow, expensive, and opaque. HIVE-R is instant, transparent, and free during beta.
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {[
                            { title: 'Zero Friction', desc: 'No setup, no configs. Just describe and deploy.', icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
                            { title: 'Full Transparency', desc: 'Watch code being written in real-time.', icon: Eye, color: 'text-blue-400 bg-blue-400/10' },
                            { title: 'Enterprise Grade', desc: 'Security, testing, and docs included by default.', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-400/10' },
                            { title: 'Design System', desc: 'Beautiful, accessible UI generated automatically.', icon: Palette, color: 'text-pink-400 bg-pink-400/10' },
                            { title: 'Instant Deploy', desc: 'One-click deployment to global edge network.', icon: Rocket, color: 'text-orange-400 bg-orange-400/10' },
                            { title: 'Cost Efficient', desc: 'Fraction of the cost of traditional dev teams.', icon: DollarSign, color: 'text-green-400 bg-green-400/10' },
                        ].map((feature, i) => (
                            <motion.div key={i} variants={fadeInUp}>
                                <Card className="bg-background/40 hover:bg-secondary/40 transition-colors border-border/60 h-full group">
                                    <CardContent className="p-6 space-y-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${feature.color.split(' ')[1]}`}>
                                            <feature.icon className={`w-5 h-5 ${feature.color.split(' ')[0]}`} />
                                        </div>
                                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── AGENT GRID (Replaces Swarm) ───────────────────────── */}
            <section className="relative py-32 z-10 border-t border-border/40">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-muted-foreground mb-4">
                                <Users className="w-3 h-3" />
                                The Team
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Meet the Swarm.</h2>
                            <p className="text-muted-foreground max-w-xl">
                                13 specialized AI agents working in concert to deliver your product.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                        {agents.map((agent) => (
                            <motion.div 
                                layoutId={`agent-card-${agent.id}`}
                                variants={fadeInUp}
                                key={agent.id}
                                className="group relative p-4 rounded-xl border border-border/60 bg-background/40 hover:bg-secondary/60 hover:border-border transition-all duration-200 cursor-pointer"
                                onClick={() => setSelectedAgentId(agent.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg transition-colors ${agent.color.split(' ')[1]}`}>
                                        <agent.Icon className={`w-5 h-5 ${agent.color.split(' ')[0]}`} />
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded bg-secondary/50 text-muted-foreground`}>
                                        {agent.role}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {agent.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── AGENT DETAIL OVERLAY ──────────────────────────────── */}
            <AnimatePresence>
                {selectedAgentId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedAgentId(null)}
                        >
                            {/* We animate the card layout based on the ID */}
                            {agents.filter(a => a.id === selectedAgentId).map(agent => (
                                <motion.div
                                    layoutId={`agent-card-${agent.id}`}
                                    key={agent.id}
                                    className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden relative"
                                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
                                >
                                    <button 
                                        onClick={() => setSelectedAgentId(null)}
                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                                    >
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </button>

                                    <div className="p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${agent.color.split(' ')[1]}`}>
                                                <agent.Icon className={`w-8 h-8 ${agent.color.split(' ')[0]}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold">{agent.name}</h3>
                                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary/50 text-xs font-medium text-muted-foreground border border-border mt-1">
                                                    {agent.role}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Role Description</h4>
                                                <p className="text-foreground leading-relaxed">
                                                    {agent.description}
                                                </p>
                                            </div>

                                            {agent.capabilities && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Capabilities</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {agent.capabilities.map(cap => (
                                                            <div key={cap} className={`flex items-center gap-2 text-sm text-foreground p-2 rounded-lg border ${agent.color.split(' ')[2]} bg-opacity-50`}>
                                                                <CheckCircle2 className={`w-4 h-4 ${agent.color.split(' ')[0]}`} />
                                                                {cap}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border flex justify-end">
                                            <Button onClick={() => setSelectedAgentId(null)}>
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

             {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
             <section id="how-it-works" className="relative py-32 border-t border-border/40 bg-secondary/20">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="text-center mb-20 max-w-2xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                            From prompt to production.
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Three simple steps to launch your next big idea.
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div key={step.num} variants={fadeInUp} className="relative">
                                    {/* Connector */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border border-t border-dashed border-border/60" />
                                    )}
                                    
                                    <div className="relative z-10 bg-background border border-border rounded-2xl p-8 h-full hover:shadow-lg transition-shadow duration-300">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ─── CTA ──────────────────────────────────────────────── */}
            <section className="relative py-32 border-t border-border/40">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="max-w-4xl mx-auto px-6 text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
                        Ready to build something extraordinary?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Your portable AI software team is standing by. Get started for free today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link to="/demo">
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-transparent">
                                <Play className="mr-2 w-4 h-4" />
                                Watch Demo
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ─── FOOTER ───────────────────────────────────────────── */}
            <footer className="relative z-10 border-t border-border bg-card py-12 text-sm">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-bold">
                        <Hexagon className="w-5 h-5 fill-foreground text-foreground" />
                        HIVE-R
                    </div>
                    <div className="flex gap-8 text-zinc-400 font-medium">
                        <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
                        <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                        <a href="https://github.com/rwyatt2/HIVE-R" className="hover:text-foreground transition-colors">GitHub</a>
                        <a href="https://twitter.com" className="hover:text-foreground transition-colors">Twitter</a>
                    </div>
                    <div className="text-zinc-500">
                        © 2026 HIVE-R. MIT License.
                    </div>
                </div>
            </footer>
        </div>
    );
}
