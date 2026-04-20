import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasWorkspaceRole, getWorkspaceById } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/workspaces/:id — get workspace details */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspaceRole(params.id, session.sub, "editor")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const workspace = getWorkspaceById(params.id)
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(workspace)
}

/** PATCH /api/workspaces/:id — update workspace name */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspaceRole(params.id, session.sub, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const name = (body.name || "").trim()

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  }

  db.prepare("UPDATE workspaces SET name = ?, updated_at = ? WHERE id = ?")
    .run(name, Date.now(), params.id)

  return NextResponse.json({ ok: true, name })
}

/** DELETE /api/workspaces/:id — owner-only.
 *  Blocks if the workspace is the user's last owned workspace OR still contains projects. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = getWorkspaceById(params.id)
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (workspace.ownerId !== session.sub) {
    return NextResponse.json({ error: "Only the owner can delete a workspace." }, { status: 403 })
  }

  const ownedCount = (db.prepare("SELECT COUNT(*) as c FROM workspaces WHERE owner_id = ?")
    .get(session.sub) as { c: number }).c
  if (ownedCount <= 1) {
    return NextResponse.json(
      { error: "Tu ne peux pas supprimer ton dernier workspace." },
      { status: 400 }
    )
  }

  const projectCount = (db.prepare("SELECT COUNT(*) as c FROM projects WHERE workspace_id = ? AND archived = 0")
    .get(params.id) as { c: number }).c
  if (projectCount > 0) {
    return NextResponse.json(
      { error: "Déplace ou supprime les projets avant de supprimer le workspace." },
      { status: 400 }
    )
  }

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM workspace_members WHERE workspace_id = ?").run(params.id)
    db.prepare("DELETE FROM workspace_invitations WHERE workspace_id = ?").run(params.id)
    db.prepare("DELETE FROM workspace_branding WHERE workspace_id = ?").run(params.id)
    db.prepare("DELETE FROM workspaces WHERE id = ?").run(params.id)
  })
  tx()

  return NextResponse.json({ ok: true })
}
