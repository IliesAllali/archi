import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

interface UserRow {
  id: string
  email: string
  email_verified: number
  name: string
  color: string
  role_global: string
  created_at: number
  updated_at: number
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = db
    .prepare("SELECT id, email, email_verified, name, color, role_global, created_at, updated_at FROM users ORDER BY created_at DESC")
    .all() as UserRow[]

  // Enrich with project count
  const projectCounts = db
    .prepare("SELECT owner_id, COUNT(*) as c FROM projects WHERE archived = 0 GROUP BY owner_id")
    .all() as { owner_id: string; c: number }[]
  const countMap = new Map(projectCounts.map(r => [r.owner_id, r.c]))

  // Last activity (most recent project update)
  const lastActivity = db
    .prepare("SELECT owner_id, MAX(updated_at) as last FROM projects GROUP BY owner_id")
    .all() as { owner_id: string; last: number }[]
  const activityMap = new Map(lastActivity.map(r => [r.owner_id, r.last]))

  // AI credits
  const credits = db
    .prepare("SELECT user_id, credits_total, credits_used FROM ai_credits")
    .all() as { user_id: string; credits_total: number; credits_used: number }[]
  const creditsMap = new Map(credits.map(r => [r.user_id, r]))

  // Node counts per user
  const nodeCounts = db
    .prepare("SELECT p.owner_id, COUNT(n.id) as c FROM nodes n JOIN projects p ON p.id = n.project_id WHERE n.archived = 0 AND p.archived = 0 GROUP BY p.owner_id")
    .all() as { owner_id: string; c: number }[]
  const nodeMap = new Map(nodeCounts.map(r => [r.owner_id, r.c]))

  return NextResponse.json(
    users.map(u => {
      const cr = creditsMap.get(u.id)
      return {
        id: u.id,
        email: u.email,
        emailVerified: !!u.email_verified,
        name: u.name,
        color: u.color,
        role: u.role_global,
        projectCount: countMap.get(u.id) || 0,
        nodeCount: nodeMap.get(u.id) || 0,
        creditsUsed: cr?.credits_used || 0,
        creditsTotal: cr?.credits_total || 0,
        lastActive: activityMap.get(u.id) || u.created_at,
        createdAt: u.created_at,
      }
    })
  )
}
