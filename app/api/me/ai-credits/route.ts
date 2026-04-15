import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

interface AiCreditsRow {
  user_id: string
  credits_total: number
  credits_used: number
}

export async function GET(req: NextRequest) {
  void req
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Workspace pool (primary)
  const ws = db.prepare(
    "SELECT ai_credits FROM workspaces WHERE owner_id = ? LIMIT 1"
  ).get(session.sub) as { ai_credits: number } | undefined

  const wsMember = !ws ? db.prepare(`
    SELECT w.ai_credits FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = ? AND wm.joined_at IS NOT NULL
    ORDER BY wm.joined_at ASC LIMIT 1
  `).get(session.sub) as { ai_credits: number } | undefined : undefined

  const wsCredits = ws?.ai_credits ?? wsMember?.ai_credits ?? 0

  // User pool (legacy)
  const row = db
    .prepare("SELECT * FROM ai_credits WHERE user_id = ?")
    .get(session.sub) as AiCreditsRow | undefined

  const userRemaining = row ? row.credits_total - row.credits_used : 0

  // Total available = workspace pool + user remaining
  const totalRemaining = wsCredits + Math.max(0, userRemaining)
  const totalAll = wsCredits + (row?.credits_total ?? 0)

  return NextResponse.json({
    creditsTotal: totalAll,
    creditsUsed: totalAll - totalRemaining,
    creditsRemaining: totalRemaining,
  })
}
