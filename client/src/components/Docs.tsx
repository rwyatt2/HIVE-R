import { X, Book, Terminal, Code, Cpu, Boxes, Activity, GitBranch } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';

interface DocsProps {
    onClose: () => void;
}

export function Docs({ onClose }: DocsProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card variant="glassmorphic" className="w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border-white/10 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Book className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Documentation</h2>
                            <p className="text-sm text-muted-foreground">Getting started with HIVE-R Studio</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                    {/* Quick Start */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                            <Terminal className="h-5 w-5" />
                            Quick Start
                        </h3>
                        <div className="prose prose-invert max-w-none text-muted-foreground">
                            <p>
                                Welcome to <strong>HIVE-R Studio</strong>. You are the conductor of an elite 13-agent AI software team.
                                Your role is to guide the high-level vision while the agents handle the execution.
                            </p>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div className="p-4 rounded-xl bg-background-elevated/50 border border-white/5">
                                    <div className="font-bold text-white mb-2">1. Describe</div>
                                    <p className="text-sm">Tell the Founder agent what you want to build in plain English.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-background-elevated/50 border border-white/5">
                                    <div className="font-bold text-white mb-2">2. Watch</div>
                                    <p className="text-sm">See the agents collaborate in real-time on the graph view.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-background-elevated/50 border border-white/5">
                                    <div className="font-bold text-white mb-2">3. Deploy</div>
                                    <p className="text-sm">Get production-ready code generation and deployment plans.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Core Agents */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
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
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end">
                    <Button onClick={onClose} variant="gradient" className="shadow-glow">
                        Start Building
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function AgentDescription({ icon: Icon, name, description }: { icon: any, name: string, description: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-xl bg-background-elevated/30 border border-white/5 hover:border-primary/30 transition-colors">
            <div className="shrink-0 mt-1">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h4 className="font-bold text-foreground">{name}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
