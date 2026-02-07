/**
 * Usage-Based Billing System
 * 
 * Stripe integration for:
 * - Customer management
 * - Subscription tiers (Free/Pro/Team/Enterprise)
 * - Usage metering (requests, tokens)
 * - Webhook handling
 */

import Stripe from 'stripe';
import { getDb } from './user-auth.js';
import { randomUUID } from 'crypto';
import { getSecret } from './secrets.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const stripeKey = getSecret('STRIPE_SECRET_KEY');
const stripe = stripeKey
    ? new Stripe(stripeKey)
    : null;

// Pricing configuration (use Stripe Dashboard IDs in production)
export const PRICING_TIERS = {
    free: {
        name: 'Free',
        priceId: process.env.STRIPE_PRICE_FREE || null,
        monthlyRequests: 1000,
        monthlyTokens: 100000,
        price: 0
    },
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRICE_PRO || null,
        monthlyRequests: 10000,
        monthlyTokens: 1000000,
        price: 29
    },
    team: {
        name: 'Team',
        priceId: process.env.STRIPE_PRICE_TEAM || null,
        monthlyRequests: 50000,
        monthlyTokens: 5000000,
        price: 99
    },
    enterprise: {
        name: 'Enterprise',
        priceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
        monthlyRequests: -1, // Unlimited
        monthlyTokens: -1,
        price: -1 // Custom
    }
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// ============================================================================
// TYPES
// ============================================================================

export interface BillingCustomer {
    id: string;
    userId: string;
    stripeCustomerId: string;
    tier: PricingTier;
    subscriptionId?: string | undefined;
    subscriptionStatus?: string | undefined;
    currentPeriodStart?: string | undefined;
    currentPeriodEnd?: string | undefined;
    createdAt: string;
    updatedAt: string;
}

export interface UsageRecord {
    id: string;
    customerId: string;
    type: 'request' | 'token';
    quantity: number;
    timestamp: string;
    metadata?: Record<string, unknown> | undefined;
}

export interface UsageSummary {
    tier: PricingTier;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    requests: {
        used: number;
        limit: number;
        remaining: number;
    };
    tokens: {
        used: number;
        limit: number;
        remaining: number;
    };
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

export function initBillingTables(): void {
    const db = getDb();

    db.exec(`
        CREATE TABLE IF NOT EXISTS billing_customers (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            stripe_customer_id TEXT UNIQUE,
            tier TEXT DEFAULT 'free',
            subscription_id TEXT,
            subscription_status TEXT,
            current_period_start TEXT,
            current_period_end TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS usage_records (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('request', 'token')),
            quantity INTEGER NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (customer_id) REFERENCES billing_customers(id)
        );

        CREATE INDEX IF NOT EXISTS idx_usage_customer ON usage_records(customer_id);
        CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_records(timestamp);
        CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_customers(user_id);
    `);

    console.log('✅ Billing tables initialized');
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Create or get billing customer
 */
export async function getOrCreateCustomer(
    userId: string,
    email: string
): Promise<BillingCustomer> {
    const db = getDb();

    // Check if customer exists
    const existing = db.prepare(`
        SELECT * FROM billing_customers WHERE user_id = ?
    `).get(userId) as {
        id: string;
        user_id: string;
        stripe_customer_id: string;
        tier: PricingTier;
        subscription_id: string | null;
        subscription_status: string | null;
        current_period_start: string | null;
        current_period_end: string | null;
        created_at: string;
        updated_at: string;
    } | undefined;

    if (existing) {
        return {
            id: existing.id,
            userId: existing.user_id,
            stripeCustomerId: existing.stripe_customer_id,
            tier: existing.tier,
            subscriptionId: existing.subscription_id || undefined,
            subscriptionStatus: existing.subscription_status || undefined,
            currentPeriodStart: existing.current_period_start || undefined,
            currentPeriodEnd: existing.current_period_end || undefined,
            createdAt: existing.created_at,
            updatedAt: existing.updated_at
        };
    }

    // Create Stripe customer if available
    let stripeCustomerId: string | null = null;
    if (stripe) {
        const stripeCustomer = await stripe.customers.create({
            email,
            metadata: { userId }
        });
        stripeCustomerId = stripeCustomer.id;
    }

    // Create local customer record
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO billing_customers (id, user_id, stripe_customer_id, tier, created_at, updated_at)
        VALUES (?, ?, ?, 'free', ?, ?)
    `).run(id, userId, stripeCustomerId, now, now);

    return {
        id,
        userId,
        stripeCustomerId: stripeCustomerId || '',
        tier: 'free',
        createdAt: now,
        updatedAt: now
    };
}

/**
 * Get customer by user ID
 */
export function getCustomerByUserId(userId: string): BillingCustomer | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM billing_customers WHERE user_id = ?`).get(userId);
    return row ? mapCustomerRow(row) : null;
}

function mapCustomerRow(row: unknown): BillingCustomer {
    const r = row as {
        id: string;
        user_id: string;
        stripe_customer_id: string;
        tier: PricingTier;
        subscription_id: string | null;
        subscription_status: string | null;
        current_period_start: string | null;
        current_period_end: string | null;
        created_at: string;
        updated_at: string;
    };
    return {
        id: r.id,
        userId: r.user_id,
        stripeCustomerId: r.stripe_customer_id,
        tier: r.tier,
        subscriptionId: r.subscription_id || undefined,
        subscriptionStatus: r.subscription_status || undefined,
        currentPeriodStart: r.current_period_start || undefined,
        currentPeriodEnd: r.current_period_end || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
    customerId: string,
    tier: PricingTier,
    successUrl: string,
    cancelUrl: string
): Promise<{ url: string } | null> {
    if (!stripe) {
        console.warn('Stripe not configured');
        return null;
    }

    const customer = getCustomerById(customerId);
    if (!customer) throw new Error('Customer not found');

    const priceId = PRICING_TIERS[tier].priceId;
    if (!priceId) throw new Error('Price not configured for tier');

    const session = await stripe.checkout.sessions.create({
        customer: customer.stripeCustomerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { customerId, tier }
    });

    return { url: session.url || '' };
}

/**
 * Create billing portal session
 */
export async function createPortalSession(
    customerId: string,
    returnUrl: string
): Promise<{ url: string } | null> {
    if (!stripe) return null;

    const customer = getCustomerById(customerId);
    if (!customer?.stripeCustomerId) throw new Error('Customer not found');

    const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: returnUrl
    });

