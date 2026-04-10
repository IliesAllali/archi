/**
 * Pulsing status text — pure CSS animation.
 * Used during AI processing to show current step.
 */
interface Props {
  text: string
  className?: string
}

export default function AiStatusText({ text, className = "" }: Props) {
  return (
    <p
      className={`ai-status-text text-2xs font-medium truncate ${className}`}
      style={{ color: "var(--text-secondary)" }}
    >
      {text}
    </p>
  )
}
