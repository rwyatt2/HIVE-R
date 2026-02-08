/**
 * Billing Types
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionLimits {
    requests: number;
    tokensPerMonth: number;
    members: number;
}

export interface TierInfo {
    id: SubscriptionTier;
    name: string;
    price: number | null;
    limits: SubscriptionLimits;
    features: string[];
}

export interface Subscription {
    tier: SubscriptionTier;
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
}

export interface UsageMetrics {
    requests: {
        used: number;
        limit: number;
    };
    tokens: {
        used: number;
        limit: number;
    };
    cost: {
        current: number;
        budget: number | null;
    };
    periodStart: string;
    periodEnd: string;
}

export interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    date: string;
    pdfUrl: string | null;
}

export interface PaymentMethod {
    id: string;
    type: 'card';
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

// Subscription tier definitions
export const SUBSCRIPTION_TIERS: TierInfo[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        limits: {
            requests: 100,
            tokensPerMonth: 50000,
            members: 1,
        },
        features: [
            'Basic agents',
            'Limited history',
            'Community support',
        ],
    },
    {
        id: 'pro',
        name: 'Professional',
        price: 29,
        limits: {
            requests: 1000,
            tokensPerMonth: 1000000,
            members: 5,
        },
        features: [
            'All agents',
            'Unlimited history',
            'Priority support',
            'Custom agents',
            'Advanced analytics',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        limits: {
            requests: -1,
            tokensPerMonth: -1,
            members: -1,
        },
        features: [
            'Everything in Pro',
            'Custom SLA',
            'Dedicated support',
            'On-premise deployment',
            'SSO integration',
        ],
    },
];
