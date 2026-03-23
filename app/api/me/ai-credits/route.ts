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

  const row = db
    .prepare("SELECT * FROM ai_credits WHERE user_id = ?")
    .get(session.sub) as AiCreditsRow | undefined

  if (!row) {
    return NextResponse.json({
      creditsTotal: 0,
      creditsUsed: 0,
      creditsRemaining: 0,
    })
  }

  return NextResponse.json({
    creditsTotal: row.credits_total,
    creditsUsed: row.credits_used,
    creditsRemaining: row.credits_total - row.credits_used,
  })
}
