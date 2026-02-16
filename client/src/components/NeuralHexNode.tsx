import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

export interface Agent {
    id?: string;
    name: string;
    Icon: LucideIcon;
    role: string;
    color: string;
    description?: string;
}

interface NeuralHexNodeProps {
    agent: Agent;
    width?: number;
    height?: number;
    className?: string;
    showLabel?: boolean;
    interactive?: boolean;
    onHoverStart?: (agent: Agent) => void;
    onHoverEnd?: () => void;
}

// Default dimensions matching the Hero section (HEX_SIZE = 100)
// HEX_WIDTH = Math.sqrt(3) * 100 ≈ 173.2
// HEX_HEIGHT = 2 * 100 = 200
const DEFAULT_WIDTH = 173;
const DEFAULT_HEIGHT = 200;

export const NeuralHexNode: React.FC<NeuralHexNodeProps> = ({ 
    agent, 
    width = DEFAULT_WIDTH, 
    height = DEFAULT_HEIGHT,
    className = "",
    showLabel = true,
    interactive = true,
    onHoverStart,
    onHoverEnd
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const isInteractive = interactive;

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHoverStart?.(agent);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHoverEnd?.();
    };

    return (
        <motion.div
            className={`relative z-10 flex items-center justify-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] ${className}`}
            style={{ width, height }}
            onMouseEnter={isInteractive ? handleMouseEnter : undefined}
            onMouseLeave={isInteractive ? handleMouseLeave : undefined}
            initial={false}
            animate={{ scale: isInteractive && isHovered ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <motion.div
                className={`relative flex items-center justify-center bg-void-900/40 backdrop-blur-sm border border-white/5 transition-all duration-300 w-full h-full ${isInteractive ? "cursor-pointer" : "pointer-events-none cursor-default"}`}
                style={{ 
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', // Pointy top
                }}
                animate={{
                    borderColor: isInteractive && isHovered ? agent.color : 'rgba(120, 130, 255, 0.3)',
                    borderWidth: isInteractive && isHovered ? '2px' : '1px',
                    boxShadow: isInteractive && isHovered ? `0 0 30px ${agent.color}40` : 'none',
                    backgroundColor: isInteractive && isHovered ? 'rgba(7, 7, 10, 0.9)' : 'rgba(7, 7, 10, 0.4)'
                }}
            >
                {/* Inner tint */}
                <div 
                    className="absolute inset-0 opacity-10"
                    style={{ background: `radial-gradient(circle at center, ${agent.color}, transparent)` }}
                />

                {/* Icon */}
                <agent.Icon 
                    className="w-8 h-8 transition-all duration-300" 
                    style={{ 
                        color: isHovered ? '#fff' : agent.color,
                        filter: isHovered ? `drop-shadow(0 0 8px ${agent.color})` : 'none',
                        opacity: isHovered ? 1 : 0.8
                    }} 
                />

            </motion.div>

            {/* Hover Card / Label */}
            <AnimatePresence>
                {isInteractive && isHovered && showLabel && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className="absolute z-50 pointer-events-none flex flex-col items-center justify-center"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-void-950/95 backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 shadow-2xl whitespace-nowrap -translate-y-24 min-w-[140px] text-center flex flex-col gap-1">
                                <span className="text-sm font-bold text-white tracking-wide">{agent.name}</span>
                                <span className="text-[10px] text-starlight-400 uppercase tracking-widest">{agent.role}</span>
                                {/* Line separator */}
                                <div className="w-full h-px bg-white/10 my-1" />
                                <span className="text-[10px] text-starlight-400 italic">
                                    "I handle {agent.role.toLowerCase()} tasks."
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
