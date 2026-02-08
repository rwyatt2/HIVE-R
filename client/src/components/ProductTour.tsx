import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';


const tourSteps: Step[] = [
    {
        target: '[data-tour="chat-input"]',
        content: 'Start here! Describe what you want to build in natural language.',
        disableBeacon: true,
        placement: 'top',
    },
    {
        target: '[data-tour="agent-graph"]',
        content: 'Watch your agents collaborate in real-time. See which agent is working and track handoffs.',
        placement: 'left',
    },
    {
        target: '[data-tour="nav-dashboard"]',
        content: 'View your costs, usage stats, and project history.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="nav-settings"]',
        content: 'Configure your API keys, agents, and preferences.',
        placement: 'bottom',
    },
];

export function ProductTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        const tourCompleted = localStorage.getItem('product-tour-completed');
        const onboardingCompleted = localStorage.getItem('onboarding-completed');

        if (onboardingCompleted && !tourCompleted) {
            // Start tour after a delay
            const timer = setTimeout(() => setRun(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleCallback = (data: CallBackProps) => {
        const { status } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            localStorage.setItem('product-tour-completed', 'true');
        }
    };

    return (
        <Joyride
            steps={tourSteps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleCallback}
            styles={{
                options: {
                    primaryColor: '#6366f1',
                    zIndex: 10000,
                    arrowColor: '#1e293b',
                    backgroundColor: '#1e293b',
                    textColor: '#f1f5f9',
                    overlayColor: 'rgba(15, 23, 42, 0.8)',
                },
                tooltip: {
                    borderRadius: 12,
                    fontSize: 14,
                },
                buttonNext: {
                    backgroundColor: '#6366f1',
                    borderRadius: 8,
                    padding: '8px 16px',
                },
                buttonBack: {
                    color: '#94a3b8',
                },
                buttonSkip: {
                    color: '#64748b',
                },
            }}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Done',
                next: 'Next',
                skip: 'Skip tour',
            }}
        />
    );
}

export function useTour() {
    const startTour = () => {
        localStorage.removeItem('product-tour-completed');
        window.location.reload();
    };

    const isTourCompleted = () => {
        return localStorage.getItem('product-tour-completed') === 'true';
    };

    return { startTour, isTourCompleted };
}
