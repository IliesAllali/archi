"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
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
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

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

  const maskedKey = byokKey.length > 6
    ? byokKey.slice(0, 6) + "\u2022\u2022\u2022" + byokKey.slice(-3)
    : byokKey ? "\u2022\u2022\u2022" : ""

  const badgeBg = byokActive
    ? "var(--surface)"
    : isEmpty ? "var(--error-glow)" : isLow ? "var(--warning-bg)" : "var(--accent-muted)"
  const badgeColor = byokActive
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
                  background: !byokActive ? "var(--accent-muted)" : "transparent",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <RadioDot active={!byokActive} />
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

              {/* BYOK key */}
              {hasKey ? (
                <button
                  onClick={() => selectSource("byok")}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors"
                  style={{
                    background: byokActive ? "var(--accent-muted)" : "transparent",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <RadioDot active={byokActive} />
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
