/**
 * AI thinking dots — pure CSS animation (off main thread).
 * Replaces 4 separate Framer Motion dot animations.
 */
interface Props {
  size?: "sm" | "md"
  className?: string
}

export default function AiDots({ size = "md", className = "" }: Props) {
  return (
    <span className={`ai-dots ai-dots--${size} inline-flex items-center gap-[3px] ${className}`}>
      <span />
      <span />
      <span />
    </span>
  )
}
