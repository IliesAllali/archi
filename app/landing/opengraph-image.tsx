import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Arbo — AI-powered visual sitemap builder"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L16 6L12 10L8 6L12 2Z" fill="white" />
          <path d="M5 11L9 15L5 19L1 15L5 11Z" fill="white" opacity="0.6" />
          <path d="M19 11L23 15L19 19L15 15L19 11Z" fill="white" opacity="0.6" />
          <line x1="9.5" y1="7.5" x2="6.5" y2="12.5" stroke="white" strokeWidth="1.2" opacity="0.4" />
          <line x1="14.5" y1="7.5" x2="17.5" y2="12.5" stroke="white" strokeWidth="1.2" opacity="0.4" />
        </svg>

        {/* Title */}
        <div
          style={{
            marginTop: 32,
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
          }}
        >
          arbo
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 16,
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.7)",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          AI-powered visual sitemap builder
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 24,
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <span>Text to sitemap</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span>AI editing</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span>Real-time collab</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span>PDF export</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
