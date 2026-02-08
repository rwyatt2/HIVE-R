/**
 * Billing Page
 * 
 * Subscription management, usage metrics, and billing history.
 */

import { useState } from 'react';
import { CreditCard, Zap, FileText, AlertTriangle, Check, Crown, ArrowRight, Download, Clock, DollarSign } from 'lucide-react';
import { useBilling } from '../hooks/useBilling';
import { SUBSCRIPTION_TIERS } from '../types/billing';

// ─── Usage Bar Component ────────────────────────────────────────────────────
function UsageBar({ label, used, limit, icon: Icon }: {
    label: string;
    used: number;
    limit: number;
    icon: typeof Zap;
}) {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isWarning = percentage >= 80;
    const isCritical = percentage >= 95;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-starlight-400">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </div>
                <span className="text-sm font-mono text-white">
                    {used.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
                </span>
            </div>
            <div className="h-2 bg-void-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isCritical
                        ? 'bg-reactor-red'
                        : isWarning
                            ? 'bg-honey'
                            : 'bg-linear-to-r from-cyber-cyan to-electric-violet'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isWarning && !isCritical && (
                <div className="flex items-center gap-1 text-xs text-honey">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Approaching limit ({percentage.toFixed(0)}%)</span>
                </div>
            )}
            {isCritical && (
                <div className="flex items-center gap-1 text-xs text-reactor-red">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Near limit! Consider upgrading</span>
                </div>
            )}
        </div>
    );
}

// ─── Tier Card Component ────────────────────────────────────────────────────
function TierCard({ tier, isCurrent, onSelect }: {
    tier: typeof SUBSCRIPTION_TIERS[0];
    isCurrent: boolean;
    onSelect: () => void;
}) {
    const isPro = tier.id === 'pro';

    return (
        <div className={`relative p-6 rounded-2xl border transition-all ${isCurrent
            ? 'bg-electric-violet/10 border-electric-violet/30'
            : 'bg-void-900/40 border-white/6 hover:border-white/12'
            }`}>
            {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-electric-violet text-white text-xs font-medium rounded-full">
                    Popular
                </div>
            )}

            <div className="flex items-center gap-2 mb-4">
                {tier.id === 'enterprise' && <Crown className="w-5 h-5 text-honey" />}
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
            </div>

            <div className="mb-6">
                {tier.price !== null ? (
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">${tier.price}</span>
                        <span className="text-starlight-400">/month</span>
                    </div>
                ) : (
                    <span className="text-xl font-bold text-white">Custom Pricing</span>
                )}
            </div>

            <ul className="space-y-2 mb-6">
                {tier.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-starlight-400">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                onClick={onSelect}
                disabled={isCurrent}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isCurrent
                    ? 'bg-white/10 text-starlight-400 cursor-default'
                    : isPro
                        ? 'bg-linear-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
            >
                {isCurrent ? 'Current Plan' : tier.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                {!isCurrent && <ArrowRight className="w-4 h-4" />}
            </button>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function BillingPage() {
    const { subscription, usage, invoices, isLoading } = useBilling();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const currentTier = SUBSCRIPTION_TIERS.find(t => t.id === subscription?.tier) || SUBSCRIPTION_TIERS[0];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-void-950 pt-24 px-6 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-void-950 pt-24 pb-16 px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Billing & Usage</h1>
                    <p className="text-starlight-400">Manage your subscription and monitor usage</p>
                </div>

                {/* Current Plan + Usage Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Current Plan Card */}
                    <div className="bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-electric-violet/10 border border-electric-violet/20 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-electric-violet" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-white">Current Plan</h2>
                                    <p className="text-xs text-starlight-400">
                                        {subscription?.status === 'active' ? 'Active' : subscription?.status}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="px-4 py-2 text-xs font-semibold bg-white/4 text-starlight-400 border border-white/10 rounded-lg hover:text-white hover:bg-white/8 transition-colors"
                            >
                                Change Plan
                            </button>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-2xl font-bold text-white">{currentTier.name}</span>
                            {currentTier.price !== null && (
                                <span className="text-starlight-400">${currentTier.price}/mo</span>
                            )}
                        </div>

                        <ul className="space-y-2">
                            {currentTier.features.slice(0, 3).map(feature => (
                                <li key={feature} className="flex items-center gap-2 text-sm text-starlight-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Usage Metrics Card */}
                    <div className="bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-cyber-cyan" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white">Usage This Period</h2>
                                <p className="text-xs text-starlight-400">
                                    Resets {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : 'monthly'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {usage && (
                                <>
                                    <UsageBar
                                        icon={Zap}
                                        label="API Requests"
                                        used={usage.requests.used}
                                        limit={usage.requests.limit}
                                    />
                                    <UsageBar
                                        icon={FileText}
                                        label="Tokens"
                                        used={usage.tokens.used}
                                        limit={usage.tokens.limit}
                                    />
                                    <div className="flex items-center justify-between pt-2 border-t border-white/6">
                                        <div className="flex items-center gap-2 text-sm text-starlight-400">
                                            <DollarSign className="w-4 h-4" />
                                            <span>Cost This Period</span>
                                        </div>
                                        <span className="text-lg font-bold text-white">
                                            ${usage.cost.current.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Billing History */}
                <div className="bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-white/6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-honey/10 border border-honey/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-honey" />
                            </div>
                            <h2 className="text-sm font-semibold text-white">Billing History</h2>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/4">
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Date</th>
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Amount</th>
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Status</th>
                                    <th className="text-left text-xs font-medium text-starlight-400 uppercase tracking-wider px-6 py-3">Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length > 0 ? (
                                    invoices.map(invoice => (
                                        <tr key={invoice.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                                            <td className="px-6 py-4 text-sm text-white">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-starlight-400" />
                                                    {new Date(invoice.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-white">
                                                ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status === 'paid'
                                                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                                    : invoice.status === 'pending'
                                                        ? 'bg-honey/10 text-honey border border-honey/20'
                                                        : 'bg-reactor-red/10 text-reactor-red border border-reactor-red/20'
                                                    }`}>
                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="flex items-center gap-1 text-sm text-electric-violet hover:text-electric-indigo transition-colors">
                                                    <Download className="w-4 h-4" />
                                                    PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-starlight-400">
                                            No billing history yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upgrade Modal */}
                {showUpgradeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-void-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
                            <p className="text-starlight-400 mb-8">Select the plan that best fits your needs</p>

                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                {SUBSCRIPTION_TIERS.map(tier => (
                                    <TierCard
                                        key={tier.id}
                                        tier={tier}
                                        isCurrent={tier.id === subscription?.tier}
                                        onSelect={() => {
                                            if (tier.id === 'enterprise') {
                                                window.open('mailto:sales@hive-r.ai', '_blank');
                                            } else {
                                                // Handle upgrade
                                                console.log('Upgrade to:', tier.id);
                                            }
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="px-4 py-2 text-sm text-starlight-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
