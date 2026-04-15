import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getWorkspaceForUser, getWorkspaceMembers, countActiveMembers, getEditorLimit } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/me/workspace — get current user's workspace with members */
export async function GET(req: NextRequest) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = getWorkspaceForUser(session.sub)
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 })
  }

  const members = getWorkspaceMembers(workspace.id)
  const activeCount = countActiveMembers(workspace.id)
  const editorLimit = getEditorLimit(workspace.planTier)

  return NextResponse.json({
    ...workspace,
    members,
    activeMembers: activeCount,
    editorLimit,
    canInvite: editorLimit === null || activeCount < editorLimit,
  })
}
