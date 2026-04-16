"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const ease = [0.16, 1, 0.3, 1] as const
const CANVAS_W = 1100
const CANVAS_H = 920
const CHROME_H = 44

/* ─── Nodes ─── */
const nodes = [
  { id: "accueil", label: "Accueil", x: 457, y: 0, w: 200, h: 345, type: "home-expanded" as const, childrenCount: "6↓", level: 0, pageType: "home" as const },
  { id: "ressources", label: "Ressources", x: 170, y: 428, w: 110, h: 33, type: "compact" as const, childrenCount: "2↓", level: 1, pageType: "hub" as const },
  { id: "documentation", label: "Documentation", x: 328, y: 537, w: 110, h: 48, type: "utility" as const, level: 1, pageType: "detail" as const },
  { id: "carrieres", label: "Carrières", x: 486, y: 537, w: 110, h: 33, type: "utility" as const, level: 1, pageType: "listing" as const },
  { id: "fonctionnalites", label: "Fonctionnalités", x: 570, y: 427, w: 110, h: 33, type: "compact" as const, level: 1, pageType: "landing" as const },
  { id: "tarification", label: "Tarification", x: 750, y: 427, w: 110, h: 33, type: "compact" as const, level: 1, pageType: "landing" as const },
  { id: "solutions", label: "Solutions", x: 960, y: 427, w: 110, h: 33, type: "compact" as const, childrenCount: "2↓", level: 1, pageType: "hub" as const },
  { id: "blog", label: "Blog", x: 12, y: 537, w: 110, h: 33, type: "compact" as const, level: 2, pageType: "listing" as const },
  { id: "webinaires", label: "Webinaires", x: 170, y: 537, w: 110, h: 33, type: "compact" as const, level: 2, pageType: "listing" as const },
  { id: "entreprise", label: "Entreprise", x: 734, y: 585, w: 200, h: 316, type: "expanded" as const, level: 2, pageType: "landing" as const },
  { id: "startups", label: "Startups", x: 982, y: 537, w: 110, h: 33, type: "compact" as const, level: 2, pageType: "landing" as const },
]

const edges = [
  { from: "accueil", to: "ressources" }, { from: "accueil", to: "documentation" },
  { from: "accueil", to: "carrieres" }, { from: "accueil", to: "fonctionnalites" },
  { from: "accueil", to: "tarification" }, { from: "accueil", to: "solutions" },
  { from: "ressources", to: "blog" }, { from: "ressources", to: "webinaires" },
  { from: "solutions", to: "entreprise" }, { from: "solutions", to: "startups" },
]

function getNode(id: string) { return nodes.find((n) => n.id === id)! }

function edgePath(from: string, to: string) {
  const f = getNode(from), t = getNode(to)
  const x1 = f.x + f.w / 2, y1 = f.y + f.h, x2 = t.x + t.w / 2, y2 = t.y
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
}

/* ═══ Wireframe Skins ═══ */

function WfSection({ label, bg, border, h, children }: { label: string; bg: string; border: string; h: number; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, borderLeft: `3px solid ${border}`, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ minHeight: 26, display: "flex", alignItems: "center", padding: "3px 4px 2px" }}>
        <span style={{ fontSize: 8.5, lineHeight: "11px", fontWeight: 600, color: "var(--label-color)" }}>{label}</span>
      </div>
      <div style={{ height: h }}>{children}</div>
    </div>
  )
}

