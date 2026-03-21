import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { DbProject } from "@/lib/db"

export const dynamic = "force-dynamic"

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwnerOrEditor(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = db
    .prepare("DELETE FROM project_share_links WHERE id = ? AND project_id = ?")
    .run(params.linkId, params.id)

  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ deleted: true })
}
