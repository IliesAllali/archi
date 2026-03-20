import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { DbProject } from "@/lib/db"

function isProjectOwner(projectId: string, userId: string): boolean {
  const project = db
    .prepare("SELECT owner_id FROM projects WHERE id = ? AND archived = 0")
    .get(projectId) as DbProject | undefined
  if (!project) return false
  if (project.owner_id === userId) return true

  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId) as { role: string } | undefined
  return member?.role === "owner"
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwner(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { role?: string }
  const validRoles = ["editor", "viewer"]
  if (!body.role || !validRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const result = db
    .prepare("UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?")
    .run(body.role, params.id, params.userId)

  if (result.changes === 0) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  return NextResponse.json({ updated: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwner(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Cannot remove the project owner
  const project = db
    .prepare("SELECT owner_id FROM projects WHERE id = ?")
    .get(params.id) as { owner_id: string } | undefined
  if (project && project.owner_id === params.userId) {
    return NextResponse.json({ error: "Cannot remove project owner" }, { status: 400 })
  }

  db.prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?")
    .run(params.id, params.userId)

  return NextResponse.json({ deleted: true })
}
