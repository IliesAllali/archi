import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasWorkspaceRole } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** DELETE /api/workspaces/:id/members/:userId — remove a member */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: workspaceId, userId: targetUserId } = params

  // Can't remove yourself if you're the owner
  const targetMember = db.prepare(
    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
  ).get(workspaceId, targetUserId) as { role: string } | undefined

  if (!targetMember) {
    return NextResponse.json({ error: "Not a member" }, { status: 404 })
  }

  if (targetMember.role === "owner") {
    return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 403 })
  }

  // Must be owner or admin to remove others. Or the user themselves (leave).
  const isSelf = session.sub === targetUserId
  if (!isSelf && !hasWorkspaceRole(workspaceId, session.sub, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  db.prepare(
    "DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
  ).run(workspaceId, targetUserId)

  return NextResponse.json({ removed: targetUserId })
}
