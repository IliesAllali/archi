"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Key, ChevronRight, Settings } from "lucide-react"
import {
  getStoredApiKey,
  getStoredProvider,
  isByokEnabled,
  setByokEnabled,
  getProviderConfig,
} from "@/lib/ai-providers"

interface Credits {
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
}

interface Props {
  className?: string
}

export default function AiSourcePicker({ className = "" }: Props) {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [byokKey, setByokKey] = useState("")
  const [byokActive, setByokActive] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const provider = getStoredProvider()
    const key = getStoredApiKey(provider)
    setByokKey(key)
    setByokActive(!!key && isByokEnabled())

    fetch("/api/me/ai-credits")
      .then(r => r.json())
      .then(data => setCredits(data))
      .catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selectSource = useCallback((source: "credits" | "byok") => {
    if (source === "credits") {
      setByokEnabled(false)
      setByokActive(false)
    } else {
      setByokEnabled(true)
      setByokActive(true)
    }
    setOpen(false)
  }, [])

  const provider = getStoredProvider()
  const providerConfig = getProviderConfig(provider)
  const hasKey = !!byokKey
  const remaining = credits?.creditsRemaining ?? 0
  const total = credits?.creditsTotal ?? 0
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const isLow = remaining <= 3 && remaining > 0
  const isEmpty = remaining <= 0

  // Masquer la clé : "sk-ant-•••4f2"
  const maskedKey = byokKey.length > 6
    ? byokKey.slice(0, 6) + "\u2022\u2022\u2022" + byokKey.slice(-3)
    : byokKey ? "\u2022\u2022\u2022" : ""

  // Badge couleur selon la source active
  const badgeBg = byokActive
    ? "var(--surface)"
    : isEmpty ? "var(--error-glow)" : isLow ? "var(--warning-bg)" : "var(--accent-muted)"
  const badgeColor = byokActive
    ? "var(--text-muted)"
    : isEmpty ? "var(--error-text)" : isLow ? "var(--warning-text)" : "var(--accent)"

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Badge trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs font-medium transition-all duration-150 active:scale-[0.97]"
        style={{ background: badgeBg, color: badgeColor }}
        title={byokActive ? `Cl\u00e9 ${providerConfig.label}` : `${remaining}/${total} cr\u00e9dits`}
      >
        {byokActive ? (
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

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full right-0 mb-2 w-[260px] rounded-xl overflow-hidden z-50"
            style={{
              background: "var(--elevated)",
              border: "1px solid var(--line-strong)",
              boxShadow: "var(--shadow-panel)",
              transformOrigin: "bottom right",
            }}
          >
            {/* Option 1: Credits */}
            <button
              onClick={() => selectSource("credits")}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all duration-100"
              style={{
                background: !byokActive ? "var(--accent-muted)" : "transparent",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {/* Radio dot */}
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: !byokActive ? "var(--accent)" : "var(--line-strong)",
                }}
              >
                {!byokActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />
                  <span className="text-2xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    Cr\u00e9dits Arbo
                  </span>
                  <span className="text-2xs" style={{ color: isEmpty ? "var(--error-text)" : "var(--text-faint)" }}>
                    {remaining}/{total}
                  </span>
                </div>
                {/* Progress bar */}
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

            {/* Option 2: BYOK */}
            {hasKey ? (
              <button
                onClick={() => selectSource("byok")}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all duration-100"
                style={{
                  background: byokActive ? "var(--accent-muted)" : "transparent",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor: byokActive ? "var(--accent)" : "var(--line-strong)",
                  }}
                >
                  {byokActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </div>
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
            ) : (
              <a
                href="/account"
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all duration-100"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 shrink-0"
                  style={{ borderColor: "var(--line-strong)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                    <span className="text-2xs font-medium" style={{ color: "var(--text-muted)" }}>
                      Ajouter une cl\u00e9 API
                    </span>
                  </div>
                  <p className="text-2xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                    Anthropic, OpenAI, Mistral
                  </p>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "var(--text-faint)" }} />
              </a>
            )}

            {/* Footer: Settings link */}
            <a
              href="/account"
              className="flex items-center gap-2 px-3.5 py-2.5 transition-all duration-100"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-muted)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-faint)"}
            >
              <Settings className="w-3 h-3" />
              <span className="text-2xs">G\u00e9rer dans Param\u00e8tres</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
