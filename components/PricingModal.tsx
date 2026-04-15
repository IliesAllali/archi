"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Sparkles, Zap, Crown, Users, Key, ArrowRight } from "lucide-react"
import { PLAN_LIMITS, CREDIT_PACKS, type PlanTier } from "@/lib/plans"
import { Events } from "@/lib/posthog"

const ease = [0.16, 1, 0.3, 1] as const

interface Props {
  open: boolean
  onClose: () => void
  highlightTier?: PlanTier
  showCredits?: boolean
}

type TierKey = "solo" | "studio" | "agency"

const TIERS: { key: TierKey; icon: typeof Crown; tagline: string; features: string[] }[] = [
  {
    key: "solo",
    icon: Zap,
    tagline: "Pour les freelances actifs",
    features: [
      "Projets illimit\u00e9s",
      "300 cr\u00e9dits IA",
      "BYOK : branche ta propre cl\u00e9 API",
      "Serveur MCP (Claude, Cursor\u2026)",
      "PDF sans watermark",
      "Liens de partage clean",
    ],
  },
  {
    key: "studio",
    icon: Crown,
    tagline: "Pour les petites \u00e9quipes",
    features: [
      "Tout de Solo +",
      "5 \u00e9diteurs",
      "1 000 cr\u00e9dits IA",
      "White label",
      "Historique illimit\u00e9",
    ],
  },
  {
    key: "agency",
    icon: Users,
    tagline: "Pour les agences web",
    features: [
      "Tout de Studio +",
      "15 \u00e9diteurs",
      "3 000 cr\u00e9dits IA",
      "Multi-workspace",
      "Support prioritaire",
    ],
  },
]

const PACKS = [
  { key: "credits_starter" as const, ...CREDIT_PACKS.starter },
  { key: "credits_pro" as const, ...CREDIT_PACKS.pro },
  { key: "credits_power" as const, ...CREDIT_PACKS.power },
]

