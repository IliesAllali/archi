import { ACTION_ICONS, ACTION_COLORS, ACTION_SYMBOLS, type AiActionType } from "./ai-tokens"

interface Props {
  type: AiActionType
  label?: string
  /** Stagger index for cascading entrance (40ms per step) */
  index?: number
  size?: "sm" | "md"
  className?: string
}

export default function AiActionPill({ type, label, index = 0, size = "sm", className = "" }: Props) {
  const Icon = ACTION_ICONS[type] || ACTION_ICONS.update
  const colors = ACTION_COLORS[type] || ACTION_COLORS.update

  const sizeClasses = size === "sm"
    ? "text-[10px] px-2 py-0.5 gap-1"
    : "text-2xs px-2.5 py-1 gap-1.5"

  const iconSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"

  return (
    <span
      className={`ai-pill-enter inline-flex items-center font-medium rounded-full ${sizeClasses} ${className}`}
      style={{
        background: colors.bg,
        color: colors.text,
        animationDelay: `${index * 40}ms`,
        animationFillMode: "both",
      }}
    >
      <Icon className={iconSize} />
      {label || ACTION_SYMBOLS[type]}
    </span>
  )
}
