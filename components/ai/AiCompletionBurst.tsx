"use client"

import { Check } from "lucide-react"

/**
 * Delightful completion animation — a satisfying check mark with ring burst.
 * Plays once when AI finishes a task. Pure CSS animation (no Framer Motion).
 *
 * Inspired by Michal Malewicz's "delight" principle:
 * the moment of completion should feel rewarding, not just informative.
 */
interface Props {
  /** Number of modifications applied */
  count?: number
  /** Optional label text */
  label?: string
  className?: string
}

export default function AiCompletionBurst({ count, label, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center gap-2.5 ${className}`}>
      {/* Ring burst + check */}
      <div
        className="ai-completion-ring w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "var(--success-bg)" }}
      >
        <Check
          className="ai-completion-check w-5 h-5"
          style={{ color: "var(--success-text)" }}
        />
      </div>

      {/* Count + label */}
      {(count !== undefined || label) && (
        <div className="text-center">
          {count !== undefined && (
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {count} modification{count > 1 ? "s" : ""} appliqu\u00e9e{count > 1 ? "s" : ""}
            </p>
          )}
          {label && (
            <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
