import { Plus, Pencil, Trash, ArrowRight, type LucideIcon } from "lucide-react"

/* ── Shared AI action constants ─────────────────────────────────────────────
 * Single source of truth for action icons, colors, and labels.
 * Used by AiBar, AiChatPanel, AiActionPill, and InlineResponseCard.
 * Colors use CSS variables for dark mode support.
 * ────────────────────────────────────────────────────────────────────────── */

export type AiActionType = "add" | "update" | "delete" | "move"

export const ACTION_ICONS: Record<AiActionType, LucideIcon> = {
  add: Plus,
  update: Pencil,
  delete: Trash,
  move: ArrowRight,
}

export const ACTION_COLORS: Record<AiActionType, { bg: string; text: string }> = {
  add:    { bg: "var(--success-bg)", text: "var(--success-text)" },
  delete: { bg: "var(--error-glow)", text: "var(--error-text)" },
  update: { bg: "var(--accent-muted)", text: "var(--accent)" },
  move:   { bg: "var(--info-bg)", text: "var(--info-text)" },
}

export const ACTION_LABELS: Record<AiActionType, string> = {
  add: "Ajouter",
  update: "Modifier",
  delete: "Supprimer",
  move: "D\u00e9placer",
}

export const ACTION_SYMBOLS: Record<AiActionType, string> = {
  add: "+",
  update: "\u270F",
  delete: "\u2212",
  move: "\u2192",
}