function SkinNav() {
  return (<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 5px" }}>
    <div className="wf-strong" style={{ width: 12, height: 3, borderRadius: 1 }} />
    <div style={{ display: "flex", gap: 2 }}>{[0,1,2].map(i=><div key={i} className="wf-faint" style={{ width: 8, height: 2, borderRadius: 1 }} />)}</div>
  </div>)
}
function SkinHero() {
  return (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 3 }}>
    <div className="wf-strong" style={{ width: "55%", height: 3, borderRadius: 1 }} />
    <div className="wf-faint" style={{ width: "38%", height: 2, borderRadius: 1 }} />
    <div className="wf-strong" style={{ width: 26, height: 6, borderRadius: 2, marginTop: 2 }} />
  </div>)
}
function SkinCards() {
  return (<div style={{ display: "flex", gap: 2, height: "100%", padding: 3 }}>
    {[0,1,2].map(i=>(<div key={i} className="wf-card" style={{ flex: 1, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
      <div className="wf-faint" style={{ width: "100%", height: 10, borderRadius: 1 }} />
      <div className="wf-faint" style={{ width: "65%", height: 2, borderRadius: 1 }} />
      <div className="wf-faint" style={{ width: "45%", height: 2, borderRadius: 1 }} />
    </div>))}
  </div>)
}
function SkinSocialProof() {
  return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: "100%" }}>
    {[0,1,2,3,4].map(i=><div key={i} className="wf-faint" style={{ width: 14, height: 6, borderRadius: 1 }} />)}
  </div>)
}
function SkinDoubleCta() {
  return (<div style={{ display: "flex", gap: 4, height: "100%", padding: 4 }}>
    <div style={{ flex: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, background: "var(--accent)", opacity: 0.9 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.85)" }} />
      <div style={{ width: "42%", height: 2, borderRadius: 1, background: "rgba(255,255,255,0.85)" }} />
    </div>
    <div style={{ flex: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, border: "1px solid var(--accent)", opacity: 0.75 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--accent)" }} />
      <div style={{ width: "42%", height: 2, borderRadius: 1, background: "var(--accent)" }} />
    </div>
  </div>)
}
function SkinFooter() {
  return (<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 5px" }}>
    <div className="wf-faint" style={{ width: 10, height: 2, borderRadius: 1 }} />
    <div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i=><div key={i} className="wf-faint" style={{ width: 6, height: 2, borderRadius: 1 }} />)}</div>
  </div>)
}
function SkinArguments() {
  return (<div style={{ display: "flex", gap: 3, height: "100%", padding: 3 }}>
    {[0,1,2].map(i=>(<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 2 }}>
      <div className="wf-strong" style={{ width: 8, height: 8, borderRadius: "50%" }} />
      <div className="wf-faint" style={{ width: "75%", height: 2, borderRadius: 1 }} />
      <div className="wf-faint" style={{ width: "55%", height: 2, borderRadius: 1 }} />
    </div>))}
  </div>)
}
function SkinForm() {
  return (<div style={{ display: "flex", flexDirection: "column", gap: 4, height: "100%", padding: 5 }}>
    {[0,1,2,3].map(i=>(<div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <div className="wf-faint" style={{ width: "28%", height: 2, borderRadius: 1 }} />
      <div className="wf-border" style={{ width: "100%", height: 5, borderRadius: 2, borderWidth: 1, borderStyle: "solid" }} />
    </div>))}
  </div>)
}

/* ═══ Card Components ═══ */

function HomeExpandedCard({ delay, onClick, selected }: { delay: number; onClick: () => void; selected: boolean }) {
  const n = getNode("accueil")
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay, ease }}
      onClick={onClick}
      className="group/card"
      style={{
        position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, cursor: "pointer",
        background: "var(--card-bg)", borderRadius: 4, overflow: "hidden", transformOrigin: "center top",
        boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.14), 0 0 0 2px var(--accent)" : "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      whileHover={{ y: -2, boxShadow: "0 4px 18px rgba(0,0,0,0.14), 0 0 0 2px var(--accent)" }}>
      <div style={{ height: 4, background: "var(--accent)" }} />
      <div style={{ height: 32, background: "var(--accent-muted)", borderBottom: "1px solid var(--accent-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 7px" }}>
        <p style={{ fontSize: 13, lineHeight: "18px", fontWeight: 700, color: "var(--title-color)" }}>{n.label}</p>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7 }}>{n.childrenCount}</span>
      </div>
      <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        <WfSection label="Navigation" bg="rgba(139,147,165,0.10)" border="rgba(139,147,165,0.45)" h={10.4}><SkinNav /></WfSection>
        <WfSection label="Hero Section" bg="rgba(124,93,250,0.09)" border="rgba(124,93,250,0.55)" h={36.4}><SkinHero /></WfSection>
        <WfSection label="Fonctionnalités" bg="rgba(67,140,245,0.09)" border="rgba(67,140,245,0.50)" h={32.5}><SkinCards /></WfSection>
        <WfSection label="Social Proof" bg="rgba(100,140,255,0.08)" border="rgba(100,140,255,0.40)" h={19.5}><SkinSocialProof /></WfSection>
        <WfSection label="CTA Principal" bg="rgba(94,106,210,0.08)" border="rgba(94,106,210,0.70)" h={15.6}><SkinDoubleCta /></WfSection>
        <WfSection label="Footer" bg="rgba(100,116,139,0.08)" border="rgba(100,116,139,0.35)" h={15.6}><SkinFooter /></WfSection>
      </div>
    </motion.div>
  )
}

