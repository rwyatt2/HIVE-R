/**
 * Multi-User Organizations System
 * 
 * Team workspaces with role-based access control:
 * - Organizations (workspaces)
 * - Member management
 * - Role-based permissions (owner/admin/member)
 */

import { getDb } from './user-auth.js';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export type OrgRole = 'owner' | 'admin' | 'member';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    plan: 'free' | 'pro' | 'team' | 'enterprise';
    settings: OrgSettings;
    createdAt: string;
    updatedAt: string;
}

export interface OrgSettings {
    allowMemberInvites: boolean;
    maxMembers: number;
    maxProjects: number;
}

export interface OrgMember {
    orgId: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: OrgRole;
    invitedBy: string | null;
    invitedAt: string | null;
    joinedAt: string;
}

export interface OrgInvite {
    id: string;
    orgId: string;
    email: string;
    role: OrgRole;
    invitedBy: string;
    expiresAt: string;
    createdAt: string;
}

export interface Project {
    id: string;
    orgId: string;
    name: string;
    description?: string | undefined;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// Plan limits
const PLAN_LIMITS: Record<Organization['plan'], { maxMembers: number; maxProjects: number }> = {
    free: { maxMembers: 3, maxProjects: 2 },
    pro: { maxMembers: 10, maxProjects: 10 },
    team: { maxMembers: 50, maxProjects: 50 },
    enterprise: { maxMembers: 1000, maxProjects: 1000 }
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

export function initOrgTables(): void {
    const db = getDb();

    db.exec(`
        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            owner_id TEXT NOT NULL,
            plan TEXT DEFAULT 'free',
            settings TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS org_members (
            org_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'member')),
            invited_by TEXT,
            invited_at TEXT,
            joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (org_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS org_invites (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
            invited_by TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(org_id, email)
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_by TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);
        CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);
    `);

    console.log('✅ Organization tables initialized');
}

// ============================================================================
// ORGANIZATION CRUD
// ============================================================================

/**
 * Create a new organization
 */
export function createOrganization(
    name: string,
    ownerId: string,
    ownerName: string,
    ownerEmail: string
): Organization {
    const db = getDb();
    const id = randomUUID();
    const slug = generateSlug(name);
    const now = new Date().toISOString();
    const limits = PLAN_LIMITS.free;

    const settings: OrgSettings = {
        allowMemberInvites: false,
        maxMembers: limits.maxMembers,
        maxProjects: limits.maxProjects
    };

    // Create organization
    db.prepare(`
        INSERT INTO organizations (id, name, slug, owner_id, plan, settings, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'free', ?, ?, ?)
    `).run(id, name, slug, ownerId, JSON.stringify(settings), now, now);

    // Add owner as member
    db.prepare(`
        INSERT INTO org_members (org_id, user_id, role, joined_at)
        VALUES (?, ?, 'owner', ?)
    `).run(id, ownerId, now);

    return getOrganization(id)!;
}

/**
 * Get organization by ID
 */
export function getOrganization(id: string): Organization | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM organizations WHERE id = ?`).get(id) as {
        id: string;
        name: string;
        slug: string;
        owner_id: string;
        plan: Organization['plan'];
        settings: string;
        created_at: string;
        updated_at: string;
    } | undefined;

    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        ownerId: row.owner_id,
        plan: row.plan,
        settings: JSON.parse(row.settings),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Get organization by slug
 */
export function getOrganizationBySlug(slug: string): Organization | null {
    const db = getDb();
    const row = db.prepare(`SELECT id FROM organizations WHERE slug = ?`).get(slug) as { id: string } | undefined;
    return row ? getOrganization(row.id) : null;
}

/**
 * Update organization
 */
export function updateOrganization(
    id: string,
    updates: { name?: string; settings?: Partial<OrgSettings> }
): Organization | null {
    const db = getDb();
    const org = getOrganization(id);
    if (!org) return null;

    const newName = updates.name || org.name;
    const newSettings = { ...org.settings, ...updates.settings };
    const now = new Date().toISOString();

    db.prepare(`
        UPDATE organizations SET name = ?, settings = ?, updated_at = ? WHERE id = ?
    `).run(newName, JSON.stringify(newSettings), now, id);

    return getOrganization(id);
}

/**
 * Delete organization
 */
export function deleteOrganization(id: string): boolean {
    const db = getDb();

    // Delete all related data
    db.prepare(`DELETE FROM org_invites WHERE org_id = ?`).run(id);
    db.prepare(`DELETE FROM org_members WHERE org_id = ?`).run(id);
    db.prepare(`DELETE FROM projects WHERE org_id = ?`).run(id);
    db.prepare(`DELETE FROM organizations WHERE id = ?`).run(id);

    return true;
}

/**
 * Get user's organizations
 */
export function getUserOrganizations(userId: string): (Organization & { role: OrgRole })[] {
    const db = getDb();
    const rows = db.prepare(`
        SELECT o.*, m.role FROM organizations o
        JOIN org_members m ON o.id = m.org_id
        WHERE m.user_id = ?
        ORDER BY o.name
    `).all(userId) as Array<{
        id: string;
        name: string;
        slug: string;
        owner_id: string;
        plan: Organization['plan'];
        settings: string;
        created_at: string;
        updated_at: string;
        role: OrgRole;
    }>;

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        ownerId: row.owner_id,
        plan: row.plan,
        settings: JSON.parse(row.settings),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        role: row.role
    }));
}

// ============================================================================
// MEMBER MANAGEMENT
// ============================================================================

/**
 * Get organization members
 */
export function getOrgMembers(orgId: string): OrgMember[] {
    const db = getDb();
    const rows = db.prepare(`
        SELECT m.*, u.email, u.email as user_name FROM org_members m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.org_id = ?
        ORDER BY m.role, m.joined_at
    `).all(orgId) as Array<{
        org_id: string;
        user_id: string;
        role: OrgRole;
        invited_by: string | null;
        invited_at: string | null;
        joined_at: string;
        email: string;
        user_name: string;
    }>;

    return rows.map(row => ({
        orgId: row.org_id,
        userId: row.user_id,
        userName: row.user_name || 'Unknown',
        userEmail: row.email || '',
        role: row.role,
        invitedBy: row.invited_by,
        invitedAt: row.invited_at,
        joinedAt: row.joined_at
    }));
}

/**
 * Get member role in organization
 */
export function getMemberRole(orgId: string, userId: string): OrgRole | null {
    const db = getDb();
    const row = db.prepare(`
        SELECT role FROM org_members WHERE org_id = ? AND user_id = ?
    `).get(orgId, userId) as { role: OrgRole } | undefined;

    return row?.role || null;
}

/**
 * Add member to organization
 */
export function addMember(
    orgId: string,
    userId: string,
    role: OrgRole,
    invitedBy?: string
): boolean {
    const db = getDb();
    const org = getOrganization(orgId);
    if (!org) return false;

    // Check member limit
    const members = getOrgMembers(orgId);
    if (members.length >= org.settings.maxMembers) {
        throw new Error('Organization has reached member limit');
    }

    const now = new Date().toISOString();

    db.prepare(`
        INSERT OR REPLACE INTO org_members (org_id, user_id, role, invited_by, invited_at, joined_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(orgId, userId, role, invitedBy || null, invitedBy ? now : null, now);

    return true;
}

/**
 * Update member role
 */
export function updateMemberRole(orgId: string, userId: string, newRole: OrgRole): boolean {
    const db = getDb();

    // Cannot change owner role
    const currentRole = getMemberRole(orgId, userId);
    if (currentRole === 'owner') {
        throw new Error('Cannot change owner role');
    }

    db.prepare(`
        UPDATE org_members SET role = ? WHERE org_id = ? AND user_id = ?
    `).run(newRole, orgId, userId);

    return true;
}

/**
 * Remove member from organization
 */
export function removeMember(orgId: string, userId: string): boolean {
    const db = getDb();

    // Cannot remove owner
    const role = getMemberRole(orgId, userId);
    if (role === 'owner') {
        throw new Error('Cannot remove organization owner');
    }

    db.prepare(`DELETE FROM org_members WHERE org_id = ? AND user_id = ?`).run(orgId, userId);
    return true;
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Create invitation
 */
export function createInvite(
    orgId: string,
    email: string,
    role: 'admin' | 'member',
    invitedBy: string
): OrgInvite {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(`
        INSERT INTO org_invites (id, org_id, email, role, invited_by, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, orgId, email.toLowerCase(), role, invitedBy, expiresAt, now);

    return { id, orgId, email: email.toLowerCase(), role, invitedBy, expiresAt, createdAt: now };
}

/**
 * Accept invitation
 */
export function acceptInvite(inviteId: string, userId: string): boolean {
    const db = getDb();
    const invite = db.prepare(`SELECT * FROM org_invites WHERE id = ?`).get(inviteId) as {
        org_id: string;
        role: OrgRole;
        invited_by: string;
        expires_at: string;
    } | undefined;

    if (!invite) {
        throw new Error('Invitation not found');
    }

    if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
    }

    // Add member
    addMember(invite.org_id, userId, invite.role, invite.invited_by);

    // Delete invite
    db.prepare(`DELETE FROM org_invites WHERE id = ?`).run(inviteId);

    return true;
}

/**
 * Get pending invites for organization
 */
export function getOrgInvites(orgId: string): OrgInvite[] {
    const db = getDb();
    const rows = db.prepare(`
        SELECT * FROM org_invites WHERE org_id = ? AND expires_at > datetime('now')
    `).all(orgId) as Array<{
        id: string;
        org_id: string;
        email: string;
        role: OrgRole;
        invited_by: string;
        expires_at: string;
        created_at: string;
    }>;

    return rows.map(row => ({
        id: row.id,
        orgId: row.org_id,
        email: row.email,
        role: row.role,
        invitedBy: row.invited_by,
        expiresAt: row.expires_at,
        createdAt: row.created_at
    }));
}

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * Create project
 */
export function createProject(
    orgId: string,
    name: string,
    createdBy: string,
    description?: string
): Project {
    const db = getDb();
    const org = getOrganization(orgId);
    if (!org) throw new Error('Organization not found');

    // Check project limit
    const projects = getOrgProjects(orgId);
    if (projects.length >= org.settings.maxProjects) {
        throw new Error('Organization has reached project limit');
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO projects (id, org_id, name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, orgId, name, description || null, createdBy, now, now);

    return { id, orgId, name, description, createdBy, createdAt: now, updatedAt: now };
}

/**
 * Get organization projects
 */
export function getOrgProjects(orgId: string): Project[] {
    const db = getDb();
    const rows = db.prepare(`
        SELECT * FROM projects WHERE org_id = ? ORDER BY name
    `).all(orgId) as Array<{
        id: string;
        org_id: string;
        name: string;
        description: string | null;
        created_by: string;
        created_at: string;
        updated_at: string;
    }>;

    return rows.map(row => ({
        id: row.id,
        orgId: row.org_id,
        name: row.name,
        description: row.description || undefined,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if user can perform action
 */
export function canPerformAction(
    orgId: string,
    userId: string,
    action: 'delete_org' | 'invite' | 'manage_members' | 'create_project' | 'view'
): boolean {
    const role = getMemberRole(orgId, userId);
    if (!role) return false;

    switch (action) {
        case 'delete_org':
            return role === 'owner';
        case 'invite':
        case 'manage_members':
            return role === 'owner' || role === 'admin';
        case 'create_project':
        case 'view':
            return true; // All members can
        default:
            return false;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateSlug(name: string): string {
    const db = getDb();
    let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Ensure uniqueness
    let counter = 0;
    let uniqueSlug = slug;
    while (db.prepare(`SELECT 1 FROM organizations WHERE slug = ?`).get(uniqueSlug)) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
    }

    return uniqueSlug;
}
