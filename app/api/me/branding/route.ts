import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { getWorkspaceForUser } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/me/branding — get current user's workspace branding */
export async function GET(req: NextRequest) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = getWorkspaceForUser(session.sub)
  if (!workspace || !["studio", "agency"].includes(workspace.planTier)) {
    return NextResponse.json({ enabled: false })
  }

  const branding = db.prepare(
    "SELECT logo_url, company_name FROM workspace_branding WHERE workspace_id = ?"
  ).get(workspace.id) as { logo_url: string | null; company_name: string | null } | undefined

  return NextResponse.json({
    enabled: true,
    logoUrl: branding?.logo_url || null,
    companyName: branding?.company_name || null,
  })
}
