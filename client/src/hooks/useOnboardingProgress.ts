import { useState, useEffect, useCallback } from 'react';

interface OnboardingProgress {
    wizardCompleted: boolean;
    wizardSkipped: boolean;
    tourCompleted: boolean;
    firstPromptSent: boolean;
    dashboardViewed: boolean;
    settingsViewed: boolean;
}

const defaultProgress: OnboardingProgress = {
    wizardCompleted: false,
    wizardSkipped: false,
    tourCompleted: false,
    firstPromptSent: false,
    dashboardViewed: false,
    settingsViewed: false,
};

const STORAGE_KEY = 'hive-onboarding-progress';

export function useOnboardingProgress() {
    const [progress, setProgress] = useState<OnboardingProgress>(defaultProgress);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setProgress({ ...defaultProgress, ...JSON.parse(saved) });
            } catch {
                // Invalid JSON, use defaults
            }
        }

        // Also check legacy keys
        if (localStorage.getItem('onboarding-completed') === 'true') {
            setProgress(prev => ({ ...prev, wizardCompleted: true }));
        }
        if (localStorage.getItem('onboarding-skipped') === 'true') {
            setProgress(prev => ({ ...prev, wizardSkipped: true }));
        }
        if (localStorage.getItem('product-tour-completed') === 'true') {
            setProgress(prev => ({ ...prev, tourCompleted: true }));
        }
    }, []);

    const updateProgress = useCallback((key: keyof OnboardingProgress, value: boolean) => {
        setProgress(prev => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const resetProgress = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('onboarding-completed');
        localStorage.removeItem('onboarding-skipped');
        localStorage.removeItem('product-tour-completed');
        setProgress(defaultProgress);
    }, []);

    const completedSteps = Object.values(progress).filter(Boolean).length;
    const totalSteps = Object.keys(progress).length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    const shouldShowOnboarding = !progress.wizardCompleted && !progress.wizardSkipped;
    const shouldShowTour = (progress.wizardCompleted || progress.wizardSkipped) && !progress.tourCompleted;

    return {
        progress,
        updateProgress,
        resetProgress,
        progressPercentage,
        completedSteps,
        totalSteps,
        shouldShowOnboarding,
        shouldShowTour,
        isComplete: completedSteps === totalSteps,
    };
}
