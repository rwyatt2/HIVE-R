import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Briefcase, ClipboardList, Search, Palette, Accessibility, GitBranch, ShieldCheck, Hammer, Eye, FlaskConical, FileText, Rocket, Hexagon, type LucideIcon } from 'lucide-react';
import { NeuralHexNode } from './NeuralHexNode';

// ─── Data ────────────────────────────────────────────────────────────────────
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

// ─── Configuration ───────────────────────────────────────────────────────────
// Matched to NeuralHoneycomb's HEX_SIZE (initially 60, updated to match background 80)
const HEX_SIZE = 100; // Increased from 80 to 100 for larger display
const HEX_SPACING = 1.1; // Tighter packing to fit
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

// Hexagonal grid coordinates (axial) for the ring of 13 agents
// We'll place them in concentric rings around (0,0)
const positions = [
    // Inner Ring (6)
    { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }, { q: -1, r: 0 },
    // Outer Ring (partial 7) - nicely distributed
    { q: 0, r: -2 }, { q: 2, r: -2 }, { q: 2, r: 0 }, { q: 0, r: 2 }, { q: -2, r: 2 }, { q: -2, r: 0 },
    { q: 1, r: 1 }, // Odd one out, placed to balance
];

const axialToPixel = (q: number, r: number) => ({
    x: HEX_WIDTH * (q + r / 2) * HEX_SPACING, // Adjusted math to standard pointy topped hex to match canvas
    y: HEX_HEIGHT * 0.75 * r * HEX_SPACING
});

// Canvas grid math:
// cx = q * HEX_WIDTH + ((r % 2) * HEX_WIDTH / 2);
// cy = r * ROW_HEIGHT; (where ROW_HEIGHT = 1.5 * HEX_SIZE = 0.75 * HEX_HEIGHT)
// This matches standard pointy top layout.

export const NeuralAgentCluster = () => {
    const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

    return (
        <div className="relative w-[800px] h-[800px] flex items-center justify-center select-none perspective-1000 pointer-events-none">
            
            {/* ─── Backlight/Mask ────────────────────────────────────────── */}
            {/* This gradient hides the misaligned global background behind the cluster so it looks seamless */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,7,10,1)_0%,rgba(7,7,10,0.8)_40%,transparent_70%)] pointer-events-none z-0" />

            {/* ─── Local Background Grid ─────────────────────────────────── */}
            {/* Optional: We can render faint hexes here to guarantee alignment if needed, but for now we focus on agents */}

            {/* ─── Neural Synapses (SVG Layer) ────────────────────────────── */}
            {/* Removed connection lines as requested */}

            {/* ─── Core Node ─────────────────────────────────────────────── */}
            <motion.div
                className="absolute z-20 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, type: "spring" }}
            >
                {/* Core Glows - Removed as requested */}
                
                <div 
                    className="relative flex items-center justify-center w-32 h-36 bg-void-950/80 backdrop-blur-xl border border-electric-violet/50 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-20 group cursor-default"
                    style={{ 
                        width: HEX_WIDTH, 
                        height: HEX_HEIGHT,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' // Pointy top hex
                    }}
                >
                    <div className="absolute inset-0 bg-linear-to-br from-electric-violet/20 to-cyber-cyan/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <Hexagon className="w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
                    
                    {/* Rotating Ring inside Core removed */}
                </div>
                
                {/* HIVE-R CORE text removed */}
            </motion.div>

            {/* ─── Agent Nodes ───────────────────────────────────────────── */}
            {agents.map((agent, i) => {
                const pos = positions[i % positions.length];
                const { x, y } = axialToPixel(pos.q, pos.r);

                return (
                    <motion.div
                        key={agent.id}
                        className="absolute z-10"
                        style={{ x, y }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.5, type: "spring" }}
                    >
                        <NeuralHexNode 
                            agent={agent} 
                            width={HEX_WIDTH - 4} 
                            height={HEX_HEIGHT - 4} 
                            showLabel={false}
                            interactive={false}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
};
