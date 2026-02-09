/**
 * Organization Page
 * 
 * Organization settings, member management, and invitations.
 */

import { useState } from 'react';
import { Users, UserPlus, Shield, Crown, Mail, Trash2, Clock, X, AlertCircle } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import type { MemberRole } from '../types/organization';

// ─── Role Badge Component ───────────────────────────────────────────────────
function RoleBadge({ role }: { role: MemberRole }) {
    const config = {
        owner: { icon: Crown, label: 'Owner', class: 'bg-honey/10 text-honey border-honey/20' },
        admin: { icon: Shield, label: 'Admin', class: 'bg-electric-violet/10 text-electric-violet border-electric-violet/20' },
        member: { icon: Users, label: 'Member', class: 'bg-starlight-400/10 text-starlight-400 border-starlight-400/20' },
    }[role];

    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${config.class}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
}

// ─── Invite Modal Component ─────────────────────────────────────────────────
function InviteModal({ onClose, onInvite }: {
    onClose: () => void;
    onInvite: (email: string, role: MemberRole) => Promise<{ success: boolean; error?: string }>;
}) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<MemberRole>('member');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setError(null);

        const result = await onInvite(email.trim(), role);
        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Failed to send invitation');
        }

        setIsLoading(false);
    };

    return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-void-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
                    <button onClick={onClose} className="p-1 text-starlight-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="invite-email" className="block text-sm font-medium text-starlight-400 mb-2">
                            Email Address
                        </label>
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full h-12 px-4 bg-void-800/60 border border-white/10 rounded-lg text-white placeholder:text-starlight-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="invite-role" className="block text-sm font-medium text-starlight-400 mb-2">
                            Role
                        </label>
                        <select
                            id="invite-role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as MemberRole)}
                            className="w-full h-12 px-4 bg-void-800/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/30"
                        >
                            <option value="member">Member - Can use agents</option>
                            <option value="admin">Admin - Can manage members</option>
                        </select>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-reactor-red bg-reactor-red/10 p-3 rounded-lg border border-reactor-red/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm text-starlight-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !email.trim()}
                            className="flex-1 py-2.5 bg-linear-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Mail className="w-5 h-5" />
                                    Send Invitation
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function OrganizationPage() {
    const { organization, members, invitations, isLoading, inviteMember, removeMember, revokeInvitation } = useOrganization();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Remove this member from the organization?')) return;
        setActionLoading(memberId);
        await removeMember(memberId);
        setActionLoading(null);
    };

    const handleRevokeInvitation = async (invitationId: string) => {
        setActionLoading(invitationId);
        await revokeInvitation(invitationId);
        setActionLoading(null);
    };

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
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Organization</h1>
                        <p className="text-starlight-400">Manage your team and permissions</p>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300"
                    >
                        <UserPlus className="w-5 h-5" />
                        Invite Member
                    </button>
                </div>

                {/* Org Details */}
                <div className="bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-electric-violet/10 border border-electric-violet/20 flex items-center justify-center">
                            <Users className="w-8 h-8 text-electric-violet" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{organization?.name || 'My Organization'}</h2>
                            <p className="text-sm text-starlight-400">
                                {organization?.memberCount || members.length} member{members.length !== 1 ? 's' : ''}
                                {' · '}
                                Created {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'recently'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-white/6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-cyber-cyan" />
                            </div>
                            <h2 className="text-sm font-semibold text-white">Team Members</h2>
                        </div>
                        <span className="text-xs text-starlight-400">{members.length} members</span>
                    </div>

                    <div className="divide-y divide-white/4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-white/2 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-electric-violet to-cyber-cyan flex items-center justify-center text-white font-medium">
                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">{member.name || member.email}</span>
                                            <RoleBadge role={member.role} />
                                        </div>
                                        <span className="text-xs text-starlight-400">{member.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-starlight-400">
                                        {member.lastActive
                                            ? `Active ${new Date(member.lastActive).toLocaleDateString()}`
                                            : 'Never active'}
                                    </span>
                                    {member.role !== 'owner' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            disabled={actionLoading === member.id}
                                            className="p-2 text-starlight-400 hover:text-reactor-red hover:bg-reactor-red/10 rounded-lg transition-colors disabled:opacity-50"
                                            aria-label="Remove member"
                                        >
                                            {actionLoading === member.id ? (
                                                <div className="w-4 h-4 border-2 border-starlight-400/30 border-t-starlight-400 rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-white/6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-honey/10 border border-honey/20 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-honey" />
                                </div>
                                <h2 className="text-sm font-semibold text-white">Pending Invitations</h2>
                            </div>
                            <span className="px-2 py-0.5 text-xs font-medium bg-honey/10 text-honey border border-honey/20 rounded-full">
                                {invitations.length} pending
                            </span>
                        </div>

                        <div className="divide-y divide-white/4">
                            {invitations.map(invitation => (
                                <div key={invitation.id} className="flex items-center justify-between p-4 hover:bg-white/2 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-starlight-400/10 border border-dashed border-starlight-400/30 flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-starlight-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">{invitation.email}</span>
                                                <RoleBadge role={invitation.role} />
                                            </div>
                                            <span className="text-xs text-starlight-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRevokeInvitation(invitation.id)}
                                        disabled={actionLoading === invitation.id}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-starlight-400 hover:text-reactor-red hover:bg-reactor-red/10 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === invitation.id ? (
                                            <div className="w-3 h-3 border-2 border-starlight-400/30 border-t-starlight-400 rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <X className="w-3 h-3" />
                                                Revoke
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteModal
                    onClose={() => setShowInviteModal(false)}
                    onInvite={inviteMember}
                />
            )}
        </div>
    );
}
