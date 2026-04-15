"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Key, ChevronRight, Settings, Plus } from "lucide-react"
import {
  getStoredApiKey,
  getStoredProvider,
  isByokEnabled,
  setByokEnabled,
  getProviderConfig,
} from "@/lib/ai-providers"
import { CREDIT_PACKS } from "@/lib/plans"
import { Events } from "@/lib/posthog"

interface Credits {
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
}

interface Props {
  className?: string
}

const PACKS = [
  { key: "credits_starter", ...CREDIT_PACKS.starter },
  { key: "credits_pro", ...CREDIT_PACKS.pro },
  { key: "credits_power", ...CREDIT_PACKS.power },
] as const

export default function AiSourcePicker({ className = "" }: Props) {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [byokKey, setByokKey] = useState("")
  const [byokActive, setByokActive] = useState(false)
  const [open, setOpen] = useState(false)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [planTier, setPlanTier] = useState<string>("free")
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const isPaid = planTier !== "free"

  useEffect(() => {
    const provider = getStoredProvider()
    const key = getStoredApiKey(provider)
    setByokKey(key)
    setByokActive(!!key && isByokEnabled() && isPaid)

    fetch("/api/me/ai-credits")
      .then(r => r.json())
      .then(data => setCredits(data))
      .catch(() => {})

    fetch("/api/me/plan")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.tier) setPlanTier(data.tier) })
      .catch(() => {})
  }, [])

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const selectSource = useCallback((source: "credits" | "byok") => {
    setByokEnabled(source === "byok")
    setByokActive(source === "byok")
    if (source === "byok") Events.byokActivated(getStoredProvider())
    setOpen(false)
  }, [])

  const handleBuyCredits = useCallback(async (packKey: string) => {
    setLoadingPack(packKey)
    try {
      const res = await fetch(`/api/checkout?product=${packKey}`)
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      if (url) {
        const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed")
        const checkout = await PolarEmbedCheckout.create(url, { theme: "dark" })
        checkout.addEventListener("success", () => {
          window.location.reload()
        })
      }
    } catch {
      window.open(`/api/checkout?product=${packKey}`, "_blank")
    } finally {
      setLoadingPack(null)
    }
  }, [])

  const provider = getStoredProvider()
  const providerConfig = getProviderConfig(provider)
  const hasKey = !!byokKey
  const remaining = credits?.creditsRemaining ?? 0
  const total = credits?.creditsTotal ?? 0
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const isLow = remaining <= 3 && remaining > 0
  const isEmpty = remaining <= 0

  const maskedKey = byokKey.length > 6
    ? byokKey.slice(0, 6) + "\u2022\u2022\u2022" + byokKey.slice(-3)
    : byokKey ? "\u2022\u2022\u2022" : ""

  // Force disable BYOK for free plans
  const effectiveByokActive = byokActive && isPaid

  const badgeBg = effectiveByokActive
    ? "var(--surface)"
    : isEmpty ? "var(--error-glow)" : isLow ? "var(--warning-bg)" : "var(--accent-muted)"
  const badgeColor = effectiveByokActive
    ? "var(--text-muted)"
    : isEmpty ? "var(--error-text)" : isLow ? "var(--warning-text)" : "var(--accent)"

  // Compute popover position from button rect
  const getPos = () => {
    if (!btnRef.current) return { bottom: 0, right: 0 }
    const r = btnRef.current.getBoundingClientRect()
    return {
      bottom: window.innerHeight - r.top + 6,
      right: window.innerWidth - r.right,
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
        style={{ background: badgeBg, color: badgeColor }}
      >
        {effectiveByokActive ? (
          <>
            <Key className="w-3 h-3" />
            <span>{providerConfig.label.split(" (")[0]}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            <span>{remaining}/{total}</span>
            <div className="w-6 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-hover)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: isEmpty ? "var(--error-text)" : isLow ? "var(--warning-text)" : "var(--accent)",
                }}
              />
            </div>
          </>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="fixed w-[260px] rounded-xl overflow-hidden"
              style={{
                ...getPos(),
                zIndex: 9999,
                background: "var(--elevated)",
                border: "1px solid var(--line-strong)",
                boxShadow: "var(--shadow-panel)",
                transformOrigin: "bottom right",
              }}
            >
              {/* Credits */}
              <button
                onClick={() => selectSource("credits")}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors"
                style={{
                  background: !effectiveByokActive ? "var(--accent-muted)" : "transparent",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <RadioDot active={!effectiveByokActive} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />
                    <span className="text-2xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      Cr&eacute;dits Arbo
                    </span>
                    <span className="text-2xs" style={{ color: isEmpty ? "var(--error-text)" : "var(--text-faint)" }}>
                      {remaining}/{total}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden mt-1.5" style={{ background: "var(--surface-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: isEmpty ? "var(--error-text)" : isLow ? "var(--warning-text)" : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              </button>

              {/* BYOK key — paid plans only */}
              {isPaid && hasKey ? (
                <button
                  onClick={() => selectSource("byok")}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors"
                  style={{
                    background: effectiveByokActive ? "var(--accent-muted)" : "transparent",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <RadioDot active={effectiveByokActive} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                      <span className="text-2xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {providerConfig.label.split(" (")[0]}
                      </span>
                    </div>
                    <p className="text-2xs mt-0.5 font-mono truncate" style={{ color: "var(--text-faint)" }}>
                      {maskedKey}
                    </p>
                  </div>
                </button>
              ) : isPaid && !hasKey ? (
                <a
                  href="/account"
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <RadioDot active={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                      <span className="text-2xs font-medium" style={{ color: "var(--text-muted)" }}>
                        Ajouter une cl&eacute; API
                      </span>
                    </div>
                    <p className="text-2xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                      Anthropic, OpenAI, Mistral
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "var(--text-faint)" }} />
                </a>
              ) : null}

              {/* Credit packs — show when low or empty */}
              {remaining < 10 && !effectiveByokActive && (
                <div
                  className="px-3.5 py-3 space-y-2.5"
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                    Recharger
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PACKS.map((pack) => (
                      <button
                        key={pack.key}
                        onClick={() => handleBuyCredits(pack.key)}
                        disabled={!!loadingPack}
                        className="flex flex-col items-center gap-1 px-1.5 py-2 rounded-lg text-center transition-all duration-150 ease-out hover:-translate-y-[1px] hover:border-[var(--accent)] hover:shadow-sm active:scale-[0.97] disabled:opacity-50"
                        style={{ background: "var(--elevated)", border: "1px solid var(--line)" }}
                      >
                        <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                          {pack.credits}
                        </span>
                        <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>
                          {pack.price}&euro;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <a
                href="/account"
                className="flex items-center gap-2 px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-faint)" }}
              >
                <Settings className="w-3 h-3" />
                <span className="text-2xs">G&eacute;rer dans Param&egrave;tres</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
      style={{ borderColor: active ? "var(--accent)" : "var(--line-strong)" }}
    >
      {active && (
        <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
      )}
    </div>
  )
}
