import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import crypto from "crypto"
import { sendWorkspaceInvitationEmail } from "@/lib/email"
import {
  hasWorkspaceRole,
  countActiveMembers,
  getEditorLimit,
  getWorkspaceById,
} from "@/lib/workspace"
import type { PlanTier } from "@/lib/plans"

export const dynamic = "force-dynamic"

/** POST /api/workspaces/:id/invite — invite a member by email */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspaceId = params.id

  // Must be owner or admin to invite
  if (!hasWorkspaceRole(workspaceId, session.sub, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const workspace = getWorkspaceById(workspaceId)
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  // Check editor limit
  const limit = getEditorLimit(workspace.planTier)
  if (limit !== null) {
    const currentCount = countActiveMembers(workspaceId)
    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: "editor_limit",
          tier: workspace.planTier,
          limit,
          current: currentCount,
        },
        { status: 403 }
      )
    }
  }

  const body = await req.json()
  const email = (body.email || "").trim().toLowerCase()
  const role = body.role === "admin" ? "admin" : "editor"

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  // Check if already a member
  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined
  if (existingUser) {
    const existingMember = db.prepare(
      "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
    ).get(workspaceId, existingUser.id)
    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 })
    }
  }

  // Check if already invited (pending)
  const existingInvite = db.prepare(
    "SELECT id FROM workspace_invitations WHERE workspace_id = ? AND email = ? AND accepted_at IS NULL AND expires_at > ?"
  ).get(workspaceId, email, Date.now())
  if (existingInvite) {
    return NextResponse.json({ error: "Already invited" }, { status: 409 })
  }

  const inviteId = nanoid()
  const token = crypto.randomBytes(32).toString("hex")
  const now = Date.now()
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000 // 7 days

  db.prepare(`
    INSERT INTO workspace_invitations (id, workspace_id, email, role, invited_by, token, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(inviteId, workspaceId, email, role, session.sub, token, expiresAt)

  // If user already exists, auto-add them as member
  if (existingUser) {
    const memberId = nanoid()
    db.prepare(`
      INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, invited_at, joined_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(memberId, workspaceId, existingUser.id, role, session.sub, now, now)

    // Mark invitation as accepted
    db.prepare("UPDATE workspace_invitations SET accepted_at = ? WHERE id = ?").run(now, inviteId)

    return NextResponse.json({
      id: inviteId,
      email,
      role,
      status: "joined",
    }, { status: 201 })
  }

  // Send invitation email
  const inviter = db.prepare("SELECT name FROM users WHERE id = ?")
    .get(session.sub) as { name: string } | undefined
  try {
    await sendWorkspaceInvitationEmail(
      email,
      inviter?.name || "Un membre",
      workspace.name,
      role,
      token
    )
  } catch (err) {
    console.error("[invite] Email send failed:", err)
    // Don't fail the invite if email fails — token still valid
  }

  return NextResponse.json({
    id: inviteId,
    email,
    role,
    expiresAt,
    status: "pending",
  }, { status: 201 })
}

/** GET /api/workspaces/:id/invite — list pending invitations */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspaceRole(params.id, session.sub, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const invitations = db.prepare(`
    SELECT id, email, role, invited_by, expires_at, accepted_at
    FROM workspace_invitations
    WHERE workspace_id = ? AND accepted_at IS NULL AND expires_at > ?
    ORDER BY rowid DESC
  `).all(params.id, Date.now())

  return NextResponse.json(invitations)
}
