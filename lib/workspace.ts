import { db } from "@/lib/db"
import { PLAN_LIMITS, type PlanTier } from "@/lib/plans"

export interface Workspace {
  id: string
  name: string
  ownerId: string
  planTier: PlanTier
  aiCredits: number
  createdAt: number
  updatedAt: number
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: "owner" | "admin" | "editor"
  userName?: string
  userEmail?: string
  userAvatar?: string | null
  joinedAt: number | null
  invitedAt: number
}

interface DbWorkspace {
  id: string
  name: string
  owner_id: string
  plan_tier: string
  ai_credits: number
  created_at: number
  updated_at: number
}

interface DbMember {
  id: string
  workspace_id: string
  user_id: string
  role: string
  joined_at: number | null
  invited_at: number
  user_name?: string
  user_email?: string
  user_avatar?: string | null
}

function toWorkspace(row: DbWorkspace): Workspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    planTier: (row.plan_tier || "free") as PlanTier,
    aiCredits: row.ai_credits,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Get the primary workspace for a user (first one they own, or first membership) */
export function getWorkspaceForUser(userId: string): Workspace | null {
  // Prefer owned workspace
  const owned = db.prepare(
    "SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1"
  ).get(userId) as DbWorkspace | undefined

  if (owned) return toWorkspace(owned)

  // Fallback: workspace they're a member of
  const membership = db.prepare(`
    SELECT w.* FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = ?
    ORDER BY wm.joined_at ASC LIMIT 1
  `).get(userId) as DbWorkspace | undefined

  return membership ? toWorkspace(membership) : null
}

/** Get workspace by ID */
export function getWorkspaceById(workspaceId: string): Workspace | null {
  const row = db.prepare("SELECT * FROM workspaces WHERE id = ?")
    .get(workspaceId) as DbWorkspace | undefined
  return row ? toWorkspace(row) : null
}

/** Get all members of a workspace with user info */
export function getWorkspaceMembers(workspaceId: string): WorkspaceMember[] {
  const rows = db.prepare(`
    SELECT wm.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
    FROM workspace_members wm
    LEFT JOIN users u ON u.id = wm.user_id
    WHERE wm.workspace_id = ?
    ORDER BY wm.role = 'owner' DESC, wm.joined_at ASC
  `).all(workspaceId) as DbMember[]

  return rows.map(r => ({
    id: r.id,
    workspaceId: r.workspace_id,
    userId: r.user_id,
    role: r.role as "owner" | "admin" | "editor",
    userName: r.user_name,
    userEmail: r.user_email,
    userAvatar: r.user_avatar,
    joinedAt: r.joined_at,
    invitedAt: r.invited_at,
  }))
}

/** Check if a user has a specific role (or higher) in a workspace */
export function hasWorkspaceRole(
  workspaceId: string,
  userId: string,
  minRole: "editor" | "admin" | "owner" = "editor"
): boolean {
  const member = db.prepare(
    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
  ).get(workspaceId, userId) as { role: string } | undefined

  if (!member) return false

  const ROLE_RANK: Record<string, number> = { editor: 0, admin: 1, owner: 2 }
  return (ROLE_RANK[member.role] ?? 0) >= (ROLE_RANK[minRole] ?? 0)
}

/** Count active members (with joined_at set) */
export function countActiveMembers(workspaceId: string): number {
  const row = db.prepare(
    "SELECT COUNT(*) as c FROM workspace_members WHERE workspace_id = ? AND joined_at IS NOT NULL"
  ).get(workspaceId) as { c: number }
  return row.c
}

/** Get editor limit for a workspace based on plan */
export function getEditorLimit(planTier: PlanTier): number | null {
  return PLAN_LIMITS[planTier]?.maxEditors ?? 1
}
