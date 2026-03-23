import { db } from "@/lib/db"
import type { AiSpeed } from "@/lib/ai"

interface AiCreditsRow {
  user_id: string
  credits_total: number
  credits_used: number
}

/**
 * Check if a user can use server-side AI credits.
 * Returns the server API key if credits are available, null otherwise.
 * Does NOT deduct credits — call deductCredits() after a successful AI call.
 */
export function checkCredits(
  userId: string,
  speed: AiSpeed
): { canUse: boolean; remaining: number; cost: number } {
  const row = db
    .prepare("SELECT * FROM ai_credits WHERE user_id = ?")
    .get(userId) as AiCreditsRow | undefined

  if (!row) {
    return { canUse: false, remaining: 0, cost: 0 }
  }

  const cost = speed === "quality" ? 3 : 1
  const remaining = row.credits_total - row.credits_used

  return {
    canUse: remaining >= cost,
    remaining,
    cost,
  }
}

/**
 * Deduct credits after a successful AI call.
 */
export function deductCredits(userId: string, speed: AiSpeed): void {
  const cost = speed === "quality" ? 3 : 1
  db.prepare(
    "UPDATE ai_credits SET credits_used = credits_used + ? WHERE user_id = ?"
  ).run(cost, userId)
}

/**
 * Get the server-side Anthropic API key.
 * Returns null if not configured.
 */
export function getServerAiKey(): string | null {
  return process.env.ARBO_ANTHROPIC_KEY || null
}
