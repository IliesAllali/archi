import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasWorkspaceRole } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** PATCH /api/projects/:id/workspace — move a project to another workspace.
 *  Body: { workspaceId: string }
 *  Requires: requester is project owner AND has at least editor role in target workspace. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { workspaceId?: string } | null
  const workspaceId = body?.workspaceId
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
  }

  const project = db
    .prepare("SELECT id, owner_id, workspace_id FROM projects WHERE id = ? AND archived = 0")
    .get(params.id) as { id: string; owner_id: string; workspace_id: string | null } | undefined

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (project.owner_id !== session.sub) {
    return NextResponse.json({ error: "Only the project owner can move it" }, { status: 403 })
  }

  if (project.workspace_id === workspaceId) {
    return NextResponse.json({ ok: true, workspaceId })
  }

  if (!hasWorkspaceRole(workspaceId, session.sub, "editor")) {
    return NextResponse.json({ error: "No access to target workspace" }, { status: 403 })
  }

  db.prepare("UPDATE projects SET workspace_id = ?, updated_at = ? WHERE id = ?")
    .run(workspaceId, Date.now(), params.id)

  return NextResponse.json({ ok: true, workspaceId })
}
