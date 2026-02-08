/**
 * Billing Hook
 * 
 * API integration for subscription, usage, and invoices.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Subscription, UsageMetrics, Invoice, PaymentMethod } from '../types/billing';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mock data for development
const MOCK_SUBSCRIPTION: Subscription = {
    tier: 'pro',
    status: 'active',
    currentPeriodStart: '2026-02-01T00:00:00Z',
    currentPeriodEnd: '2026-03-01T00:00:00Z',
    cancelAtPeriodEnd: false,
};

const MOCK_USAGE: UsageMetrics = {
    requests: { used: 742, limit: 1000 },
    tokens: { used: 680000, limit: 1000000 },
    cost: { current: 18.45, budget: 50 },
    periodStart: '2026-02-01T00:00:00Z',
    periodEnd: '2026-03-01T00:00:00Z',
};

const MOCK_INVOICES: Invoice[] = [
    { id: 'inv_1', amount: 29, currency: 'usd', status: 'paid', date: '2026-02-01', pdfUrl: null },
    { id: 'inv_2', amount: 29, currency: 'usd', status: 'paid', date: '2026-01-01', pdfUrl: null },
    { id: 'inv_3', amount: 29, currency: 'usd', status: 'paid', date: '2025-12-01', pdfUrl: null },
];

export function useBilling() {
    const { getAccessToken, isAuthenticated } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageMetrics | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBillingData = useCallback(async () => {
        if (!isAuthenticated) {
            // Use mock data in demo mode
            setSubscription(MOCK_SUBSCRIPTION);
            setUsage(MOCK_USAGE);
            setInvoices(MOCK_INVOICES);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = getAccessToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [subRes, usageRes, invRes] = await Promise.all([
                fetch(`${API_BASE}/billing/subscription`, { headers }),
                fetch(`${API_BASE}/billing/usage`, { headers }),
                fetch(`${API_BASE}/billing/invoices`, { headers }),
            ]);

            if (subRes.ok) setSubscription(await subRes.json());
            if (usageRes.ok) setUsage(await usageRes.json());
            if (invRes.ok) setInvoices((await invRes.json()).invoices || []);
        } catch (err) {
            console.error('Failed to fetch billing data:', err);
            setError('Failed to load billing information');
            // Fall back to mock data
            setSubscription(MOCK_SUBSCRIPTION);
            setUsage(MOCK_USAGE);
            setInvoices(MOCK_INVOICES);
        }

        setIsLoading(false);
    }, [isAuthenticated, getAccessToken]);

    useEffect(() => {
        fetchBillingData();
    }, [fetchBillingData]);

    const upgrade = async (tier: string) => {
        if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/billing/upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tier }),
            });

            if (response.ok) {
                await fetchBillingData();
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Upgrade failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    const downgrade = async (tier: string) => {
        if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/billing/downgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tier }),
            });

            if (response.ok) {
                await fetchBillingData();
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Downgrade failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    return {
        subscription,
        usage,
        invoices,
        paymentMethods,
        isLoading,
        error,
        upgrade,
        downgrade,
        refresh: fetchBillingData,
    };
}
