import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasWorkspaceRole, getWorkspaceById } from "@/lib/workspace"

export const dynamic = "force-dynamic"

/** GET /api/workspaces/:id/branding — get branding settings */
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

  // White label requires Studio or Agency
  if (!["studio", "agency"].includes(workspace.planTier)) {
    return NextResponse.json({ enabled: false, tier: workspace.planTier })
  }

  const branding = db.prepare(
    "SELECT logo_url, company_name, updated_at FROM workspace_branding WHERE workspace_id = ?"
  ).get(params.id) as { logo_url: string | null; company_name: string | null; updated_at: number } | undefined

  return NextResponse.json({
    enabled: true,
    logoUrl: branding?.logo_url || null,
    companyName: branding?.company_name || null,
    updatedAt: branding?.updated_at || null,
  })
}

/** PATCH /api/workspaces/:id/branding — update branding (logo as base64 data URL, company name) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Must be owner or admin
  if (!hasWorkspaceRole(params.id, session.sub, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const workspace = getWorkspaceById(params.id)
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!["studio", "agency"].includes(workspace.planTier)) {
    return NextResponse.json({ error: "White label requires Studio or Agency plan" }, { status: 403 })
  }

  const body = await req.json()
  const logoUrl = body.logoUrl !== undefined ? body.logoUrl : undefined
  const companyName = body.companyName !== undefined ? body.companyName : undefined

  // Validate logo size (max 500KB base64)
  if (logoUrl && typeof logoUrl === "string" && logoUrl.length > 700_000) {
    return NextResponse.json({ error: "Logo too large (max 500KB)" }, { status: 400 })
  }

  const now = Date.now()

  // Upsert
  const existing = db.prepare("SELECT workspace_id FROM workspace_branding WHERE workspace_id = ?").get(params.id)

  if (existing) {
    const updates: string[] = []
    const values: unknown[] = []

    if (logoUrl !== undefined) { updates.push("logo_url = ?"); values.push(logoUrl) }
    if (companyName !== undefined) { updates.push("company_name = ?"); values.push(companyName) }
    updates.push("updated_at = ?"); values.push(now)
    values.push(params.id)

    db.prepare(`UPDATE workspace_branding SET ${updates.join(", ")} WHERE workspace_id = ?`).run(...values)
  } else {
    db.prepare(
      "INSERT INTO workspace_branding (workspace_id, logo_url, company_name, updated_at) VALUES (?, ?, ?, ?)"
    ).run(params.id, logoUrl || null, companyName || null, now)
  }

  return NextResponse.json({ ok: true })
}
