/**
 * Organization Hook
 * 
 * API integration for organization, members, and invitations.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Organization, Member, Invitation, MemberRole } from '../types/organization';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mock data for development
const MOCK_ORG: Organization = {
    id: 'org_demo',
    name: 'Demo Organization',
    ownerId: 'user_1',
    createdAt: '2026-01-15T00:00:00Z',
    memberCount: 3,
};

const MOCK_MEMBERS: Member[] = [
    { id: 'user_1', email: 'owner@demo.com', name: 'Demo Owner', role: 'owner', joinedAt: '2026-01-15T00:00:00Z', lastActive: '2026-02-08T10:00:00Z', avatarUrl: null },
    { id: 'user_2', email: 'admin@demo.com', name: 'Demo Admin', role: 'admin', joinedAt: '2026-01-20T00:00:00Z', lastActive: '2026-02-07T15:00:00Z', avatarUrl: null },
    { id: 'user_3', email: 'member@demo.com', name: 'Demo Member', role: 'member', joinedAt: '2026-02-01T00:00:00Z', lastActive: '2026-02-06T09:00:00Z', avatarUrl: null },
];

const MOCK_INVITATIONS: Invitation[] = [
    { id: 'inv_1', email: 'pending@demo.com', role: 'member', invitedBy: 'owner@demo.com', invitedAt: '2026-02-05T00:00:00Z', expiresAt: '2026-02-12T00:00:00Z', status: 'pending' },
];

export function useOrganization() {
    const { getAccessToken, isAuthenticated } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrgData = useCallback(async () => {
        if (!isAuthenticated) {
            // Use mock data in demo mode
            setOrganization(MOCK_ORG);
            setMembers(MOCK_MEMBERS);
            setInvitations(MOCK_INVITATIONS);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = getAccessToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [orgRes, membersRes, invRes] = await Promise.all([
                fetch(`${API_BASE}/organizations/current`, { headers }),
                fetch(`${API_BASE}/organizations/members`, { headers }),
                fetch(`${API_BASE}/organizations/invitations`, { headers }),
            ]);

            if (orgRes.ok) setOrganization(await orgRes.json());
            if (membersRes.ok) setMembers((await membersRes.json()).members || []);
            if (invRes.ok) setInvitations((await invRes.json()).invitations || []);
        } catch (err) {
            console.error('Failed to fetch org data:', err);
            setError('Failed to load organization');
            // Fall back to mock data
            setOrganization(MOCK_ORG);
            setMembers(MOCK_MEMBERS);
            setInvitations(MOCK_INVITATIONS);
        }

        setIsLoading(false);
    }, [isAuthenticated, getAccessToken]);

    useEffect(() => {
        fetchOrgData();
    }, [fetchOrgData]);

    const inviteMember = async (email: string, role: MemberRole = 'member') => {
        if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/organizations/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, role }),
            });

            if (response.ok) {
                await fetchOrgData();
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Invite failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    const removeMember = async (memberId: string) => {
        if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/organizations/members/${memberId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                await fetchOrgData();
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Remove failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    const updateRole = async (memberId: string, role: MemberRole) => {
        if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/organizations/members/${memberId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });

            if (response.ok) {
                await fetchOrgData();
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Update failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    const revokeInvitation = async (invitationId: string) => {
        if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/organizations/invitations/${invitationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                await fetchOrgData();
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Revoke failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    return {
        organization,
        members,
        invitations,
        isLoading,
        error,
        inviteMember,
        removeMember,
        updateRole,
        revokeInvitation,
        refresh: fetchOrgData,
    };
}
