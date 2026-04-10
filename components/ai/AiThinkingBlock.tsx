import type { LucideIcon } from "lucide-react"
import AiDots from "./AiDots"
import AiStatusText from "./AiStatusText"
import AiPulseRing from "./AiPulseRing"

/**
 * Unified AI thinking indicator.
 *
 * - `inline`: horizontal dots + status text. For AiBar, AiChatPanel.
 * - `centered`: vertical stack with pulse ring. For NewProjectModal.
 */
interface Props {
  variant: "inline" | "centered"
  status?: string
  /** Center icon for `centered` variant */
  icon?: LucideIcon
  className?: string
}

export default function AiThinkingBlock({ variant, status, icon, className = "" }: Props) {
  if (variant === "centered") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <AiPulseRing icon={icon} />
        <div className="flex items-center gap-2">
          <AiDots />
          <AiStatusText text={status || "R\u00e9flexion en cours\u2026"} />
        </div>
      </div>
    )
  }

  // inline
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AiDots />
      <AiStatusText text={status || "R\u00e9flexion en cours\u2026"} />
    </div>
  )
}
