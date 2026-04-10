import type { LucideIcon } from "lucide-react"
import { Sparkles } from "lucide-react"

/**
 * Concentric pulsing rings with a center icon — pure CSS.
 * Used in NewProjectModal for AI generate and site import thinking states.
 */
interface Props {
  icon?: LucideIcon
  size?: "sm" | "md"
  className?: string
}

export default function AiPulseRing({ icon: Icon = Sparkles, size = "md", className = "" }: Props) {
  const dimensions = size === "sm" ? "w-10 h-10" : "w-12 h-12"
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"

  return (
    <div className={`ai-ring ${dimensions} flex items-center justify-center ${className}`}>
      <Icon className={iconSize} style={{ color: "var(--accent)" }} />
    </div>
  )
}
