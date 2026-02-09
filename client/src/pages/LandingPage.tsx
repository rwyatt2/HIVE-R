/**
 * HIVE-R Landing Page - "The Awakening"
 * 
 * Award-winning landing page using Bionic Minimalism design system.
 * No external CSS - fully Tailwind with design tokens.
 */

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Zap, Shield, Rocket, Code2, Users, Eye, Layers, Bot, ChevronRight, Play, Star, Activity,
    Globe, Briefcase, ClipboardList, Search, Palette, Accessibility, GitBranch, ShieldCheck,
    Hammer, FlaskConical, FileText, Hexagon, MessageCircle, DollarSign, CalendarClock, BrainCircuit,
    CheckCircle2, X, type LucideIcon
} from 'lucide-react';


// ─── Agent Data ─────────────────────────────────────────────────────────────
const agents: { id: string; name: string; Icon: LucideIcon; role: string; color: string }[] = [
    { id: 'router', name: 'Router', Icon: Globe, role: 'Orchestrator', color: '#6366F1' },
    { id: 'founder', name: 'Founder', Icon: Briefcase, role: 'Strategy', color: '#8B5CF6' },
    { id: 'pm', name: 'PM', Icon: ClipboardList, role: 'Requirements', color: '#A78BFA' },
    { id: 'ux', name: 'UX Researcher', Icon: Search, role: 'User Insights', color: '#C4B5FD' },
    { id: 'designer', name: 'Designer', Icon: Palette, role: 'UI/UX', color: '#F472B6' },
    { id: 'a11y', name: 'A11y', Icon: Accessibility, role: 'Accessibility', color: '#34D399' },
    { id: 'planner', name: 'Planner', Icon: GitBranch, role: 'Architecture', color: '#06B6D4' },
    { id: 'security', name: 'Security', Icon: ShieldCheck, role: 'Security', color: '#EF4444' },
    { id: 'builder', name: 'Builder', Icon: Hammer, role: 'Code Gen', color: '#F59E0B' },
    { id: 'reviewer', name: 'Reviewer', Icon: Eye, role: 'Code Review', color: '#10B981' },
    { id: 'tester', name: 'Tester', Icon: FlaskConical, role: 'QA', color: '#3B82F6' },
    { id: 'writer', name: 'Tech Writer', Icon: FileText, role: 'Docs', color: '#64748B' },
    { id: 'sre', name: 'SRE', Icon: Rocket, role: 'Deploy', color: '#F97316' },
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

const stepVisuals: Record<string, JSX.Element> = {
    Describe: (
        <div className="rounded-2xl border border-white/6 bg-void-900/50 backdrop-blur-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-starlight-400">
                <span>Product Brief</span>
                <span className="px-2 py-0.5 rounded-full bg-electric-violet/10 text-electric-violet">Draft</span>
            </div>
            <div className="space-y-2">
                <div className="h-2 w-3/4 rounded-full bg-white/10" />
                <div className="h-2 w-5/6 rounded-full bg-white/10" />
                <div className="h-2 w-2/3 rounded-full bg-white/10" />
            </div>
            <div className="flex items-center gap-2 text-xs text-starlight-400">
                <div className="h-2 w-2 rounded-full bg-electric-violet animate-pulse" />
                HIVE-R is listening…
            </div>
        </div>
    ),
    Collaborate: (
        <div className="rounded-2xl border border-white/6 bg-void-900/50 backdrop-blur-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-starlight-400">
                <span>Live Collaboration</span>
                <span className="px-2 py-0.5 rounded-full bg-cyber-cyan/10 text-cyber-cyan">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {['UX', 'Builder', 'Security', 'Reviewer', 'Tester', 'SRE'].map(label => (
                    <div key={label} className="rounded-lg border border-white/6 bg-white/4 px-2 py-1 text-[10px] text-starlight-300 text-center">
                        {label}
                    </div>
                ))}
            </div>
            <div className="h-2 w-full rounded-full bg-white/6 overflow-hidden">
                <div className="h-full w-2/3 bg-linear-to-r from-electric-violet to-cyber-cyan" />
            </div>
        </div>
    ),
    Ship: (
        <div className="rounded-2xl border border-white/6 bg-void-900/50 backdrop-blur-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-starlight-400">
                <span>Deployment</span>
                <span className="px-2 py-0.5 rounded-full bg-plasma-green/10 text-plasma-green">Ready</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/6 bg-white/4 px-2 py-2 text-center">
                    <Rocket className="w-4 h-4 text-honey mx-auto mb-1" />
                    <div className="text-[10px] text-starlight-300">Deploy</div>
                </div>
                <div className="rounded-lg border border-white/6 bg-white/4 px-2 py-2 text-center">
                    <ShieldCheck className="w-4 h-4 text-electric-violet mx-auto mb-1" />
                    <div className="text-[10px] text-starlight-300">Secure</div>
                </div>
                <div className="rounded-lg border border-white/6 bg-white/4 px-2 py-2 text-center">
                    <Activity className="w-4 h-4 text-cyber-cyan mx-auto mb-1" />
                    <div className="text-[10px] text-starlight-300">Monitor</div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-starlight-400">
                <div className="h-2 w-2 rounded-full bg-plasma-green" />
                Production healthy
            </div>
        </div>
    ),
};

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
    const [display, setDisplay] = useState(target);
    const ref = useRef<HTMLSpanElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setVisible(true);
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!visible) return;
        const num = parseInt(target.replace(/[^0-9]/g, ''));
        if (isNaN(num)) { return; }
        let current = 0;
        const step = Math.ceil(num / 30);
        const interval = setInterval(() => {
            current += step;
            if (current >= num) { current = num; clearInterval(interval); }
            setDisplay(target.replace(/[0-9.]+/, current.toString()));
        }, 40);
        return () => clearInterval(interval);
    }, [visible, target]);

    return <span ref={ref}>{display}{suffix}</span>;
}

