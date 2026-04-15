import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getWorkspaceMembers, hasWorkspaceRole } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/workspaces/:id/members — list workspace members */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspaceId = params.id

  // Must be a member to see members
  if (!hasWorkspaceRole(workspaceId, session.sub, "editor")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const members = getWorkspaceMembers(workspaceId)
  return NextResponse.json(members)
}
