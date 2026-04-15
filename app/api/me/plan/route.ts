import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"
import type { PlanTier } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = db.prepare("SELECT plan_tier FROM users WHERE id = ?")
    .get(session.sub) as { plan_tier: string } | undefined

  const tier = (user?.plan_tier || "free") as PlanTier
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free

  const projectCount = (
    db.prepare("SELECT COUNT(*) as c FROM projects WHERE owner_id = ? AND archived = 0")
      .get(session.sub) as { c: number }
  ).c

  const canCreateProject = limits.maxProjects === null || projectCount < limits.maxProjects

  return NextResponse.json({
    tier,
    label: limits.label,
    price: limits.price,
    limits: {
      maxProjects: limits.maxProjects,
      maxEditors: limits.maxEditors,
      whiteLabel: limits.whiteLabel,
    },
    projectCount,
    canCreateProject,
  })
}
