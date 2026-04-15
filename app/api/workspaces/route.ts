import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getWorkspaceForUser } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/workspaces — get current user's workspace */
export async function GET(req: NextRequest) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = getWorkspaceForUser(session.sub)
  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 })
  }

  return NextResponse.json(workspace)
}
