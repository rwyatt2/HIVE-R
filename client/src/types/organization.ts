/**
 * Organization Types
 */

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Organization {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    memberCount: number;
}

export interface Member {
    id: string;
    email: string;
    name: string | null;
    role: MemberRole;
    joinedAt: string;
    lastActive: string | null;
    avatarUrl: string | null;
}

export interface Invitation {
    id: string;
    email: string;
    role: MemberRole;
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'expired';
}

export interface MemberUsage {
    memberId: string;
    memberName: string;
    requests: number;
    tokens: number;
    cost: number;
}
