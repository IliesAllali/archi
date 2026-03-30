"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

/* ─── Scale factor: real canvas ~1100x900 → illustration ─── */
const S = 0.58

function s(v: number) {
  return v * S
}

/* ─── Ease curve ─── */
const ease = [0.16, 1, 0.3, 1] as const

/* ─── Node data ─── */
interface NodeDef {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  type: "home-expanded" | "expanded" | "compact" | "utility"
  childrenCount?: string
  opacity?: number
  level: number
}

const nodes: NodeDef[] = [
  { id: "accueil", label: "Accueil", x: 457, y: 156, w: 200, h: 345, type: "home-expanded", childrenCount: "6\u2193", level: 0 },
  { id: "ressources", label: "Ressources", x: 170, y: 584, w: 110, h: 33, type: "compact", childrenCount: "2\u2193", level: 1 },
  { id: "documentation", label: "Documentation", x: 328, y: 693, w: 110, h: 48, type: "utility", opacity: 0.65, level: 1 },
  { id: "carrieres", label: "Carri\u00e8res", x: 486, y: 693, w: 110, h: 33, type: "utility", opacity: 0.65, level: 1 },
  { id: "fonctionnalites", label: "Fonctionnalit\u00e9s", x: 570, y: 583, w: 110, h: 33, type: "compact", level: 1 },
  { id: "tarification", label: "Tarification", x: 750, y: 583, w: 110, h: 33, type: "compact", level: 1 },
  { id: "solutions", label: "Solutions", x: 960, y: 583, w: 110, h: 33, type: "compact", childrenCount: "2\u2193", level: 1 },
  { id: "blog", label: "Blog", x: 12, y: 693, w: 110, h: 33, type: "compact", level: 2 },
  { id: "webinaires", label: "Webinaires", x: 170, y: 693, w: 110, h: 33, type: "compact", level: 2 },
  { id: "entreprise", label: "Entreprise", x: 734, y: 741, w: 200, h: 316, type: "expanded", level: 2 },
  { id: "startups", label: "Startups", x: 982, y: 693, w: 110, h: 33, type: "compact", level: 2 },
]

/* ─── Edge data ─── */
interface EdgeDef {
  from: string
  to: string
}

const edges: EdgeDef[] = [
  { from: "accueil", to: "ressources" },
  { from: "accueil", to: "documentation" },
  { from: "accueil", to: "carrieres" },
  { from: "accueil", to: "fonctionnalites" },
  { from: "accueil", to: "tarification" },
  { from: "accueil", to: "solutions" },
  { from: "ressources", to: "blog" },
  { from: "ressources", to: "webinaires" },
  { from: "solutions", to: "entreprise" },
  { from: "solutions", to: "startups" },
]

/* ─── Helpers ─── */
function getNode(id: string) {
  return nodes.find((n) => n.id === id)!
}

function edgePath(e: EdgeDef) {
  const from = getNode(e.from)
  const to = getNode(e.to)
  const x1 = s(from.x + from.w / 2)
  const y1 = s(from.y + from.h)
  const x2 = s(to.x + to.w / 2)
  const y2 = s(to.y)
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
}

/* ─── Wireframe Sections ─── */