    return { url: session.url };
}

function getCustomerById(id: string): BillingCustomer | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM billing_customers WHERE id = ?`).get(id);
    return row ? mapCustomerRow(row) : null;
}

// ============================================================================
// USAGE METERING
// ============================================================================

/**
 * Record usage
 */
export function recordUsage(
    customerId: string,
    type: 'request' | 'token',
    quantity: number,
    metadata?: Record<string, unknown>
): void {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO usage_records (id, customer_id, type, quantity, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, customerId, type, quantity, now, metadata ? JSON.stringify(metadata) : null);
}

/**
 * Get usage summary for current period
 */
export function getUsageSummary(userId: string): UsageSummary | null {
    const customer = getCustomerByUserId(userId);
    if (!customer) return null;

    const db = getDb();
    const tier = PRICING_TIERS[customer.tier];

    // Calculate period bounds (current month)
    const now = new Date();
    const periodStart = customer.currentPeriodStart ||
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = customer.currentPeriodEnd ||
        new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Get usage counts
    const requestUsage = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total FROM usage_records
        WHERE customer_id = ? AND type = 'request' AND timestamp >= ? AND timestamp <= ?
    `).get(customer.id, periodStart, periodEnd) as { total: number };

    const tokenUsage = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total FROM usage_records
        WHERE customer_id = ? AND type = 'token' AND timestamp >= ? AND timestamp <= ?
    `).get(customer.id, periodStart, periodEnd) as { total: number };

    return {
        tier: customer.tier,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        requests: {
            used: requestUsage.total,
            limit: tier.monthlyRequests,
            remaining: tier.monthlyRequests === -1 ? -1 : Math.max(0, tier.monthlyRequests - requestUsage.total)
        },
        tokens: {
            used: tokenUsage.total,
            limit: tier.monthlyTokens,
            remaining: tier.monthlyTokens === -1 ? -1 : Math.max(0, tier.monthlyTokens - tokenUsage.total)
        }
    };
}

/**
 * Check if user has exceeded limits
 */
export function hasExceededLimits(userId: string): { exceeded: boolean; type?: 'request' | 'token' } {
    const summary = getUsageSummary(userId);
    if (!summary) return { exceeded: false };

    if (summary.requests.limit !== -1 && summary.requests.remaining <= 0) {
        return { exceeded: true, type: 'request' };
    }
    if (summary.tokens.limit !== -1 && summary.tokens.remaining <= 0) {
        return { exceeded: true, type: 'token' };
    }

    return { exceeded: false };
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

export interface WebhookEvent {
    type: string;
    data: {
        object: unknown;
    };
}

/**
 * Handle Stripe webhook
 */
export async function handleWebhook(event: WebhookEvent): Promise<void> {
    const db = getDb();

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as {
                id: string;
                customer: string;
                status: string;
                current_period_start: number;
                current_period_end: number;
                items: { data: Array<{ price: { id: string } }> };
            };

            // Find tier by price ID
            const priceId = subscription.items.data[0]?.price.id;
            const tier = Object.entries(PRICING_TIERS).find(
                ([, config]) => config.priceId === priceId
            )?.[0] as PricingTier || 'free';

            db.prepare(`
                UPDATE billing_customers SET
                    subscription_id = ?,
                    subscription_status = ?,
                    tier = ?,
                    current_period_start = ?,
                    current_period_end = ?,
                    updated_at = ?
                WHERE stripe_customer_id = ?
            `).run(
                subscription.id,
                subscription.status,
                tier,
                new Date(subscription.current_period_start * 1000).toISOString(),
                new Date(subscription.current_period_end * 1000).toISOString(),
                new Date().toISOString(),
                subscription.customer
            );
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as { customer: string };

            db.prepare(`
                UPDATE billing_customers SET
                    subscription_id = NULL,
                    subscription_status = 'canceled',
                    tier = 'free',
                    updated_at = ?
                WHERE stripe_customer_id = ?
            `).run(new Date().toISOString(), subscription.customer);
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as { customer: string };
            console.log(`✅ Invoice paid for customer ${invoice.customer}`);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as { customer: string };
            console.warn(`⚠️ Payment failed for customer ${invoice.customer}`);
            break;
        }
    }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string
): WebhookEvent | null {
    const webhookSecret = getSecret('STRIPE_WEBHOOK_SECRET');
    if (!stripe || !webhookSecret) {
        console.warn('Stripe webhook verification not configured');
        return null;
    }

    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        ) as WebhookEvent;
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return null;
    }
}

/**
 * Check if billing is enabled
 */
export function isBillingEnabled(): boolean {
    return !!stripe;
}
