import type { Components } from "react-markdown"

/**
 * Shared ReactMarkdown component configs for AI responses.
 * - `compact`: for AiBar inline response cards (smaller, fewer elements)
 * - `full`: for AiChatPanel message bubbles (full markdown support)
 */

export const compactMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-xs leading-[1.6] mb-2 last:mb-0" style={{ color: "var(--text-primary)" }}>
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => (
    <ul className="list-disc pl-3.5 mb-2 space-y-0.5 text-xs" style={{ color: "var(--text-primary)" }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-3.5 mb-2 space-y-0.5 text-xs" style={{ color: "var(--text-primary)" }}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-xs leading-[1.5]">{children}</li>,
  code: ({ children }) => (
    <code
      className="text-[10px] px-1 py-0.5 rounded font-mono"
      style={{ background: "var(--surface-hover)", color: "var(--accent)" }}
    >
      {children}
    </code>
  ),
}

export const fullMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-[13px] leading-[1.7] mb-3 last:mb-0" style={{ color: "var(--text-primary)" }}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>{children}</strong>
  ),
  em: ({ children }) => <em style={{ color: "var(--text-secondary)" }}>{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-3 space-y-1.5" style={{ color: "var(--text-primary)" }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-3 space-y-1.5" style={{ color: "var(--text-primary)" }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[13px] leading-[1.6]" style={{ color: "var(--text-primary)" }}>{children}</li>
  ),
  h1: ({ children }) => (
    <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="text-[13px] font-bold mb-2 mt-3 first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold mb-1.5 mt-2.5 first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h3>
  ),
  code: ({ children }) => (
    <code
      className="text-2xs px-1.5 py-0.5 rounded font-mono"
      style={{ background: "var(--surface-hover)", color: "var(--accent)" }}
    >
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="pl-3.5 my-3 text-[13px]"
      style={{ borderLeft: "3px solid var(--accent)", color: "var(--text-muted)" }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3" style={{ borderColor: "var(--line)" }} />,
}
