import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Sparkles, Users, DollarSign, ArrowRight, Check, X, Lightbulb, Palette, Code, TestTube, Shield, ClipboardList } from 'lucide-react';

interface StepProps {
    onNext: () => void;
    onSkip: () => void;
}

const steps = [
    { id: 'welcome', title: 'Welcome', description: 'Your AI software team' },
    { id: 'setup', title: 'Setup', description: 'Configure API keys' },
    { id: 'agents', title: 'Agents', description: 'Meet your team' },
    { id: 'templates', title: 'Templates', description: 'Try a sample' },
    { id: 'complete', title: 'Complete', description: 'You\'re ready!' },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboarding-skipped', 'true');
        onComplete();
    };

    const handleComplete = () => {
        localStorage.setItem('onboarding-completed', 'true');
        onComplete();
        navigate('/app');
    };

    const renderStep = () => {
        switch (steps[currentStep]?.id) {
            case 'welcome':
                return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />;
            case 'setup':
                return <SetupStep onNext={handleNext} onSkip={handleSkip} />;
            case 'agents':
                return <AgentsStep onNext={handleNext} onSkip={handleSkip} />;
            case 'templates':
                return <TemplatesStep onNext={handleNext} onSkip={handleSkip} />;
            case 'complete':
                return <CompleteStep onNext={handleComplete} onSkip={handleSkip} />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-hive-base/95 backdrop-blur-sm">
            <Card variant="glassmorphic" className="w-full max-w-2xl p-8 mx-4">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                        {steps.map((step, i) => (
                            <div
                                key={step.id}
                                className={`h-2 w-12 rounded-full transition-colors ${i <= currentStep ? 'bg-hive-indigo' : 'bg-hive-surface'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-hive-text-muted hover:text-hive-text-secondary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={steps[currentStep]?.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-hive-border">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                    >
                        Skip for now
                    </Button>
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <Button
                                variant="secondary"
                                onClick={() => setCurrentStep(currentStep - 1)}
                            >
                                Back
                            </Button>
                        )}
                        <Button onClick={handleNext}>
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function WelcomeStep(_props: StepProps) {
    return (
        <div className="text-center">
            <div className="text-6xl mb-6">🐝</div>
            <h1 className="text-3xl font-bold mb-4">Welcome to HIVE-R</h1>
            <p className="text-hive-text-secondary text-lg mb-8">
                Your autonomous 13-agent swarm that builds software together.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-hive-indigo" />
                    <h3 className="font-semibold">13 Agents</h3>
                    <p className="text-sm text-hive-text-muted">Expert specialists</p>
                </Card>
                <Card className="p-4 text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-hive-honey" />
                    <h3 className="font-semibold">Seamless</h3>
                    <p className="text-sm text-hive-text-muted">Smart handoffs</p>
                </Card>
                <Card className="p-4 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-hive-success" />
                    <h3 className="font-semibold">Cost Smart</h3>
                    <p className="text-sm text-hive-text-muted">Optimized routing</p>
                </Card>
            </div>
        </div>
    );
}

function SetupStep({ onNext, onSkip }: StepProps) {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!apiKey) {
            onNext();
            return;
        }
        setLoading(true);
        try {
            await fetch('/api/settings/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openaiKey: apiKey }),
            });
            onNext();
        } catch {
            onNext(); // Continue anyway
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Quick Setup</h2>
            <p className="text-hive-text-secondary mb-6">
                Add your OpenAI API key to get started, or skip to use demo mode.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        OpenAI API Key
                        <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-hive-indigo ml-2 hover:underline"
                        >
                            Get one →
                        </a>
                    </label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                    />
                    <p className="text-xs text-hive-text-muted mt-1">
                        Stored securely, never shared.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={loading} className="flex-1">
                        {loading ? 'Saving...' : 'Save & Continue'}
                    </Button>
                    <Button variant="ghost" onClick={onSkip}>
                        Use Demo Mode
                    </Button>
                </div>
            </div>
        </div>
    );
}

function AgentsStep(_props: StepProps) {
    const agents = [
        { name: 'Founder', icon: Lightbulb, color: 'text-yellow-400' },
        { name: 'Designer', icon: Palette, color: 'text-pink-400' },
        { name: 'Builder', icon: Code, color: 'text-blue-400' },
        { name: 'Tester', icon: TestTube, color: 'text-green-400' },
        { name: 'Security', icon: Shield, color: 'text-red-400' },
        { name: 'Planner', icon: ClipboardList, color: 'text-purple-400' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Meet Your AI Team</h2>
            <p className="text-hive-text-secondary mb-6">
                13 specialized agents collaborate to build your software.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {agents.map((agent) => (
                    <motion.div
                        key={agent.name}
                        whileHover={{ scale: 1.05 }}
                        className="p-3 bg-hive-surface rounded-lg text-center"
                    >
                        <agent.icon className={`w-6 h-6 mx-auto mb-1 ${agent.color}`} />
                        <span className="text-sm font-medium">{agent.name}</span>
                    </motion.div>
                ))}
            </div>

            <div className="bg-hive-surface-light p-4 rounded-lg">
                <p className="text-sm">
                    <strong>💡 Tip:</strong> Just describe what you want to build. The agents handle the rest!
                </p>
            </div>
        </div>
    );
}

function TemplatesStep(_props: StepProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const templates = [
        { id: 'landing', icon: '🌐', title: 'Landing Page', desc: 'Modern SaaS page' },
        { id: 'todo', icon: '✅', title: 'Todo App', desc: 'Full-featured app' },
        { id: 'dashboard', icon: '📊', title: 'Dashboard', desc: 'Analytics UI' },
    ];

    const handleSelect = (id: string) => {
        setSelected(id);
        const template = templates.find(t => t.id === id);
        if (template) {
            localStorage.setItem('onboarding-template', id);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Try a Template</h2>
            <p className="text-hive-text-secondary mb-6">
                Pick a starter template or write your own prompt.
            </p>

            <div className="grid grid-cols-3 gap-3">
                {templates.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => handleSelect(t.id)}
                        className={`p-4 rounded-lg text-center transition-all ${selected === t.id
                            ? 'bg-hive-indigo/20 border-2 border-hive-indigo'
                            : 'bg-hive-surface hover:bg-hive-surface-light border-2 border-transparent'
                            }`}
                    >
                        <span className="text-2xl">{t.icon}</span>
                        <h4 className="font-semibold mt-2">{t.title}</h4>
                        <p className="text-xs text-hive-text-muted">{t.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

function CompleteStep(_props: StepProps) {
    return (
        <div className="text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
            <p className="text-hive-text-secondary mb-6">
                Start building with your AI software team.
            </p>

            <div className="text-left space-y-3 mb-6">
                {[
                    'Chat with your team',
                    'Track costs in dashboard',
                    'Configure agents',
                    'Browse plugins',
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-hive-success" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
