import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { getWorkspaceForUser } from "@/lib/workspace"
import { PLAN_LIMITS, WORKSPACE_LIMIT, type PlanTier } from "@/lib/plans"

export const dynamic = "force-dynamic"

/** GET /api/workspaces — get current user's primary workspace */
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

/** POST /api/workspaces — create a new workspace owned by the current user.
 *  Body: { name: string }
 *  Gated to paid plans (studio/agency). Free/solo keep a single workspace. */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { name?: string } | null
  const name = body?.name?.trim()
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 })
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "name too long (60 chars max)" }, { status: 400 })
  }

  const user = db.prepare("SELECT plan_tier FROM users WHERE id = ?")
    .get(session.sub) as { plan_tier: string } | undefined
  const tier = (user?.plan_tier || "free") as PlanTier

  if (tier !== "studio" && tier !== "agency") {
    return NextResponse.json(
      { error: "Multiple workspaces require a Studio or Agency plan." },
      { status: 403 }
    )
  }

  const limit = WORKSPACE_LIMIT[tier]
  if (limit !== null) {
    const owned = (db.prepare("SELECT COUNT(*) as c FROM workspaces WHERE owner_id = ?")
      .get(session.sub) as { c: number }).c
    if (owned >= limit) {
      return NextResponse.json(
        { error: `Limite atteinte : ${limit} workspace${limit > 1 ? "s" : ""} max sur le plan ${tier}.` },
        { status: 403 }
      )
    }
  }

  const now = Date.now()
  const id = `ws_${nanoid(10)}`
  const memberId = `wm_${nanoid(10)}`
  const initialCredits = PLAN_LIMITS[tier].initialCredits

  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO workspaces (id, name, owner_id, plan_tier, ai_credits, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, name, session.sub, tier, initialCredits, now, now)

    db.prepare(
      "INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_at, joined_at) VALUES (?, ?, ?, 'owner', ?, ?)"
    ).run(memberId, id, session.sub, now, now)
  })
  tx()

  return NextResponse.json({ id, name, ownerId: session.sub, planTier: tier, role: "owner" })
}