function ExpandedCard({ delay, onClick, selected }: { delay: number; onClick: () => void; selected: boolean }) {
  const n = getNode("entreprise")
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease }}
      onClick={onClick} style={{
        position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, cursor: "pointer",
        background: "var(--card-bg)", borderRadius: 4, overflow: "hidden",
        boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.12), 0 0 0 2px var(--accent)" : "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      whileHover={{ y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 0 0 1.5px var(--card-ring-hover)" }}>
      <div style={{ height: 4, background: "var(--accent)" }} />
      <div style={{ height: 32, background: "var(--card-title-bg)", borderBottom: "1px solid var(--card-title-border)", display: "flex", alignItems: "center", padding: "0 7px" }}>
        <p style={{ fontSize: 13, lineHeight: "18px", fontWeight: 700, color: "var(--title-color)" }}>{n.label}</p>
      </div>
      <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        <WfSection label="Navigation" bg="rgba(139,147,165,0.10)" border="rgba(139,147,165,0.45)" h={10.4}><SkinNav /></WfSection>
        <WfSection label="Hero Enterprise" bg="rgba(124,93,250,0.09)" border="rgba(124,93,250,0.55)" h={32.5}><SkinHero /></WfSection>
        <WfSection label="Arguments clés" bg="rgba(255,120,80,0.09)" border="rgba(255,120,80,0.50)" h={39}><SkinArguments /></WfSection>
        <WfSection label="Études de cas" bg="rgba(100,140,255,0.08)" border="rgba(100,140,255,0.40)" h={26}><SkinSocialProof /></WfSection>
        <WfSection label="Formulaire contact" bg="rgba(255,100,130,0.09)" border="rgba(255,100,130,0.50)" h={22}><SkinForm /></WfSection>
      </div>
    </motion.div>
  )
}

function CompactCard({ id, delay, onClick, selected }: { id: string; delay: number; onClick: () => void; selected: boolean }) {
  const n = getNode(id)
  const isUtility = n.type === "utility"
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: isUtility ? 0.65 : 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}
      onClick={onClick} style={{
        position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, cursor: "pointer",
        background: "var(--card-bg)", borderRadius: 4, overflow: "hidden",
        boxShadow: selected
          ? "0 4px 20px rgba(0,0,0,0.12), 0 0 0 2px var(--accent)"
          : isUtility ? "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--card-ring)" : "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      whileHover={{ y: -1, boxShadow: isUtility ? "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring-hover)" : "0 4px 16px rgba(0,0,0,0.12), 0 0 0 1.5px var(--card-ring-hover)" }}>
      {isUtility && <div style={{ height: 3, background: "var(--line-strong)" }} />}
      <div style={{ padding: 7, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card-title-bg)", borderBottom: "1px solid var(--card-title-border)" }}>
        <span style={{ fontSize: 11, lineHeight: "15px", fontWeight: 700, color: "var(--title-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</span>
        {n.childrenCount && <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7, marginLeft: 3, flexShrink: 0 }}>{n.childrenCount}</span>}
      </div>
    </motion.div>
  )
}

/* ═══ SVG Icons ═══ */
const I = ({ d, s: sz = 14 }: { d: string; s?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconChevronLeft = () => <I d="m15 18-6-6 6-6" />
const IconUndo = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>)
const IconRedo = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>)
const IconDownload = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>)
const IconShare = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>)
const IconMore = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>)
const IconMessageCircle = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>)
const IconSparkles = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>)
const IconGem = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 3 8 9l4 13 4-13-2.5-6" /><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" /><path d="M2 9h20" /></svg>)
const IconZap = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>)
const IconKey = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" /></svg>)
const IconSend = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>)
const IconX = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>)
const IconPlus = () => <I d="M5 12h14M12 5v14" />
const IconMinus = () => <I d="M5 12h14" />
const IconMaximize = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>)
const IconHome = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>)

const ArboLogo = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)" /><path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6" /><path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6" /></svg>)

/* ═══ Hover button wrapper ═══ */
function HBtn({ children, style, title, onClick, disabled }: {
  children: React.ReactNode; style?: React.CSSProperties; title?: string; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick} title={title} disabled={disabled}
      className="transition-colors duration-100 active:scale-95"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: disabled ? "default" : "pointer", background: "transparent", borderRadius: 6, ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
      onMouseLeave={e => { e.currentTarget.style.background = (style?.background as string) || "transparent" }}
    >{children}</button>
  )
}

