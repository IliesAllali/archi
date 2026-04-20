export type PlanTier = "free" | "solo" | "studio" | "agency"

export interface PlanLimits {
  maxProjects: number | null
  maxEditors: number | null
  maxSnapshots: number | null // null = unlimited
  initialCredits: number
  whiteLabel: boolean
  label: string
  price: number // EUR, 0 for free
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free:   { maxProjects: 3,    maxEditors: 1,  maxSnapshots: 10,   initialCredits: 20,   whiteLabel: false, label: "Free",   price: 0   },
  solo:   { maxProjects: null, maxEditors: 1,  maxSnapshots: 50,   initialCredits: 300,  whiteLabel: false, label: "Solo",   price: 59  },
  studio: { maxProjects: null, maxEditors: 5,  maxSnapshots: null, initialCredits: 1000, whiteLabel: true,  label: "Studio", price: 129 },
  agency: { maxProjects: null, maxEditors: 15, maxSnapshots: null, initialCredits: 3000, whiteLabel: true,  label: "Agency", price: 249 },
}

/** Max owned workspaces per plan. null = unlimited. */
export const WORKSPACE_LIMIT: Record<PlanTier, number | null> = {
  free:   1,
  solo:   1,
  studio: 3,
  agency: null,
}

export const CREDIT_PACKS = {
  starter: { credits: 200, price: 4,  label: "Starter" },
  pro:     { credits: 600, price: 9,  label: "Pro"     },
  power:   { credits: 1500, price: 19, label: "Power"   },
} as const

export type CheckoutProduct = "solo" | "studio" | "agency" | "credits_starter" | "credits_pro" | "credits_power"

/** Get the Polar product ID for a checkout product */
export function getProductId(product: CheckoutProduct): string | null {
  const map: Record<CheckoutProduct, string | undefined> = {
    solo: process.env.POLAR_SOLO_PRODUCT_ID,
    studio: process.env.POLAR_STUDIO_PRODUCT_ID,
    agency: process.env.POLAR_AGENCY_PRODUCT_ID,
    credits_starter: process.env.POLAR_CREDITS_STARTER_ID,
    credits_pro: process.env.POLAR_CREDITS_PRO_ID,
    credits_power: process.env.POLAR_CREDITS_POWER_ID,
  }
  return map[product] || null
}

/** Map Polar product IDs to tier/pack names */
export function resolveProduct(productId: string): { type: "lifetime"; tier: PlanTier } | { type: "credits"; pack: keyof typeof CREDIT_PACKS; credits: number } | null {
  const env = {
    [process.env.POLAR_SOLO_PRODUCT_ID || ""]: { type: "lifetime" as const, tier: "solo" as PlanTier },
    [process.env.POLAR_STUDIO_PRODUCT_ID || ""]: { type: "lifetime" as const, tier: "studio" as PlanTier },
    [process.env.POLAR_AGENCY_PRODUCT_ID || ""]: { type: "lifetime" as const, tier: "agency" as PlanTier },
    [process.env.POLAR_CREDITS_STARTER_ID || ""]: { type: "credits" as const, pack: "starter" as const, credits: 200 },
    [process.env.POLAR_CREDITS_PRO_ID || ""]: { type: "credits" as const, pack: "pro" as const, credits: 600 },
    [process.env.POLAR_CREDITS_POWER_ID || ""]: { type: "credits" as const, pack: "power" as const, credits: 1500 },
  }
  return env[productId] || null
}
