import { X, Book, Terminal, Code, Cpu, Boxes, Activity, GitBranch } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
// import { ScrollArea } from '@/components/ui/scroll-area';

interface DocsProps {
    onClose?: () => void;
    variant?: 'modal' | 'page';
}

export function Docs({ onClose, variant = 'modal' }: DocsProps) {
    const isModal = variant === 'modal';
    return (
        <div className={cn(
            isModal && "fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200",
            !isModal && "h-full w-full"
        )}>
            {!isModal && (
                <div className="w-full space-y-2 mb-6 md:mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Documentation</h1>
                    <p className="text-starlight-400">Getting started with HIVE-R Studio</p>
                </div>
            )}

            <Card
                variant="glassmorphic"
                className={cn(
                    "w-full flex flex-col relative",
                    isModal
                        ? "overflow-hidden shadow-2xl max-w-4xl h-[85vh] border-white/10 bg-void-950/95"
                        : "border-white/6 bg-void-950/95"
                )}
            >
                {/* Header (Modal Only) */}
                {isModal && (
                    <div className={cn(
                        "flex items-center justify-between p-6 border-b border-white/6 bg-void-900/60"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-electric-violet/10 rounded-lg">
                                <Book className="h-6 w-6 text-electric-violet" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Documentation</h2>
                                <p className="text-sm text-starlight-400">Getting started with HIVE-R Studio</p>
                            </div>
                        </div>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/6">
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={cn(
                    "p-8 space-y-10",
                    isModal && "flex-1 overflow-y-auto custom-scrollbar"
                )}>
                    {/* Quick Start */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-electric-violet">
                            <Terminal className="h-5 w-5" />
                            Quick Start
                        </h3>
                        <div className="prose prose-invert max-w-none text-starlight-400">
                            <p>
                                Welcome to <strong>HIVE-R Studio</strong>. You are the conductor of an elite 13-agent AI software team.
                                Your role is to guide the high-level vision while the agents handle the execution.
                            </p>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div className="p-4 rounded-2xl bg-void-900/40 border border-white/6">
                                    <div className="font-bold text-white mb-2">1. Describe</div>
                                    <p className="text-sm">Tell the Founder agent what you want to build in plain English.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-void-900/40 border border-white/6">
                                    <div className="font-bold text-white mb-2">2. Watch</div>
                                    <p className="text-sm">See the agents collaborate in real-time on the graph view.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-void-900/40 border border-white/6">
                                    <div className="font-bold text-white mb-2">3. Deploy</div>
                                    <p className="text-sm">Get production-ready code generation and deployment plans.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Core Agents */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-electric-violet">
                            <Cpu className="h-5 w-5" />
                            Core Agents
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <AgentDescription
                                icon={Code}
                                name="Builder (Software Engineer)"
                                description="Writes clean, efficient code in Typescript, Python, and Rust. Handles implementation details."
                            />
                            <AgentDescription
                                icon={Activity}
                                name="Product Manager"
                                description="Breaks down your requirements into user stories and technical tasks."
                            />
                            <AgentDescription
                                icon={GitBranch}
                                name="Reviewer"
                                description="Reviews code for best practices, security vulnerabilities, and bugs."
                            />
                            <AgentDescription
                                icon={Boxes}
                                name="Designer"
                                description="Creates UI/UX designs, wireframes, and ensures visual consistency."
                            />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                {isModal && onClose && (
                    <div className="p-6 border-t border-white/6 bg-void-900/60 flex justify-end">
                        <Button onClick={onClose} variant="default">
                            Start Building
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

function AgentDescription({ icon: Icon, name, description }: { icon: any, name: string, description: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-2xl bg-void-950/95 border border-white/6 hover:border-electric-violet/30 transition-colors">
            <div className="shrink-0 mt-1">
                <Icon className="h-5 w-5 text-electric-violet" />
            </div>
            <div>
                <h4 className="font-bold text-white">{name}</h4>
                <p className="text-sm text-starlight-400 mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