/* ═══ Header Icons (pixel-perfect from real app) ═══ */
const IconUndo2 = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" /></svg>)
const IconRedo2 = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" /></svg>)
const IconFileDown = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>)
const IconCloud = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>)
const IconMsgCircle2 = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" /></svg>)
const IconEllipsis = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>)
const IconMoon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>)
const IconShare2 = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>)

/* ═══ App Chrome (1:1 from CanvasPage header) ═══ */
function AppChrome({ isFr = true }: { isFr?: boolean }) {
  return (
    <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease }}
      className="flex items-center justify-between shrink-0"
      style={{ height: CHROME_H, padding: "0 8px 0 4px", background: "var(--surface)", borderBottom: "1px solid var(--line)", position: "relative", zIndex: 2 }}>

      {/* Left — breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
        <HBtn style={{ padding: 6, color: "var(--text-faint)" }} title="Retour"><IconChevronLeft /></HBtn>
        <div style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}>
          <ArboLogo />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-faint)", userSelect: "none" }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{isFr ? "Mon site web" : "My website"}</span>
        {/* Tabs — Sitemap (active) | Wireframe */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 10, padding: 2, borderRadius: 8, background: "var(--surface-hover)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--accent)", background: "var(--elevated)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg><span>Sitemap</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--text-faint)", cursor: "pointer" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg><span>Wireframe</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
          <HBtn disabled style={{ padding: 6, color: "var(--text-muted)", opacity: 0.3 }} title="Annuler (Ctrl+Z)"><IconUndo2 /></HBtn>
          <HBtn disabled style={{ padding: 6, color: "var(--text-muted)", opacity: 0.3 }} title="Rétablir (Ctrl+Y)"><IconRedo2 /></HBtn>
        </div>
      </div>

      {/* Right — actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {/* Presence avatars */}
        <div style={{ display: "flex", alignItems: "center", marginLeft: -6 }}>
          {[{ src: "https://i.pravatar.cc/56?img=47", color: "#4F46E5" }, { src: "https://i.pravatar.cc/56?img=11", color: "#059669" }].map((u, i) => (
            <div key={i} style={{ position: "relative", width: 28, height: 28, borderRadius: "50%", marginLeft: i > 0 ? -6 : 0, flexShrink: 0, border: "2px solid var(--surface)", boxShadow: `0 0 0 1px ${u.color}40`, overflow: "hidden", backgroundColor: u.color }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.src} alt="" width={28} height={28} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
        <div style={{ width: 1, height: 16, background: "var(--line)", margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 6, color: "var(--text-faint)", fontSize: 10 }}>
          <IconCloud /><span>{isFr ? "Sauvegardé" : "Saved"}</span>
        </div>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)", marginLeft: 2 }}>11p</span>
        <HBtn style={{ padding: "5px 10px", color: "var(--text-muted)", fontSize: 10, fontWeight: 500, gap: 5 }} title="Exporter en PDF">
          <IconFileDown /><span>PDF</span>
        </HBtn>
        {/* Comment button with badge */}
        <div style={{ position: "relative" }}>
          <HBtn style={{ padding: 6, color: "var(--text-muted)" }} title="Mode commentaire"><IconMsgCircle2 /></HBtn>
          <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: "#F76B15", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>3</span></div>
        </div>
        <HBtn style={{ padding: 6, color: "var(--text-muted)" }} title="Plus d'options"><IconEllipsis /></HBtn>
        <button
          className="transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-theme-glow active:scale-95"
          style={{
            width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--controls-bg, var(--surface))", border: "1px solid var(--line)", cursor: "pointer",
          }}
          title="Mode sombre"
        >
          <span style={{ color: "var(--controls-fill, var(--text-muted))" }}><IconMoon /></span>
        </button>
        <button
          className="transition-[transform,filter] duration-150 hover:brightness-125 active:scale-95"
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 6,
            backgroundColor: "#F76B1520", color: "#F76B15", fontSize: 11, fontWeight: 500,
            border: "none", cursor: "pointer",
          }}
        >
          <IconShare2 /><span>{isFr ? "Partager" : "Share"}</span>
        </button>
      </div>
    </motion.header>
  )
}

