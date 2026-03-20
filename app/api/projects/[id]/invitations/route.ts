import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import type { DbProject } from "@/lib/db"

interface InvitationRow {
  id: string
  project_id: string
  email: string
  role: string
  token: string
  expires_at: number
  accepted_at: number | null
}

function isProjectOwnerOrEditor(projectId: string, userId: string): boolean {
  const project = db
    .prepare("SELECT owner_id FROM projects WHERE id = ? AND archived = 0")
    .get(projectId) as DbProject | undefined
  if (!project) return false
  if (project.owner_id === userId) return true

  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId) as { role: string } | undefined
  return member?.role === "owner" || member?.role === "editor"
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const invitations = db
    .prepare(
      "SELECT id, email, role, expires_at, accepted_at FROM project_invitations WHERE project_id = ? ORDER BY expires_at DESC"
    )
    .all(params.id) as InvitationRow[]

  return NextResponse.json(invitations)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwnerOrEditor(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { email?: string; role?: string }
  if (!body.email || !body.role) {
    return NextResponse.json({ error: "email and role required" }, { status: 400 })
  }

  const validRoles = ["editor", "viewer"]
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const id = nanoid()
  const token = nanoid(32)
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

  db.prepare(
    "INSERT INTO project_invitations (id, project_id, email, role, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, params.id, body.email, body.role, token, expiresAt)

  return NextResponse.json({ id, email: body.email, role: body.role, token, expires_at: expiresAt }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwnerOrEditor(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { invitationId?: string }
  if (!body.invitationId) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 })
  }

  db.prepare("DELETE FROM project_invitations WHERE id = ? AND project_id = ?")
    .run(body.invitationId, params.id)

  return NextResponse.json({ deleted: true })
}
