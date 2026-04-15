import { Webhooks } from "@polar-sh/nextjs"
import { db } from "@/lib/db"
import { resolveProduct, PLAN_LIMITS } from "@/lib/plans"
import type { PlanTier } from "@/lib/plans"
import { nanoid } from "nanoid"
import { serverTrack } from "@/lib/posthog-server"

export const dynamic = "force-dynamic"

const TIER_RANK: Record<PlanTier, number> = { free: 0, solo: 1, studio: 2, agency: 3 }

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onOrderPaid: async (payload) => {
    const order = payload.data
    const metadata = (order as Record<string, unknown>).metadata as Record<string, string> | undefined
    const userId = metadata?.userId
    const customerEmail = (order as Record<string, unknown>).customerEmail as string | undefined
    const customerId = (order as Record<string, unknown>).customerId as string | undefined

    if (!userId && !customerEmail) {
      console.error("[polar webhook] No userId in metadata and no customerEmail, skipping")
      return
    }

    // Find the user
    const user = userId
      ? (db.prepare("SELECT id, plan_tier FROM users WHERE id = ?").get(userId) as { id: string; plan_tier: string } | undefined)
      : (db.prepare("SELECT id, plan_tier FROM users WHERE email = ?").get(customerEmail) as { id: string; plan_tier: string } | undefined)

    if (!user) {
      console.error("[polar webhook] User not found:", userId || customerEmail)
      return
    }

    // Resolve which product was purchased
    const items = (order as Record<string, unknown>).items as Array<{ productId: string }> | undefined
    const productId = items?.[0]?.productId
    if (!productId) {
      console.error("[polar webhook] No productId in order items")
      return
    }

    const product = resolveProduct(productId)
    if (!product) {
      console.error("[polar webhook] Unknown product:", productId)
      return
    }

    const orderId = (order as Record<string, unknown>).id as string
    const amountCents = ((order as Record<string, unknown>).amount as number) || 0

    // Idempotency: skip if already processed
    const existing = db.prepare("SELECT id FROM purchases WHERE polar_order_id = ?").get(orderId)
    if (existing) {
      console.log("[polar webhook] Order already processed:", orderId)
      return
    }

    if (product.type === "lifetime") {
      const currentRank = TIER_RANK[(user.plan_tier as PlanTier) || "free"] || 0
      const newRank = TIER_RANK[product.tier]

      // Only upgrade, never downgrade
      if (newRank > currentRank) {
        const now = Date.now()
        db.prepare("UPDATE users SET plan_tier = ?, updated_at = ? WHERE id = ?")
          .run(product.tier, now, user.id)

        // Sync workspace plan_tier (all workspaces owned by this user)
        db.prepare("UPDATE workspaces SET plan_tier = ?, updated_at = ? WHERE owner_id = ?")
          .run(product.tier, now, user.id)

        // Add the difference in included credits (workspace pool + user pool)
        const newCredits = PLAN_LIMITS[product.tier].initialCredits
        const currentCredits = PLAN_LIMITS[(user.plan_tier as PlanTier) || "free"].initialCredits
        const creditsToAdd = Math.max(0, newCredits - currentCredits)

        if (creditsToAdd > 0) {
          // Workspace pool (primary)
          db.prepare("UPDATE workspaces SET ai_credits = ai_credits + ? WHERE owner_id = ?")
            .run(creditsToAdd, user.id)
          // User pool (legacy fallback)
          db.prepare("UPDATE ai_credits SET credits_total = credits_total + ? WHERE user_id = ?")
            .run(creditsToAdd, user.id)
        }
      }

      db.prepare(
        "INSERT INTO purchases (id, user_id, polar_order_id, type, tier, amount_cents, currency, created_at) VALUES (?, ?, ?, 'lifetime', ?, ?, 'eur', ?)"
      ).run(nanoid(), user.id, orderId, product.tier, amountCents, Date.now())
    } else {
      // Credit pack — workspace pool (primary) + user pool (legacy)
      db.prepare("UPDATE workspaces SET ai_credits = ai_credits + ? WHERE owner_id = ?")
        .run(product.credits, user.id)
      db.prepare("UPDATE ai_credits SET credits_total = credits_total + ? WHERE user_id = ?")
        .run(product.credits, user.id)

      db.prepare(
        "INSERT INTO purchases (id, user_id, polar_order_id, type, credits_added, amount_cents, currency, created_at) VALUES (?, ?, ?, 'credits', ?, ?, 'eur', ?)"
      ).run(nanoid(), user.id, orderId, product.credits, amountCents, Date.now())
    }

    // Store Polar customer ID if present
    if (customerId) {
      db.prepare("UPDATE users SET polar_customer_id = ? WHERE id = ? AND polar_customer_id IS NULL")
        .run(customerId, user.id)
    }

    // Track conversion event
    if (product.type === "lifetime") {
      serverTrack(user.id, "lifetime_purchased", { tier: product.tier, amount_cents: amountCents })
    } else {
      serverTrack(user.id, "credits_purchased", { pack: product.pack, credits: product.credits, amount_cents: amountCents })
    }

    console.log(`[polar webhook] Processed order ${orderId} for user ${user.id}: ${product.type}${product.type === "lifetime" ? ` → ${product.tier}` : ` +${product.credits} credits`}`)
  },
})
