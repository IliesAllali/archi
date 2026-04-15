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
