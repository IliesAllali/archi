import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { sendInvitationEmail } from "@/lib/email"
export const dynamic = "force-dynamic"

interface InvitationRow {
  id: string
  project_id: string
  email: string
  role: string
  token: string
  expires_at: number
  accepted_at: number | null
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

  const { getProjectRole } = await import("@/lib/project-access")
  const role = getProjectRole(params.id, session.sub)
  if (!role || role === "viewer") {
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

  // Send invitation email
  const project = db
    .prepare("SELECT name FROM projects WHERE id = ?")
    .get(params.id) as { name: string } | undefined
  const inviterUser = db
    .prepare("SELECT name FROM users WHERE id = ?")
    .get(session.sub) as { name: string } | undefined

  await sendInvitationEmail(
    body.email,
    inviterUser?.name || "Un membre",
    project?.name || "un projet",
    body.role,
    token
  ).catch(console.error)

  return NextResponse.json({ id, email: body.email, role: body.role, token, expires_at: expiresAt }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { getProjectRole } = await import("@/lib/project-access")
  const roleCheck = getProjectRole(params.id, session.sub)
  if (!roleCheck || roleCheck === "viewer") {
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
