"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Key, Plus } from "lucide-react"
import { getStoredApiKey, getStoredProvider } from "@/lib/ai-providers"

interface Credits {
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
}

interface Props {
  className?: string
  onByokActive?: (active: boolean) => void
}

export default function AiCreditsBadge({ className = "", onByokActive }: Props) {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [hasByok, setHasByok] = useState(false)

  useEffect(() => {
    // Check BYOK
    const key = getStoredApiKey(getStoredProvider())
    setHasByok(!!key)
    onByokActive?.(!!key)

    // Fetch credits
    fetch("/api/me/ai-credits")
      .then((r) => r.json())
      .then((data) => setCredits(data))
      .catch(() => {})
  }, [onByokActive])

  // If BYOK is active, show a subtle indicator
  if (hasByok) {
    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-2xs ${className}`}
        style={{ color: "var(--text-faint)" }}
        title="Clé API personnelle active"
      >
        <Key className="w-3 h-3" />
        <span>BYOK</span>
      </div>
    )
  }

  if (!credits) return null

  const remaining = credits.creditsRemaining
  const total = credits.creditsTotal
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const isLow = remaining <= 3 && remaining > 0
  const isEmpty = remaining <= 0

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs font-medium ${className}`}
      style={{
        background: isEmpty
          ? "var(--error-glow)"
          : isLow
          ? "var(--warning-bg)"
          : "var(--accent-muted)",
        color: isEmpty
          ? "var(--error-text)"
          : isLow
          ? "var(--warning-text)"
          : "var(--accent)",
      }}
      title={`${remaining}/${total} crédits IA restants`}
    >
      <Sparkles className="w-3 h-3" />
      <span>{remaining}/{total}</span>
      {/* Mini progress bar */}
      <div
        className="w-8 h-1 rounded-full overflow-hidden"
        style={{ background: "var(--surface-hover)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isEmpty ? "var(--error-text)" : isLow ? "var(--warning-text)" : "var(--accent)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {isEmpty && (
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/checkout?product=credits_starter")
              if (!res.ok) throw new Error()
              const { url } = await res.json()
              if (url) {
                const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed")
                const checkout = await PolarEmbedCheckout.create(url, { theme: "dark" })
                checkout.addEventListener("success", () => { window.location.reload() })
              }
            } catch { /* fallback */ }
          }}
          className="flex items-center gap-0.5 ml-1 hover:underline"
          style={{ color: "var(--error-text)" }}
        >
          <Plus className="w-2.5 h-2.5" />
          <span>Recharger</span>
        </button>
      )}
    </div>
  )
}

/**
 * Refresh credits after an AI call.
 * Call this from parent components after successful AI usage.
 */
export async function fetchCredits(): Promise<Credits | null> {
  try {
    const res = await fetch("/api/me/ai-credits")
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
