import { db } from "@/lib/db"
import type { AiSpeed } from "@/lib/ai"

interface AiCreditsRow {
  user_id: string
  credits_total: number
  credits_used: number
}

interface WorkspaceCredits {
  workspace_id: string
  ai_credits: number
}

/**
 * Get the workspace ID for a user (for shared credit pool).
 * Returns null if no workspace found.
 */
function getUserWorkspaceId(userId: string): string | null {
  const ws = db.prepare(
    "SELECT id FROM workspaces WHERE owner_id = ? LIMIT 1"
  ).get(userId) as { id: string } | undefined
  if (ws) return ws.id

  const membership = db.prepare(`
    SELECT workspace_id FROM workspace_members
    WHERE user_id = ? AND joined_at IS NOT NULL
    ORDER BY joined_at ASC LIMIT 1
  `).get(userId) as { workspace_id: string } | undefined
  return membership?.workspace_id || null
}

/**
 * Check if a user can use server-side AI credits.
 * Checks workspace pool first (shared), then user pool (legacy).
 * Does NOT deduct credits — call deductCredits() after a successful AI call.
 */
export function checkCredits(
  userId: string,
  speed: AiSpeed
): { canUse: boolean; remaining: number; cost: number; source: "workspace" | "user" } {
  const cost = speed === "quality" ? 3 : 1

  // 1. Try workspace pool
  const wsId = getUserWorkspaceId(userId)
  if (wsId) {
    const ws = db.prepare("SELECT ai_credits FROM workspaces WHERE id = ?")
      .get(wsId) as WorkspaceCredits | undefined
    if (ws && ws.ai_credits > 0) {
      return { canUse: ws.ai_credits >= cost, remaining: ws.ai_credits, cost, source: "workspace" }
    }
  }

  // 2. Fallback to user pool (legacy)
  const row = db
    .prepare("SELECT * FROM ai_credits WHERE user_id = ?")
    .get(userId) as AiCreditsRow | undefined

  if (!row) {
    return { canUse: false, remaining: 0, cost, source: "user" }
  }

  const remaining = row.credits_total - row.credits_used

  return {
    canUse: remaining >= cost,
    remaining,
    cost,
    source: "user",
  }
}

/**
 * Deduct credits after a successful AI call.
 * Deducts from the same source that checkCredits identified.
 */
export function deductCredits(userId: string, speed: AiSpeed): void {
  const cost = speed === "quality" ? 3 : 1

  // Try workspace pool first
  const wsId = getUserWorkspaceId(userId)
  if (wsId) {
    const ws = db.prepare("SELECT ai_credits FROM workspaces WHERE id = ?")
      .get(wsId) as WorkspaceCredits | undefined
    if (ws && ws.ai_credits >= cost) {
      db.prepare("UPDATE workspaces SET ai_credits = ai_credits - ? WHERE id = ? AND ai_credits >= ?")
        .run(cost, wsId, cost)
      return
    }
  }

  // Fallback to user pool
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

/**
 * Check if a user can use BYOK (bring your own key).
 * BYOK is only available for paid plans (solo, studio, agency).
 */
export function canUseByok(userId: string): boolean {
  const user = db
    .prepare("SELECT plan_tier FROM users WHERE id = ?")
    .get(userId) as { plan_tier: string } | undefined
  const tier = user?.plan_tier || "free"
  return tier !== "free"
}