export default function PricingModal({ open, onClose, highlightTier, showCredits }: Props) {
  const [currentTier, setCurrentTier] = useState<PlanTier>("free")
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null)
  const [section, setSection] = useState<"plans" | "credits">(showCredits ? "credits" : "plans")

  useEffect(() => {
    if (open) {
      setSection(showCredits ? "credits" : "plans")
      setLoadingProduct(null)
      fetch("/api/me/plan")
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.tier) setCurrentTier(data.tier) })
        .catch(() => {})
    }
  }, [open, showCredits])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  const handleCheckout = useCallback(async (product: string) => {
    setLoadingProduct(product)
    Events.checkoutStarted(product, "pricing_modal")
    try {
      const res = await fetch(`/api/checkout?product=${product}`)
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      if (url) {
        const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed")
        const checkout = await PolarEmbedCheckout.create(url, { theme: "dark" })
        checkout.addEventListener("success", () => {
          window.location.href = "/account?upgrade=success"
        })
      }
    } catch {
      window.open(`/api/checkout?product=${product}`, "_blank")
    } finally {
      setLoadingProduct(null)
    }
  }, [])

  const recommended = highlightTier || "solo"

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            style={{ backgroundColor: "var(--overlay-bg)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
          >
            <div
              className="w-full sm:w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl pointer-events-auto"
              style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)" }}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ color: "var(--text-faint)" }}
                >
                  <X className="w-4 h-4" />
                </button>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.2, ease }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--accent)" }}>
                    Pricing
                  </p>
                  <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Ach&egrave;te une fois, garde pour toujours.
                  </h3>
                  <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Pas d&apos;abonnement. La concurrence facture 15$/mois pour moins.
                  </p>
                </motion.div>

                {/* Tabs */}
                <div
                  className="flex gap-0.5 mt-5 p-0.5 rounded-lg w-fit"
                  style={{ background: "var(--surface)" }}
                >
                  {(["plans", "credits"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSection(tab)}
                      className="relative px-4 py-1.5 rounded-md text-2xs font-medium transition-colors duration-150"
                      style={{ color: section === tab ? "var(--text-primary)" : "var(--text-faint)" }}
                    >
                      {section === tab && (
                        <motion.div
                          layoutId="pricing-tab"
                          className="absolute inset-0 rounded-md"
                          style={{ background: "var(--elevated)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">
                        {tab === "plans" ? "Plans" : "Cr\u00e9dits IA"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans */}
              <AnimatePresence mode="wait">
                {section === "plans" && (
                  <motion.div
                    key="plans"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease }}
                    className="px-6 pb-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TIERS.map((tier, i) => {
                        const limits = PLAN_LIMITS[tier.key]
                        const isRec = tier.key === recommended
                        const isCurrent = tier.key === currentTier
                        const isLower = TIER_RANK[tier.key] <= TIER_RANK[currentTier] && currentTier !== "free"
                        const Icon = tier.icon

                        return (
                          <motion.div
                            key={tier.key}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.06 + i * 0.04, duration: 0.25, ease }}
                            className={`relative rounded-xl flex flex-col overflow-hidden transition-shadow duration-200 ${isRec ? "shadow-lg" : ""}`}
                            style={{
                              background: isRec
                                ? "linear-gradient(145deg, var(--surface) 0%, var(--elevated) 100%)"
                                : "var(--surface)",
                              border: isRec
                                ? "1.5px solid var(--accent)"
                                : "1px solid var(--line)",
                            }}
                          >
                            {/* Recommended glow */}
                            {isRec && (
                              <div
                                className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.07] pointer-events-none"
                                style={{ background: "var(--accent)", filter: "blur(32px)" }}
                              />
                            )}

                            {/* Badge */}
                            {isRec && !isCurrent && (
                              <div className="flex justify-center pt-2.5 pb-0">
                                <span
                                  className="px-2.5 py-[3px] rounded-full text-[9px] font-bold uppercase tracking-wider"
                                  style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                  Populaire
                                </span>
                              </div>
                            )}

                            <div className={`p-4 flex flex-col flex-1 ${isRec && !isCurrent ? "pt-2" : ""}`}>
                              {/* Header */}
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon className="w-3.5 h-3.5" style={{ color: isRec ? "var(--accent)" : "var(--text-muted)" }} />
                                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {limits.label}
                                </span>
                              </div>
                              <p className="text-[10px] mb-3" style={{ color: "var(--text-faint)" }}>
                                {tier.tagline}
                              </p>

                              {/* Price */}
                              <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-bold tracking-tighter" style={{ color: "var(--text-primary)" }}>
                                  {limits.price}
                                </span>
                                <span className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>
                                  EUR, une fois
                                </span>
                              </div>

                              {/* Features */}
                              <ul className="space-y-2 flex-1 mb-4">
                                {tier.features.map((f, j) => (
                                  <li key={j} className="flex items-start gap-2">
                                    <Check
                                      className="w-3 h-3 shrink-0 mt-[1px]"
                                      style={{ color: isRec ? "var(--accent)" : "var(--text-faint)" }}
                                    />
                                    <span className="text-[11px] leading-tight" style={{ color: "var(--text-secondary)" }}>
                                      {f}
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              {/* CTA */}
                              {isCurrent ? (
                                <div
                                  className="w-full text-center py-2.5 rounded-lg text-[11px] font-medium"
                                  style={{ background: "var(--surface-hover)", color: "var(--text-faint)" }}
                                >
                                  Plan actuel
                                </div>
                              ) : isLower ? null : (
                                <button
                                  onClick={() => handleCheckout(tier.key)}
                                  disabled={!!loadingProduct}
                                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
                                  style={{
                                    background: isRec ? "var(--accent)" : "var(--surface-hover)",
                                    color: isRec ? "#fff" : "var(--text-primary)",
                                    boxShadow: isRec ? "0 2px 8px rgba(247,107,21,0.25)" : undefined,
                                  }}
                                >
                                  {loadingProduct === tier.key ? (
                                    <LoadingDots />
                                  ) : (
                                    <>
                                      Acheter
                                      {isRec && <ArrowRight className="w-3 h-3" />}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    <p className="text-[10px] mt-4 text-center" style={{ color: "var(--text-faint)" }}>
                      Free : 3 projets, 20 cr&eacute;dits, watermark. Pas de BYOK ni MCP.
                    </p>
                  </motion.div>
                )}

                {/* Credits */}
                {section === "credits" && (
                  <motion.div
                    key="credits"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease }}
                    className="px-6 pb-6 space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {PACKS.map((pack, i) => {
                        const isMiddle = i === 1
                        return (
                          <motion.button
                            key={pack.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 + i * 0.04, duration: 0.2, ease }}
                            onClick={() => handleCheckout(pack.key)}
                            disabled={!!loadingProduct}
                            className="group relative rounded-xl p-5 text-center transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
                            style={{
                              background: "var(--surface)",
                              border: isMiddle ? "1.5px solid var(--accent)" : "1px solid var(--line)",
                            }}
                          >
                            {isMiddle && (
                              <div
                                className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full opacity-[0.06] pointer-events-none"
                                style={{ background: "var(--accent)", filter: "blur(24px)" }}
                              />
                            )}
                            <div className="relative">
                              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>
                                {pack.label}
                              </p>
                              <p className="text-2xl font-bold tracking-tighter mb-0.5" style={{ color: "var(--accent)" }}>
                                {pack.credits}
                              </p>
                              <p className="text-[10px] mb-3" style={{ color: "var(--text-faint)" }}>
                                cr&eacute;dits
                              </p>
                              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                {pack.price}&euro;
                              </p>
                            </div>
                            {loadingProduct === pack.key && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: "var(--surface)" }}>
                                <LoadingDots />
                              </div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>

                    {/* Explainer */}
                    <div className="flex items-center justify-center gap-6 py-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3" style={{ color: "#f59e0b" }} />
                        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Rapide = 1 cr&eacute;dit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />
                        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Qualit&eacute; = 3 cr&eacute;dits</span>
                      </div>
                    </div>

                    {/* BYOK note — only for paid plans */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                    >
                      <Key className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Les plans payants incluent le BYOK : branche ta propre cl&eacute; API et utilise l&apos;IA sans cr&eacute;dits.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: "currentColor" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

const TIER_RANK: Record<PlanTier, number> = { free: 0, solo: 1, studio: 2, agency: 3 }