/* ═══ Detail Panel Section ═══ */
const IconChevronDown = () => (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>)
const IconGlobe = () => <I d="M21.54 15H17a2 2 0 0 0-2 2v4.54M7 3.34V5a3 3 0 0 0 3 3 2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" s={12} />
const IconLayers = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></svg>)
const IconLightbulb = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>)
const IconMousePointer = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9 4 20l3.5-3.5L12 20z" /><path d="M15 5V3" /><path d="M19.4 8.6 21 7" /><path d="M20 13h2" /><path d="M13 2v2" /><path d="M8.6 4.6 7 3" /></svg>)
const IconTag = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></svg>)
const IconMsg = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>)
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>)

const PANEL_NODE_DATA: Record<string, { desc: string; ctas: string[]; tags: string[]; entries: string[] }> = {
  accueil: { desc: "Page d'accueil principale. Présente la proposition de valeur, les fonctionnalités clés, la preuve sociale et les CTAs de conversion.", ctas: ["Essai gratuit", "Voir la démo"], tags: ["conversion", "above-the-fold", "hero"], entries: ["Mistral: SaaS startup", "Direct: URL", "Ads: Meta Ads"] },
  fonctionnalites: { desc: "Vue détaillée de toutes les fonctionnalités produit, organisée par catégorie avec captures d'écran.", ctas: ["Commencer", "Voir les tarifs"], tags: ["features", "produit"], entries: ["Nav: menu principal"] },
  tarification: { desc: "Grille de pricing avec 3 plans (Free, Pro, Enterprise). Comparatif détaillé et FAQ.", ctas: ["Choisir ce plan", "Contacter l'équipe"], tags: ["pricing", "conversion"], entries: ["Nav: menu principal", "CTA: depuis accueil"] },
  solutions: { desc: "Hub des solutions par segment client. Redirige vers les pages Entreprise et Startups.", ctas: [], tags: ["hub", "routing"], entries: ["Nav: menu principal"] },
  entreprise: { desc: "Landing dédiée aux grands comptes. Arguments sécurité, conformité, SLA. Études de cas et formulaire de contact dédié.", ctas: ["Demander une démo", "Contacter les ventes"], tags: ["enterprise", "B2B", "conversion"], entries: ["Nav: solutions"] },
  startups: { desc: "Landing ciblant les startups early-stage. Mise en avant du plan gratuit et de la scalabilité.", ctas: ["Démarrer gratuitement"], tags: ["startup", "freemium"], entries: ["Nav: solutions"] },
  ressources: { desc: "Hub regroupant le blog, les webinaires et la documentation. Centre de contenu éducatif.", ctas: [], tags: ["content-hub", "SEO"], entries: ["Nav: menu principal"] },
  blog: { desc: "Listing des articles de blog. Filtres par catégorie, pagination, sidebar newsletter.", ctas: ["S'abonner à la newsletter"], tags: ["SEO", "content", "inbound"], entries: ["Mistral: organic", "Nav: ressources"] },
  webinaires: { desc: "Catalogue des webinaires passés et à venir. Inscription et replays.", ctas: ["S'inscrire au prochain"], tags: ["lead-gen", "content"], entries: ["Nav: ressources", "Email: nurture"] },
  documentation: { desc: "Documentation technique complète. Guides démarrage, référence API, tutoriels.", ctas: [], tags: ["support", "developer", "utility"], entries: ["Nav: menu principal", "Mistral: docs"] },
  carrieres: { desc: "Offres d'emploi ouvertes. Culture d'entreprise, avantages, processus de recrutement.", ctas: ["Postuler"], tags: ["recrutement", "utility"], entries: ["Nav: footer"] },
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  home: "Accueil", hub: "Hub", detail: "Détail", listing: "Listing", landing: "Landing",
}
const PAGE_TYPE_COLORS: Record<string, string> = {
  "home-expanded": "var(--accent)", compact: "var(--text-muted)", expanded: "var(--text-muted)", utility: "var(--text-faint)",
}

function PanelSection({ title, icon, children, index }: { title: string; icon?: React.ReactNode; children: React.ReactNode; index: number }) {
  const [open, setOpen] = useState(true)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + index * 0.03, duration: 0.2, ease }}
      style={{ borderBottom: "1px solid var(--line)" }}>
      <button onClick={() => setOpen(!open)}
        className="transition-colors duration-150 active:scale-[0.98]"
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "12px 20px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover, rgba(0,0,0,0.03))" }}
        onMouseLeave={e => { e.currentTarget.style.background = "none" }}>
        {icon && <span style={{ color: "var(--text-faint)" }}>{icon}</span>}
        <span style={{ flex: 1, fontSize: 10, fontWeight: 500, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
        <span style={{ color: "var(--text-faint)", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.15s" }}><IconChevronDown /></span>
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, transition: "max-height 0.2s cubic-bezier(0.23,1,0.32,1), opacity 0.15s ease, padding 0.2s ease", padding: open ? "0 20px 14px" : "0 20px 0" }}>
        {children}
      </div>
    </motion.div>
  )
}

function TagPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 500,
      background: accent ? "var(--accent-muted)" : "var(--card-title-bg)",
      color: accent ? "var(--accent)" : "var(--text-secondary)",
      border: accent ? "1px solid var(--accent-strong)" : "1px solid var(--line)",
    }}>{label}</span>
  )
}

function EntryBadge({ label }: { label: string }) {
  const [type, value] = label.includes(":") ? label.split(": ") : ["Nav", label]
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20,
      background: "var(--card-title-bg)", border: "1px solid var(--line)", fontSize: 10, color: "var(--text-secondary)",
    }}>
      <span style={{ fontWeight: 700, fontSize: 9, color: type === "Mistral" ? "#F76B15" : type === "Ads" ? "#FBBC04" : type === "Direct" ? "#34A853" : type === "Email" ? "#8B8B93" : "var(--text-faint)" }}>{type}</span>
      <span>{value}</span>
    </div>
  )
}

/* ═══ Detail Panel Slider ═══ */
function DetailSlider({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const n = getNode(nodeId)
  const data = PANEL_NODE_DATA[n.id] || { desc: `Page ${n.label}.`, ctas: [], tags: [], entries: [] }
  const nodeColor = PAGE_TYPE_COLORS[n.type] || "var(--text-muted)"
  const typeLabel = PAGE_TYPE_LABELS[n.pageType] || n.pageType

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 350 }}
      style={{
        position: "absolute", top: 0, right: 0, height: "100%", width: 320, zIndex: 20,
        background: "var(--elevated)", borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column",
      }}>
      {/* Header — colored borders like real panel */}
      <div style={{ padding: "20px 20px 16px", borderTop: `3px solid ${nodeColor}`, borderBottom: `2px solid ${nodeColor}`, flexShrink: 0 }}>
        {/* Breadcrumb */}
        {n.level > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "var(--text-faint)" }}>Accueil</span>
            <span style={{ fontSize: 10, color: "var(--text-faint)" }}>&rsaquo;</span>
            {n.level === 2 && <>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{n.id === "entreprise" || n.id === "startups" ? "Solutions" : "Ressources"}</span>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>&rsaquo;</span>
            </>}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", damping: 15 }}
              style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: n.type === "home-expanded" ? "var(--accent-muted)" : "var(--card-title-bg)", flexShrink: 0 }}>
              <span style={{ color: nodeColor }}><IconHome /></span>
            </motion.div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.label}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: nodeColor, boxShadow: `0 0 0 2px ${nodeColor}30` }} />
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{typeLabel}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="transition-[transform,background-color] duration-100 hover:rotate-90 active:scale-95"
            style={{ padding: 6, borderRadius: 6, color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
            onMouseLeave={e => { e.currentTarget.style.background = "none" }}
          ><IconX /></button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <PanelSection title="Description" index={0}>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)", minHeight: 60 }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.desc}</p>
          </div>
        </PanelSection>

        <PanelSection title="Points d'entrée" icon={<IconGlobe />} index={1}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.entries.length > 0 ? data.entries.map((e, i) => <EntryBadge key={i} label={e} />) : (
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Aucun point d&apos;entrée défini</span>
            )}
          </div>
        </PanelSection>

        <PanelSection title="Zoning" icon={<IconLayers />} index={2}>
          {n.type === "home-expanded" || n.type === "expanded" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(n.id === "accueil" ? ["Navigation", "Hero Section", "Fonctionnalités", "Social Proof", "CTA Principal", "Footer"] : ["Navigation", "Hero Enterprise", "Arguments clés", "Études de cas", "Formulaire contact"]).map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4, background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <div style={{ width: 3, height: 14, borderRadius: 1, background: "var(--accent)", opacity: 0.5 }} />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s}</span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Aucun zoning défini</span>
          )}
        </PanelSection>

        <PanelSection title="Rationale" icon={<IconLightbulb />} index={3}>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {n.id === "accueil" ? "Point d'entrée principal. Doit communiquer la valeur en moins de 5 secondes et guider vers l'inscription." : `Page nécessaire pour couvrir le segment ${n.label.toLowerCase()}.`}
            </p>
          </div>
        </PanelSection>

        <PanelSection title="Notes" icon={<IconMsg />} index={4}>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)", minHeight: 40 }}>
            <p style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic" }}>
              {n.id === "accueil" ? "A/B tester le hero avec et sans vidéo produit." : "Aucune note."}
            </p>
          </div>
        </PanelSection>

        <PanelSection title="CTAs" icon={<IconMousePointer />} index={5}>
          {data.ctas.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.ctas.map((c, i) => <TagPill key={i} label={c} accent />)}
            </div>
          ) : <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Aucun CTA</span>}
        </PanelSection>

        <PanelSection title="Tags" icon={<IconTag />} index={6}>
          {data.tags.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.tags.map((t, i) => <TagPill key={i} label={t} />)}
            </div>
          ) : <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Aucun tag</span>}
        </PanelSection>

        {/* Delete zone */}
        {n.type !== "home-expanded" && (
          <div style={{ padding: "16px 20px" }}>
            <div
              className="group/del transition-[border-color,background-color] duration-150"
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
                border: "1px dashed var(--line)", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.background = "rgba(239,68,68,0.05)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "transparent" }}
            >
              <span className="transition-colors duration-150 group-hover/del:text-red-500" style={{ color: "var(--text-faint)" }}><IconTrash /></span>
              <span className="transition-colors duration-150 group-hover/del:text-red-500" style={{ fontSize: 12, color: "var(--text-faint)" }}>Supprimer cette page</span>
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </motion.div>
  )
}

