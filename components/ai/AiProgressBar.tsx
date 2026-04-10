"use client"

import { motion } from "framer-motion"

/**
 * AI progress bar — indeterminate (CSS) or determinate (Framer Motion for smooth width).
 */
interface Props {
  /** 0-100 for determinate, undefined for indeterminate */
  progress?: number
  className?: string
}

export default function AiProgressBar({ progress, className = "" }: Props) {
  return (
    <div
      className={`w-full h-1 rounded-full overflow-hidden ${className}`}
      style={{ background: "var(--surface-hover)" }}
    >
      {progress !== undefined ? (
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      ) : (
        <div className="ai-progress-bar" />
      )}
    </div>
  )
}
