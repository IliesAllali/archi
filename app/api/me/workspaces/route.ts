import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getWorkspacesForUser } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/me/workspaces — all workspaces the user can access (owned + member of) */
export async function GET(req: NextRequest) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspaces = getWorkspacesForUser(session.sub)
  return NextResponse.json(workspaces)
}