/* ═══ Zoom Controls ═══ */
function ZoomControls() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, ease }}
      style={{ position: "absolute", bottom: 16, left: 16, display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)", zIndex: 10 }}>
      {[
        { icon: <IconPlus />, title: "Zoom in", border: true },
        { icon: <IconMinus />, title: "Zoom out", border: true },
        { icon: <IconMaximize />, title: "Ajuster la vue", border: false },
      ].map((b, i) => (
        <button key={i} title={b.title}
          className="transition-colors duration-100 active:scale-95"
          style={{ padding: "6px 8px", color: "var(--text-muted)", cursor: "pointer", background: "transparent", border: "none", borderBottom: b.border ? "1px solid var(--line)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
        >{b.icon}</button>
      ))}
    </motion.div>
  )
}

/* ═══ MiniMap ═══ */
function FakeMiniMap() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, ease }}
      style={{ position: "absolute", bottom: 16, right: 16, width: 120, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)", zIndex: 10, padding: 6 }}>
      {/* Tiny node dots */}
      {nodes.map(n => (
        <div key={n.id} style={{
          position: "absolute",
          left: 6 + (n.x / CANVAS_W) * 108,
          top: 6 + (n.y / CANVAS_H) * 68,
          width: (n.w / CANVAS_W) * 108,
          height: Math.max((n.h / CANVAS_H) * 68, 2),
          background: n.type === "home-expanded" ? "var(--accent)" : "var(--text-faint)",
          borderRadius: 1, opacity: n.type === "utility" ? 0.3 : 0.6,
        }} />
      ))}
      {/* Viewport rect */}
      <div style={{ position: "absolute", left: 20, top: 10, width: 60, height: 40, border: "1.5px solid var(--accent)", borderRadius: 2, opacity: 0.5 }} />
    </motion.div>
  )
}