function WfNavigation() {
  return (
    <div
      style={{
        background: "rgba(139,147,165,0.10)",
        borderLeft: "3px solid rgba(139,147,165,0.45)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Navigation</span>
      </div>
      <div style={{ height: 10.4, display: "flex", alignItems: "center", gap: 6, padding: "0 2px" }}>
        <div style={{ width: 12, height: 3, borderRadius: 1, background: "var(--wireframe-strong)" }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
      </div>
    </div>
  )
}

function WfHeroSection() {
  return (
    <div
      style={{
        background: "rgba(124,93,250,0.09)",
        borderLeft: "3px solid rgba(124,93,250,0.55)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Hero Section</span>
      </div>
      <div
        style={{
          height: 36.4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <div style={{ width: "55%", height: 3, borderRadius: 1, background: "var(--wireframe-strong)" }} />
        <div style={{ width: "38%", height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 26, height: 6, borderRadius: 2, background: "var(--accent)", opacity: 0.7 }} />
      </div>
    </div>
  )
}

function WfFonctionnalites() {
  return (
    <div
      style={{
        background: "rgba(67,140,245,0.09)",
        borderLeft: "3px solid rgba(67,140,245,0.50)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Fonctionnalit\u00e9s</span>
      </div>
      <div
        style={{
          height: 32.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "100%",
              borderRadius: 2,
              background: "var(--wireframe-faint)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: 2,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--wireframe-strong)", opacity: 0.5 }} />
            <div style={{ width: "80%", height: 2, borderRadius: 1, background: "var(--wireframe-strong)", opacity: 0.4 }} />
            <div style={{ width: "60%", height: 1.5, borderRadius: 1, background: "var(--wireframe-faint)" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function WfSocialProof() {
  return (
    <div
      style={{
        background: "rgba(100,140,255,0.08)",
        borderLeft: "3px solid rgba(100,140,255,0.40)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Social Proof</span>
      </div>
      <div
        style={{
          height: 19.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 6,
              borderRadius: 1,
              background: "var(--wireframe-faint)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WfCTA() {
  return (
    <div
      style={{
        background: "rgba(94,106,210,0.08)",
        borderLeft: "3px solid rgba(94,106,210,0.70)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>CTA Principal</span>
      </div>
      <div
        style={{
          height: 15.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            width: 28,
            height: 7,
            borderRadius: 2,
            background: "var(--accent)",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            width: 28,
            height: 7,
            borderRadius: 2,
            border: "1px solid var(--accent)",
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  )
}

function WfFooter() {
  return (
    <div
      style={{
        background: "rgba(100,116,139,0.08)",
        borderLeft: "3px solid rgba(100,116,139,0.35)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Footer</span>
      </div>
      <div
        style={{
          height: 15.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2px",
        }}
      >
        <div style={{ width: 10, height: 4, borderRadius: 1, background: "var(--wireframe-strong)", opacity: 0.5 }} />
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
          <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
          <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Entreprise wireframe sections ─── */

function WfEntNavigation() {
  return (
    <div
      style={{
        background: "rgba(139,147,165,0.10)",
        borderLeft: "3px solid rgba(139,147,165,0.45)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Navigation</span>
      </div>
      <div style={{ height: 10.4, display: "flex", alignItems: "center", gap: 6, padding: "0 2px" }}>
        <div style={{ width: 12, height: 3, borderRadius: 1, background: "var(--wireframe-strong)" }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
      </div>
    </div>
  )
}

function WfHeroEnterprise() {
  return (
    <div
      style={{
        background: "rgba(124,93,250,0.09)",
        borderLeft: "3px solid rgba(124,93,250,0.55)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Hero Enterprise</span>
      </div>
      <div
        style={{
          height: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <div style={{ width: "50%", height: 3, borderRadius: 1, background: "var(--wireframe-strong)" }} />
        <div style={{ width: "35%", height: 2, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 24, height: 6, borderRadius: 2, background: "var(--accent)", opacity: 0.6 }} />
      </div>
    </div>
  )
}

function WfArgumentsCles() {
  return (
    <div
      style={{
        background: "rgba(67,140,245,0.09)",
        borderLeft: "3px solid rgba(67,140,245,0.50)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Arguments cl\u00e9s</span>
      </div>
      <div
        style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--wireframe-strong)", opacity: 0.4 }} />
            <div style={{ width: 14, height: 1.5, borderRadius: 1, background: "var(--wireframe-faint)" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function WfEtudesCas() {
  return (
    <div
      style={{
        background: "rgba(100,140,255,0.08)",
        borderLeft: "3px solid rgba(100,140,255,0.40)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>\u00c9tudes de cas</span>
      </div>
      <div
        style={{
          height: 19.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 14, height: 6, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        ))}
      </div>
    </div>
  )
}

function WfFormulaireContact() {
  return (
    <div
      style={{
        background: "rgba(94,106,210,0.08)",
        borderLeft: "3px solid rgba(94,106,210,0.70)",
        borderRadius: 2,
        padding: "3px 6px",
      }}
    >
      <div style={{ minHeight: 16, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--label-color)", opacity: 0.7 }}>Formulaire contact</span>
      </div>
      <div
        style={{
          height: 22,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 3,
          padding: "0 4px",
        }}
      >
        <div style={{ width: "100%", height: 4, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: "100%", height: 4, borderRadius: 1, background: "var(--wireframe-faint)" }} />
        <div style={{ width: 20, height: 5, borderRadius: 2, background: "var(--accent)", opacity: 0.5, alignSelf: "flex-end" }} />
      </div>
    </div>
  )
}

/* ─── Card Components ─── */

function HomeExpandedCard({ node, delay }: { node: NodeDef; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease }}
      style={{
        position: "absolute",
        left: s(node.x),
        top: s(node.y),
        width: s(node.w),
        height: s(node.h),
        background: "var(--card-bg)",
        borderRadius: 4,
        boxShadow: "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)",
        overflow: "hidden",
        transformOrigin: "center top",
      }}
    >
      {/* Top strip */}
      <div style={{ height: 4, background: "var(--accent)" }} />
      {/* Title bar */}
      <div
        style={{
          height: 32 * S,
          background: "var(--accent-muted)",
          borderBottom: "1px solid var(--accent-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 6px",
        }}
      >
        <span style={{ fontSize: 13 * S, lineHeight: "18px", fontWeight: "bold", color: "var(--title-color)" }}>
          {node.label}
        </span>
        {node.childrenCount && (
          <span style={{ fontSize: 9 * S, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7 }}>
            {node.childrenCount}
          </span>
        )}
      </div>
      {/* Wireframe sections */}
      <div style={{ padding: 6 * S, display: "flex", flexDirection: "column", gap: 3 * S }}>
        <WfNavigation />
        <WfHeroSection />
        <WfFonctionnalites />
        <WfSocialProof />
        <WfCTA />
        <WfFooter />
      </div>
    </motion.div>
  )
}

function ExpandedCard({ node, delay }: { node: NodeDef; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      style={{
        position: "absolute",
        left: s(node.x),
        top: s(node.y),
        width: s(node.w),
        height: s(node.h),
        background: "var(--card-bg)",
        borderRadius: 4,
        boxShadow: "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)",
        overflow: "hidden",
      }}
    >
      {/* Top strip */}
      <div style={{ height: 4, background: "var(--accent)" }} />
      {/* Title bar */}
      <div
        style={{
          height: 32 * S,
          background: "var(--card-title-bg)",
          borderBottom: "1px solid var(--card-title-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 6px",
        }}
      >
        <span style={{ fontSize: 13 * S, lineHeight: "18px", fontWeight: "bold", color: "var(--title-color)" }}>
          {node.label}
        </span>
      </div>
      {/* Wireframe sections */}
      <div style={{ padding: 6 * S, display: "flex", flexDirection: "column", gap: 3 * S }}>
        <WfEntNavigation />
        <WfHeroEnterprise />
        <WfArgumentsCles />
        <WfEtudesCas />
        <WfFormulaireContact />
      </div>
    </motion.div>
  )
}

function CompactCard({ node, delay }: { node: NodeDef; delay: number }) {
  const isUtility = node.type === "utility"
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      style={{
        position: "absolute",
        left: s(node.x),
        top: s(node.y),
        width: s(node.w),
        height: s(node.h),
        background: "var(--card-bg)",
        borderRadius: 4,
        boxShadow: isUtility
          ? "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--card-ring)"
          : "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)",
        overflow: "hidden",
        opacity: node.opacity ?? 1,
      }}
    >
      {/* Top strip */}
      <div
        style={{
          height: 3,
          background: isUtility ? "var(--line-strong)" : "var(--accent)",
        }}
      />
      {/* Title area */}
      <div
        style={{
          padding: `${7 * S}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11 * S,
            lineHeight: `${15 * S}px`,
            fontWeight: "bold",
            color: "var(--title-color)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {node.label}
        </span>
        {node.childrenCount && (
          <span
            style={{
              fontSize: 9 * S,
              fontFamily: "monospace",
              color: "var(--label-color)",
              opacity: 0.7,
              marginLeft: 2,
              flexShrink: 0,
            }}
          >
            {node.childrenCount}
          </span>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Diamond Logo SVG (matches app Logo component) ─── */
function DiamondLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)" />
      <path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6" />
      <path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6" />
      <line x1="9.5" y1="7.5" x2="6.5" y2="12.5" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4" />
      <line x1="14.5" y1="7.5" x2="17.5" y2="12.5" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4" />
    </svg>
  )
}

/* ─── Top App Chrome ─── */
function AppChrome() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0, ease }}
      style={{
        height: 44,
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        flexShrink: 0,
      }}
    >
      {/* Left: logo + project name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <DiamondLogo />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>arbo</span>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>/</span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>SaaS Startup</span>
      </div>
      {/* Right: fake UI */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: "var(--wireframe-faint)",
          }}
        />
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--wireframe-faint)",
            border: "1.5px solid var(--line)",
          }}
        />
      </div>
    </motion.div>
  )
}

/* ─── Dot grid background ─── */
function DotGrid() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    />
  )
}

/* ─── Main Component ─── */
export default function HeroTreeIllustration() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  /* Compute total scaled canvas size */
  const canvasW = s(1150)
  const canvasH = s(1100)

  /* Delay map by level */
  const levelDelays: Record<number, number> = { 0: 0.1, 1: 0.4, 2: 0.65 }

  return (
    <div
      ref={ref}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--line)",
        background: "var(--canvas-bg)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 80px rgba(0,0,0,0.08)",
        width: "100%",
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      {inView && (
        <>
          <AppChrome />

          {/* Tree area */}
          <div
            style={{
              position: "relative",
              width: canvasW,
              height: canvasH,
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <DotGrid />

            {/* Edges SVG */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: canvasW,
                height: canvasH,
                pointerEvents: "none",
              }}
            >
              {edges.map((e, i) => (
                <motion.path
                  key={`${e.from}-${e.to}`}
                  d={edgePath(e)}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth={1.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + i * 0.05,
                    ease,
                  }}
                />
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const delay = levelDelays[node.level] ?? 0.5
              const stagger = nodes.filter((n) => n.level === node.level).indexOf(node) * 0.06

              if (node.type === "home-expanded") {
                return <HomeExpandedCard key={node.id} node={node} delay={delay + stagger} />
              }
              if (node.type === "expanded") {
                return <ExpandedCard key={node.id} node={node} delay={delay + stagger} />
              }
              return <CompactCard key={node.id} node={node} delay={delay + stagger} />
            })}
          </div>
        </>
      )}
    </div>
  )
}
