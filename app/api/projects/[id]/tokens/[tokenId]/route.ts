import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { DbProject } from "@/lib/db"

export const dynamic = "force-dynamic"

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; tokenId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwner(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Revoke (soft delete) rather than hard delete
  const result = db
    .prepare("UPDATE ai_tokens SET revoked_at = ? WHERE id = ? AND project_id = ? AND revoked_at IS NULL")
    .run(Date.now(), params.tokenId, params.id)

  if (result.changes === 0) {
    return NextResponse.json({ error: "Token not found or already revoked" }, { status: 404 })
  }

  return NextResponse.json({ revoked: true })
}
