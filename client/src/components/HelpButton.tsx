import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ExternalLink } from 'lucide-react';

interface HelpButtonProps {
    topic: string;
    content: string;
    learnMoreUrl?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const helpContent: Record<string, { content: string; url?: string }> = {
    'api-keys': {
        content: 'Your OpenAI API key is used to power the AI agents. It\'s stored securely and never shared.',
        url: 'https://platform.openai.com/api-keys',
    },
    'agents': {
        content: 'HIVE-R uses 13 specialized agents that collaborate to build software. Each agent has a specific role.',
    },
    'cost-tracking': {
        content: 'HIVE-R tracks all API costs in real-time. You can set budgets and alerts in settings.',
    },
    'model-selection': {
        content: 'Choose different models for each agent. GPT-4o is most capable, GPT-4o-mini is more cost-effective.',
    },
};

export function HelpButton({ topic, content, learnMoreUrl, position = 'bottom' }: HelpButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const topicData = helpContent[topic];
    const displayContent = content || topicData?.content || 'No help available.';
    const displayUrl = learnMoreUrl || topicData?.url;

    const positionClasses = {
        top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-hive-text-muted hover:text-hive-text-secondary transition-colors"
                aria-label="Help"
            >
                <HelpCircle className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Tooltip */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute z-50 w-64 p-3 bg-hive-surface border border-hive-border rounded-lg shadow-lg ${positionClasses[position]}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-hive-text-muted uppercase tracking-wide">Help</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-hive-text-muted hover:text-hive-text-secondary"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            <p className="text-sm text-hive-text-secondary mb-2">
                                {displayContent}
                            </p>

                            {displayUrl && (
                                <a
                                    href={displayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-hive-indigo hover:underline"
                                >
                                    Learn more
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
