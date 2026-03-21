import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { DbProject } from "@/lib/db"

export const dynamic = "force-dynamic"

interface MemberRow {
  user_id: string
  role: string
  added_at: number
  name: string
  email: string
  color: string
}

function getProjectIfOwnerOrEditor(projectId: string, userId: string): DbProject | null {
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? AND archived = 0")
    .get(projectId) as DbProject | undefined
  if (!project) return null

  if (project.owner_id === userId) return project

  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId) as { role: string } | undefined
  if (member && (member.role === "owner" || member.role === "editor")) return project

  return null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? AND archived = 0")
    .get(params.id) as DbProject | undefined
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const members = db
    .prepare(
      `SELECT pm.user_id, pm.role, pm.added_at, u.name, u.email, u.color
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?
       ORDER BY pm.added_at ASC`
    )
    .all(params.id) as MemberRow[]

  // Also include the owner if not already in members
  const ownerInMembers = members.some((m) => m.user_id === project.owner_id)
  if (!ownerInMembers) {
    const owner = db
      .prepare("SELECT id, name, email, color FROM users WHERE id = ?")
      .get(project.owner_id) as { id: string; name: string; email: string; color: string } | undefined
    if (owner) {
      members.unshift({
        user_id: owner.id,
        role: "owner",
        added_at: 0,
        name: owner.name,
        email: owner.email,
        color: owner.color,
      })
    }
  }

  return NextResponse.json(members)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = getProjectIfOwnerOrEditor(params.id, session.sub)
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json() as { email?: string; role?: string }
  if (!body.email || !body.role) {
    return NextResponse.json({ error: "email and role required" }, { status: 400 })
  }

  const validRoles = ["editor", "viewer"]
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Find user by email
  const user = db
    .prepare("SELECT id, name, email, color FROM users WHERE email = ?")
    .get(body.email) as { id: string; name: string; email: string; color: string } | undefined

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Check not already a member
  const existing = db
    .prepare("SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(params.id, user.id)

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 })
  }

  db.prepare(
    "INSERT INTO project_members (project_id, user_id, role, added_at) VALUES (?, ?, ?, ?)"
  ).run(params.id, user.id, body.role, Date.now())

  return NextResponse.json({
    user_id: user.id,
    role: body.role,
    added_at: Date.now(),
    name: user.name,
    email: user.email,
    color: user.color,
  }, { status: 201 })
}
