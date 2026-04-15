import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

/** POST /api/workspaces/join — accept an invitation by token */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const token = (body.token || "").trim()

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  // Find the invitation
  const invitation = db.prepare(`
    SELECT * FROM workspace_invitations
    WHERE token = ? AND accepted_at IS NULL AND expires_at > ?
  `).get(token, Date.now()) as {
    id: string
    workspace_id: string
    email: string
    role: string
    invited_by: string
  } | undefined

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
  }

  // Check user email matches invitation (or allow any authenticated user)
  const user = db.prepare("SELECT email FROM users WHERE id = ?")
    .get(session.sub) as { email: string } | undefined

  if (user?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Email mismatch", expected: invitation.email },
      { status: 403 }
    )
  }

  // Check if already a member
  const existing = db.prepare(
    "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
  ).get(invitation.workspace_id, session.sub)

  if (existing) {
    // Mark invitation as accepted
    db.prepare("UPDATE workspace_invitations SET accepted_at = ? WHERE id = ?")
      .run(Date.now(), invitation.id)
    return NextResponse.json({ status: "already_member", workspaceId: invitation.workspace_id })
  }

  const now = Date.now()

  // Add as member
  db.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, invited_at, joined_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(nanoid(), invitation.workspace_id, session.sub, invitation.role, invitation.invited_by, now, now)

  // Mark invitation as accepted
  db.prepare("UPDATE workspace_invitations SET accepted_at = ? WHERE id = ?")
    .run(now, invitation.id)

  return NextResponse.json({
    status: "joined",
    workspaceId: invitation.workspace_id,
  }, { status: 201 })
}