/* ═══ AI Bar ═══ */
function AiBar() {
  const [text, setText] = useState("")

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7, ease }}
      style={{
        position: "absolute", bottom: 20, left: 0, right: 0, marginLeft: "auto", marginRight: "auto",
        width: "min(88%, 480px)", borderRadius: 12, overflow: "hidden", zIndex: 15,
        background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow-panel)",
      }}>
      {/* Header — exact match of real AiBar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px 6px 12px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--accent)" }}><IconSparkles /></span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)" }}>Assistant IA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Speed toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 5, background: "var(--warning-bg)", color: "var(--warning-text)", fontSize: 10, fontWeight: 500 }}>
            <IconZap />Rapide
          </div>
          {/* AiSourcePicker badge — credits with mini progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 5, background: "var(--accent-muted)", color: "var(--accent)", fontSize: 10, fontWeight: 500 }}>
            <IconSparkles />
            <span>17/20</span>
            <div style={{ width: 20, height: 3, borderRadius: 2, background: "var(--surface-hover)", overflow: "hidden" }}>
              <div style={{ width: "85%", height: "100%", borderRadius: 2, background: "var(--accent)" }} />
            </div>
          </div>
          {/* Close */}
          <div style={{ padding: 3, color: "var(--text-faint)", cursor: "pointer" }}><IconX /></div>
        </div>
      </div>
      {/* Input — textarea + paperclip + send */}
      <div style={{ padding: "8px 10px 8px 12px", display: "flex", gap: 6, alignItems: "flex-end" }}>
        <div style={{ flex: 1, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)", overflow: "hidden" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Modifie l'arbo ou pose une question..."
            rows={1}
            style={{ width: "100%", padding: "7px 10px", fontSize: 11, resize: "none", background: "transparent", color: "var(--text-primary)", border: "none", outline: "none", fontFamily: "inherit" }}
          />
          <div style={{ padding: "0 8px 5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" /></svg>
          </div>
        </div>
        <button style={{ padding: 8, borderRadius: 8, background: "var(--accent)", color: "#fff", opacity: text.trim() ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end", flexShrink: 0, cursor: text.trim() ? "pointer" : "not-allowed", border: "none", transition: "opacity 0.15s" }}>
          <IconSend />
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 12px 6px", fontSize: 9, color: "var(--text-faint)" }}>
        <span>Enter pour envoyer, Shift+Enter pour retour ligne</span>
        <span>Esc pour fermer</span>
      </div>
    </motion.div>
  )
}

/* ═══ Main ═══ */
export default function HeroTreeIllustration({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const isFr = locale === "fr"
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [scale, setScale] = useState(0.6)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    function calcScale() {
      if (!ref.current) return
      const w = ref.current.clientWidth
      const containerH = w * 9 / 16 - CHROME_H
      const sx = w / CANVAS_W
      const sy = containerH / CANVAS_H
      setScale(Math.min(sx, sy) * 0.92)
    }
    calcScale()
    window.addEventListener("resize", calcScale)
    return () => window.removeEventListener("resize", calcScale)
  }, [])

  const levelDelays: Record<number, number> = { 0: 0.1, 1: 0.35, 2: 0.6 }

  return (
    <>
      {/* Desktop: interactive illustration */}
      <div ref={ref} className="hidden sm:block aspect-[16/9]" style={{
        borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)",
        background: "var(--canvas-bg)", width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 80px rgba(0,0,0,0.08)",
      }}>
        {inView && (
          <>
            <AppChrome isFr={isFr} />
            <div style={{ position: "relative", width: "100%", height: `calc(100% - ${CHROME_H}px)`, overflow: "hidden" }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null) }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.5 }} />
              <div style={{ width: CANVAS_W, height: CANVAS_H, position: "absolute", left: "50%", top: 20, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}>
                <svg style={{ position: "absolute", inset: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}>
                  {edges.map((e, i) => (
                    <motion.path key={`${e.from}-${e.to}`} d={edgePath(e.from, e.to)} fill="none" stroke="var(--line)" strokeWidth={1.5}
                      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.04, ease }} />
                  ))}
                </svg>
                <HomeExpandedCard delay={0.1} onClick={() => setSelectedNode("accueil")} selected={selectedNode === "accueil"} />
                {["ressources", "fonctionnalites", "tarification", "solutions", "documentation", "carrieres"].map((id, i) => (
                  <CompactCard key={id} id={id} delay={levelDelays[1]! + i * 0.05} onClick={() => setSelectedNode(id)} selected={selectedNode === id} />
                ))}
                {["blog", "webinaires", "startups"].map((id, i) => (
                  <CompactCard key={id} id={id} delay={levelDelays[2]! + i * 0.05} onClick={() => setSelectedNode(id)} selected={selectedNode === id} />
                ))}
                <ExpandedCard delay={0.65} onClick={() => setSelectedNode("entreprise")} selected={selectedNode === "entreprise"} />
              </div>
              <ZoomControls />
              <FakeMiniMap />
              <AiBar />
              <AnimatePresence>
                {selectedNode && <DetailSlider key={selectedNode} nodeId={selectedNode} onClose={() => setSelectedNode(null)} />}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Mobile: static screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-mobile.png"
        alt="Arbo — visual sitemap builder"
        className="block sm:hidden w-full rounded-xl"
        style={{ border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 80px rgba(0,0,0,0.08)" }}
      />
    </>
  )
}