import { NeuralHoneycomb } from '../components/NeuralHoneycomb';
import { NeuralAgentCluster } from '../components/NeuralAgentCluster';
import { NeuralHexNode } from '../components/NeuralHexNode';

// ─── Main Landing Page ──────────────────────────────────────────────────────
export function LandingPage() {
    const [activeSwarmAgent, setActiveSwarmAgent] = useState<typeof agents[0] | null>(null);

    return (
        <div className="min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-electric-violet/30 selection:text-white">
            {/* ─── HERO ─────────────────────────────────────────────── */}
            <NeuralHoneycomb />

            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-20 pointer-events-none min-h-screen flex items-center">
                <div className="grid lg:grid-cols-2 gap-16 items-center pointer-events-auto w-full">
                    {/* Left: Copy */}
                    <div className="space-y-8 text-left">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/4 border border-white/8 backdrop-blur-sm text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-starlight-400">Now in Public Beta</span>
                            <ChevronRight className="w-3.5 h-3.5 text-starlight-400" />
                        </div>

                        <motion.h1
                            className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <span className="block text-white">Your Portable</span>
                            <span className="block bg-linear-to-r from-[#6366F1] to-[#F59E0B] bg-clip-text text-transparent">
                                AI Software
                            </span>
                            <span className="block text-white">Team.</span>
                        </motion.h1>

                        <motion.p
                            className="text-lg lg:text-xl text-starlight-400 max-w-lg leading-relaxed"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                        >
                            Stop paying $15k–50k for an MVP that takes months. Describe your idea in plain English
                            and 13 AI specialists will design, build, test, and deploy it - in about 15 minutes.
                        </motion.p>

                        {/* CTA Group */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 pt-2"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                        >
                            <Link
                                to="/demo"
                                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-linear-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Try Live Demo
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                to="/docs"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/4 border border-white/10 rounded-xl font-medium text-starlight-400 hover:text-white hover:bg-white/8 hover:border-white/15 transition-all duration-300"
                            >
                                Documentation
                            </Link>
                        </motion.div>

                        {/* Social proof */}
                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex -space-x-2">
                                {['#6366F1', '#F59E0B', '#06B6D4', '#EF4444', '#10B981'].map((c, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-void-950 flex items-center justify-center text-xs" style={{ background: c }}>
                                        {['R', 'F', 'P', 'D', 'B'][i]}
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-starlight-400">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                </div>
                                <span>Loved by 500+ founders</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Neural Agent Cluster (New Graphic) */}
                    <div className="hidden lg:flex items-center justify-center pointer-events-auto">
                        <NeuralAgentCluster />
                    </div>
                </div>
            </div>

            {/* ─── METRICS BAR ──────────────────────────────────────── */}
            <section className="relative z-10 -mt-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {metrics.map((m) => {
                            const Icon = m.icon;
                            return (
                                <div key={m.label} className="bg-void-900/70 backdrop-blur-xl border border-white/6 rounded-2xl p-6 text-center group hover:bg-void-800/80 transition-colors">
                                    <Icon className="w-5 h-5 mx-auto mb-3 text-starlight-400 group-hover:text-electric-violet transition-colors" />
                                    <div className="text-2xl lg:text-3xl font-bold text-white mb-1 font-mono tracking-tight">
                                        <AnimatedCounter target={m.value} />
                                    </div>
                                    <div className="text-xs text-starlight-400 tracking-wide uppercase">{m.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── PAIN POINTS ─────────────────────────────────────── */}
            <section id="features" className="relative py-24 lg:py-32">
                <div className="max-w-5xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                            Sound <span className="bg-gradient-to-r from-[#F59E0B] to-[#F97316] bg-clip-text text-transparent">familiar?</span>
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { Icon: MessageCircle, pain: '"I explained my idea 5 times and still got the wrong thing built"', label: 'Translation gap' },
                            { Icon: DollarSign, pain: '"I spent $30k on a freelancer and the app breaks every week"', label: 'Wasted budget' },
                            { Icon: CalendarClock, pain: '"My MVP was supposed to take 6 weeks - it\'s been 4 months"', label: 'Timeline creep' },
                            { Icon: BrainCircuit, pain: '"React? Vue? PostgreSQL? I just want my product to work"', label: 'Tech overwhelm' },
                            { Icon: ShieldCheck, pain: '"How do I know my app is secure enough to launch?"', label: 'Production anxiety' },
                            { Icon: CheckCircle2, pain: '"HIVE-R built what I described in 15 minutes. It just works."', label: 'The HIVE-R moment', highlight: true },
                        ].map(item => (
                            <div key={item.label} className={`rounded-2xl p-6 border backdrop-blur-xl transition-all duration-300 ${item.highlight
                                ? 'bg-void-900/70 border-electric-violet/40 hover:border-electric-violet/60 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                                : 'bg-void-900/70 border-white/6 hover:border-white/10'
                                }`}>
                                <item.Icon className={`w-6 h-6 mb-3 ${item.highlight ? 'text-electric-violet' : 'text-starlight-400'}`} />
                                <p className={`text-sm leading-relaxed italic mb-3 ${item.highlight ? 'text-white' : 'text-starlight-400'}`}>
                                    {item.pain}
                                </p>
                                <div className={`text-xs font-medium tracking-wide uppercase ${item.highlight ? 'text-electric-violet' : 'text-starlight-700'}`}>
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
            <section id="how-it-works" className="relative py-32 lg:py-40">
                <div className="max-w-6xl mx-auto px-6 lg:px-12">
                    {/* Section header */}
                    <div className="text-center mb-20 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-violet/10 border border-electric-violet/20 text-sm text-electric-violet font-medium">
                            <Layers className="w-3.5 h-3.5" />
                            How It Works
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
                            Three steps to <span className="bg-gradient-to-r from-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">production</span>
                        </h2>
                        <p className="text-lg text-starlight-400 max-w-2xl mx-auto">
                            No coding required. No tech decisions. Just describe what you want and your AI team builds it.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.num} className="group relative">
                                    {/* Connector line */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-12 left-[calc(50%+60px)] w-[calc(100%-120px)] h-px bg-gradient-to-r from-white/10 to-white/5" />
                                    )}

                                <div className="relative bg-void-900/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] hover:bg-void-900/60 transition-all duration-500 group-hover:-translate-y-1">
                                        {/* Step number */}
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-5xl font-bold text-white/[0.06] font-mono">{step.num}</span>
                                            <div className="w-12 h-12 rounded-xl bg-electric-violet/10 border border-electric-violet/20 flex items-center justify-center group-hover:bg-electric-violet/20 transition-colors">
                                                <Icon className="w-6 h-6 text-electric-violet" />
                                            </div>
                                        </div>
                                    <div className="mb-6">
                                        {stepVisuals[step.title]}
                                    </div>
                                        <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                        <p className="text-starlight-400 text-sm leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── DIFFERENTIATOR ──────────────────────────────────── */}
            <section className="relative py-32">
                <div className="max-w-6xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-reactor-red/10 border border-reactor-red/20 text-sm text-reactor-red font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Why Founders Choose HIVE-R
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
                            Skip the <span className="bg-gradient-to-r from-reactor-red to-[#F97316] bg-clip-text text-transparent">agency hamster wheel</span>
                        </h2>
                        <p className="text-lg text-starlight-400 max-w-2xl mx-auto">
                            No more waiting months for an MVP. No more burning through your runway on freelancers who miss deadlines.
                            HIVE-R gives you the output of a full dev team - instantly.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Traditional path */}
                        <div className="bg-void-900/40 border border-white/[0.06] rounded-2xl p-8 space-y-5 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-starlight-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-starlight-400">Traditional Path</div>
                                    <div className="text-xs text-starlight-700">Freelancers &amp; agencies</div>
                                </div>
                            </div>
                            {['2–3 months for a basic MVP', '$15k–$50k minimum investment', 'Scope creep & missed deadlines', 'Lost in translation - your vision gets diluted'].map(item => (
                                <div key={item} className="flex items-center gap-3 text-sm text-starlight-400">
                                    <div className="w-5 h-5 rounded-full bg-reactor-red/10 flex items-center justify-center">
                                        <X className="w-3 h-3 text-reactor-red" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>

                        {/* HIVE-R */}
                        <div className="bg-electric-violet/[0.06] border border-electric-violet/20 rounded-2xl p-8 space-y-5 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-electric-violet/10 rounded-full blur-3xl" />
                            <div className="relative flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-electric-violet/15 border border-electric-violet/30 flex items-center justify-center">
                                    <Hexagon className="w-5 h-5 text-electric-violet" />
                                </div>
                                <div>
                                    <div className="font-semibold text-white">HIVE-R</div>
                                    <div className="text-xs text-electric-violet">Your AI software team</div>
                                </div>
                            </div>
                            {[
                                'Idea to production-ready app in 15 minutes',
                                '$0 - free during beta',
                                'Built-in security, monitoring, and testing',
                                'Describe in plain English - no technical jargon needed',
                            ].map(item => (
                                <div key={item} className="relative flex items-center gap-3 text-sm text-white">
                                    <div className="w-5 h-5 rounded-full bg-electric-violet/20 border border-electric-violet/30 flex items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 text-electric-violet" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── AGENT SHOWCASE ────────────────────────────────────── */}
            <section className="relative py-32 overflow-hidden min-h-[900px] flex items-center justify-center">
                {/* Background accent */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.06),transparent)]" />
                <div className="absolute inset-0 bg-hex-pattern opacity-[0.08] pointer-events-none" />

                <div className="relative w-full max-w-[1400px] mx-auto px-6 h-full flex flex-col items-center justify-center">
                    
                    {/* Center Text Block / Agent Info Hub */}
                    <div className="absolute z-20 flex flex-col items-center justify-center text-center max-w-xl pointer-events-none min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {activeSwarmAgent ? (
                                <motion.div
                                    key="agent-info"
                                    initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center"
                                >
                                    <div 
                                        className="w-24 h-24 rounded-2xl bg-void-900/50 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(99,102,241,0.2)]"
                                        style={{ borderColor: activeSwarmAgent.color }}
                                    >
                                        <activeSwarmAgent.Icon 
                                            className="w-12 h-12" 
                                            style={{ color: activeSwarmAgent.color, filter: `drop-shadow(0 0 10px ${activeSwarmAgent.color})` }} 
                                        />
                                    </div>
                                    <h3 className="text-5xl font-bold text-white mb-3 tracking-tight">{activeSwarmAgent.name}</h3>
                                    <div className="text-xl text-starlight-400 uppercase tracking-[0.2em] mb-6 font-mono" style={{ color: activeSwarmAgent.color }}>
                                        {activeSwarmAgent.role}
                                    </div>
                                    <p className="text-xl text-starlight-300 italic max-w-md leading-relaxed">
                                        "I handle {activeSwarmAgent.role.toLowerCase()} tasks for your project."
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="default-title"
                                    initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-honey/10 border border-honey/20 text-sm text-honey font-medium mb-6 backdrop-blur-md">
                                        <Users className="w-3.5 h-3.5" />
                                        The Swarm
                                    </div>
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                                        13 agents. <br />
                                        <span className="bg-linear-to-r from-honey to-[#FBBF24] bg-clip-text text-transparent">One mission.</span>
                                    </h2>
                                    <p className="text-lg text-starlight-400 leading-relaxed drop-shadow-md">
                                        Every agent is a specialist. Together they cover every discipline of software engineering.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Agents - Organically placed around the text */}
                    {/* Using a relative container for absolute positioning of agents */}
                    <div className="relative w-[1400px] h-[1000px] hidden lg:block">
                        {agents.map((agent, i) => {
                            // Organic coordinates relative to center (0,0)
                            // We place them in a broken ring/cloud formation
                            // Left Side Clump
                            const positions = [
                                { x: -550, y: -220 },  // Top Left
                                { x: -500, y: 0 },     // Mid Left
                                { x: -550, y: 220 },   // Bottom Left
                                { x: -350, y: -320 },  // High Top Left
                                { x: -350, y: 320 },   // Low Bottom Left
                                { x: -180, y: -420 },  // Top Spread
                                { x: -180, y: 420 },   // Bottom Spread
                                
                                // Right Side Clump
                                { x: 550, y: -220 },   // Top Right
                                { x: 500, y: 0 },      // Mid Right
                                { x: 550, y: 220 },    // Bottom Right
                                { x: 350, y: -320 },   // High Top Right
                                { x: 350, y: 320 },    // Low Bottom Right
                                { x: 180, y: -420 },   // Top Spread
                            ];

                            const pos = positions[i] || { x: 0, y: 0 };
                            
                            return (
                                <motion.div 
                                    key={agent.name}
                                    className="absolute left-1/2 top-1/2 pointer-events-auto"
                                    style={{ 
                                        x: pos.x, 
                                        y: pos.y,
                                        marginLeft: -86, // Half of width (173)
                                        marginTop: -100   // Half of height (200)
                                    }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ 
                                        duration: 0.8, 
                                        delay: i * 0.1, 
                                        type: "spring",
                                        bounce: 0.4
                                    }}
                                >
                                    <NeuralHexNode 
                                        agent={agent} 
                                        width={173} 
                                        height={200} 
                                        showLabel={false}
                                        onHoverStart={() => setActiveSwarmAgent(agent)}
                                        onHoverEnd={() => setActiveSwarmAgent(null)}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Mobile Grid Fallback */}
                    <div className="lg:hidden grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
                         {agents.map((agent) => (
                            <div key={agent.name} className="flex justify-center">
                                <NeuralHexNode 
                                    agent={agent} 
                                    width={100} 
                                    height={115} 
                                    showLabel={true}
                                />
                            </div>
                         ))}
                    </div>
                </div>
            </section>

            {/* ─── DEMO PREVIEW ─────────────────────────────────────── */}
            <section className="relative py-32">
                <div className="max-w-6xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-sm text-cyber-cyan font-medium">
                            <Eye className="w-3.5 h-3.5" />
                            See It In Action
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
                            Try a <span className="bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] bg-clip-text text-transparent">prompt</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { prompt: 'Build my SaaS landing page with signup', agents: ['Designer', 'Builder', 'Security'], time: '~4 min' },
                            { prompt: 'Create a customer portal with billing', agents: ['Planner', 'Builder', 'Tester'], time: '~8 min' },
                            { prompt: 'Build an internal dashboard for my team', agents: ['UX Researcher', 'Designer', 'Builder'], time: '~6 min' },
                        ].map((demo) => (
                            <Link
                                key={demo.prompt}
                                to={`/demo?prompt=${encodeURIComponent(demo.prompt)}`}
                                className="group relative bg-void-900/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 hover:border-electric-violet/30 hover:bg-void-900/60 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <div className="text-base font-medium text-white mb-4 group-hover:text-electric-violet transition-colors">
                                    "{demo.prompt}"
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-1.5">
                                        {demo.agents.map(name => {
                                            const agent = agents.find(a => a.name === name);
                                            const IconComponent = agent?.Icon || Bot;
                                            return (
                                                <div key={name} className="w-7 h-7 rounded-full bg-void-800 border border-white/10 flex items-center justify-center">
                                                    <IconComponent className="w-3.5 h-3.5" style={{ color: agent?.color || '#6366F1' }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-starlight-400">
                                        <Zap className="w-3 h-3" />
                                        {demo.time}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-sm text-electric-violet opacity-0 group-hover:opacity-100 transition-opacity">
                                    Try this prompt <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FINAL CTA ────────────────────────────────────────── */}
            <section className="relative py-32">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(99,102,241,0.1),transparent)]" />
                <div className="relative max-w-3xl mx-auto px-6 text-center space-y-8">
                    <h2 className="text-4xl lg:text-6xl font-bold tracking-tight">
                        Ready to build<br />
                        <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#F59E0B] bg-clip-text text-transparent">
                            something extraordinary?
                        </span>
                    </h2>
                    <p className="text-lg text-starlight-400 max-w-xl mx-auto">
                        Your portable AI software team is standing by. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl font-semibold text-lg shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/demo"
                            className="inline-flex items-center gap-2 px-8 py-5 text-starlight-400 hover:text-white transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Watch 2-Min Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ───────────────────────────────────────────── */}
            <footer className="relative z-10 border-t border-white/[0.06] bg-void-900/40 backdrop-blur-xl py-16">
                <div className="max-w-6xl mx-auto px-6 lg:px-12">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {/* Brand */}
                        <div className="space-y-4 lg:col-span-1">
                            <div className="flex items-center gap-2">
                                <Hexagon className="w-6 h-6 text-electric-violet" />
                                <span className="text-lg font-bold">HIVE-R</span>
                            </div>
                            <p className="text-sm text-starlight-400 leading-relaxed">
                                Your Portable AI Software Team.
                            </p>
                        </div>

                        {/* Links */}
                        {[
                            {
                                title: 'Product', links: [
                                    { label: 'Studio', to: '/app' },
                                    { label: 'Demo', to: '/demo' },
                                    { label: 'Pricing', to: '#' },
                                ]
                            },
                            {
                                title: 'Resources', links: [
                                    { label: 'Documentation', to: '/docs' },
                                    { label: 'API Reference', to: '/docs' },
                                    { label: 'Changelog', to: '#' },
                                ]
                            },
                            {
                                title: 'Community', links: [
                                    { label: 'GitHub', to: 'https://github.com/rwyatt2/HIVE-R', external: true },
                                    { label: 'Discord', to: 'https://discord.gg/hive-r', external: true },
                                    { label: 'Twitter', to: 'https://twitter.com/hive_r_ai', external: true },
                                ]
                            },
                        ].map(col => (
                            <div key={col.title}>
                                <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">{col.title}</h3>
                                <ul className="space-y-3">
                                    {col.links.map(link => (
                                        <li key={link.label}>
                                            {'external' in link ? (
                                                <a href={link.to} target="_blank" rel="noreferrer" className="text-sm text-starlight-400 hover:text-white transition-colors">
                                                    {link.label}
                                                </a>
                                            ) : (
                                                <Link to={link.to} className="text-sm text-starlight-400 hover:text-white transition-colors">
                                                    {link.label}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-starlight-700">© 2026 HIVE-R. Open source under MIT License.</p>
                        <div className="flex items-center gap-4 text-xs text-starlight-700">
                            <a href="#" className="hover:text-starlight-400 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-starlight-400 transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer >
        </div >
    );
}
