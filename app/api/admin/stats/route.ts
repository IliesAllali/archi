import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c
  const totalProjects = (db.prepare("SELECT COUNT(*) as c FROM projects WHERE archived = 0").get() as { c: number }).c
  const totalNodes = (db.prepare("SELECT COUNT(*) as c FROM nodes WHERE archived = 0").get() as { c: number }).c

  const activeUsers30d = (
    db.prepare("SELECT COUNT(DISTINCT owner_id) as c FROM projects WHERE updated_at > ?").get(thirtyDaysAgo) as { c: number }
  ).c

  const projectsCreated7d = (
    db.prepare("SELECT COUNT(*) as c FROM projects WHERE created_at > ? AND archived = 0").get(sevenDaysAgo) as { c: number }
  ).c

  const aiActions7d = (
    db.prepare("SELECT COUNT(*) as c FROM ai_audit_log WHERE created_at > ?").get(sevenDaysAgo) as { c: number }
  ).c

  const activeTokens = (
    db.prepare("SELECT COUNT(*) as c FROM ai_tokens WHERE revoked_at IS NULL").get() as { c: number }
  ).c

  const shareLinks = (
    db.prepare("SELECT COUNT(*) as c FROM project_share_links").get() as { c: number }
  ).c

  const aiCredits = db.prepare("SELECT COALESCE(SUM(credits_total),0) as total, COALESCE(SUM(credits_used),0) as used FROM ai_credits").get() as { total: number; used: number }

  const totalSnapshots = (db.prepare("SELECT COUNT(*) as c FROM version_snapshots").get() as { c: number }).c

  const lastSignup = db.prepare("SELECT name, email, created_at FROM users ORDER BY created_at DESC LIMIT 1").get() as { name: string; email: string; created_at: number } | undefined

  const recentAiActions = db.prepare(`
    SELECT a.action, a.created_at, p.name as project_name
    FROM ai_audit_log a
    LEFT JOIN projects p ON p.id = a.project_id
    ORDER BY a.created_at DESC LIMIT 5
  `).all() as { action: string; created_at: number; project_name: string | null }[]

  return NextResponse.json({
    totalUsers,
    totalProjects,
    totalNodes,
    activeUsers30d,
    projectsCreated7d,
    aiActions7d,
    activeTokens,
    shareLinks,
    aiCreditsTotal: aiCredits.total,
    aiCreditsUsed: aiCredits.used,
    totalSnapshots,
    lastSignup: lastSignup || null,
    recentAiActions,
  })
}
