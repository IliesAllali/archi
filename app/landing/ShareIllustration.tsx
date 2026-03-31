"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect, useCallback } from "react"

const ease = [0.16, 1, 0.3, 1] as const

type STxt = { project: string; readOnly: string; share: string; createLink: string; activeLinks: string; visits: string; exportPdf: string; exportPdfDesc: string; export: string }
const stxt: Record<string, STxt> = {
  fr: { project: "Refonte site vitrine", readOnly: "Lecture seule", share: "Partager le projet", createLink: "Créer un lien de partage", activeLinks: "Liens actifs", visits: "0 visite", exportPdf: "Exporter en PDF", exportPdfDesc: "Télécharger un livrable propre", export: "Export" },
  en: { project: "Website Redesign", readOnly: "Read only", share: "Share project", createLink: "Create a share link", activeLinks: "Active links", visits: "0 visits", exportPdf: "Export as PDF", exportPdfDesc: "Download a clean deliverable", export: "Export" },
}

const CANVAS_W = 1100
const CANVAS_H = 920
const CHROME_H = 44

/* ─── Nodes (same as HeroTreeIllustration) ─── */
const nodes = [
  { id: "accueil",        label: "Accueil",         x: 457, y: 0,   w: 200, h: 345, type: "home-expanded" as const, childrenCount: "6↓", level: 0, pageType: "home" as const },
  { id: "ressources",     label: "Ressources",      x: 170, y: 428, w: 110, h: 33,  type: "compact" as const,       childrenCount: "2↓", level: 1, pageType: "hub" as const },
  { id: "documentation",  label: "Documentation",   x: 328, y: 537, w: 110, h: 48,  type: "utility" as const,                            level: 1, pageType: "detail" as const },
  { id: "carrieres",      label: "Carrières",       x: 486, y: 537, w: 110, h: 33,  type: "utility" as const,                            level: 1, pageType: "listing" as const },
  { id: "fonctionnalites",label: "Fonctionnalités", x: 570, y: 427, w: 110, h: 33,  type: "compact" as const,                            level: 1, pageType: "landing" as const },
  { id: "tarification",   label: "Tarification",    x: 750, y: 427, w: 110, h: 33,  type: "compact" as const,                            level: 1, pageType: "landing" as const },
  { id: "solutions",      label: "Solutions",       x: 960, y: 427, w: 110, h: 33,  type: "compact" as const,       childrenCount: "2↓", level: 1, pageType: "hub" as const },
  { id: "blog",           label: "Blog",            x: 12,  y: 537, w: 110, h: 33,  type: "compact" as const,                            level: 2, pageType: "listing" as const },
  { id: "webinaires",     label: "Webinaires",      x: 170, y: 537, w: 110, h: 33,  type: "compact" as const,                            level: 2, pageType: "listing" as const },
  { id: "entreprise",     label: "Entreprise",      x: 734, y: 585, w: 200, h: 316, type: "expanded" as const,                           level: 2, pageType: "landing" as const },
  { id: "startups",       label: "Startups",        x: 982, y: 537, w: 110, h: 33,  type: "compact" as const,                            level: 2, pageType: "landing" as const },
]
const edges = [
  { from: "accueil", to: "ressources" }, { from: "accueil", to: "documentation" },
  { from: "accueil", to: "carrieres" },  { from: "accueil", to: "fonctionnalites" },
  { from: "accueil", to: "tarification" },{ from: "accueil", to: "solutions" },
  { from: "ressources", to: "blog" },    { from: "ressources", to: "webinaires" },
  { from: "solutions", to: "entreprise" },{ from: "solutions", to: "startups" },
]
function getNode(id: string) { return nodes.find(n => n.id === id)! }
function edgePath(from: string, to: string) {
  const f = getNode(from), t = getNode(to)
  const x1 = f.x + f.w / 2, y1 = f.y + f.h, x2 = t.x + t.w / 2, y2 = t.y
  const mid = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
}

/* ─── Wireframe skins (identical to HeroTreeIllustration) ─── */
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
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 5px" }}>
    <div className="wf-strong" style={{ width: 12, height: 3, borderRadius: 1 }} />
    <div style={{ display: "flex", gap: 2 }}>{[0,1,2].map(i=><div key={i} className="wf-faint" style={{ width: 8, height: 2, borderRadius: 1 }} />)}</div>
  </div>
}
function SkinHero() {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 3 }}>
    <div className="wf-strong" style={{ width: "55%", height: 3, borderRadius: 1 }} />
    <div className="wf-faint"  style={{ width: "38%", height: 2, borderRadius: 1 }} />
    <div className="wf-strong" style={{ width: 26, height: 6, borderRadius: 2, marginTop: 2 }} />
  </div>
}
function SkinCards() {
  return <div style={{ display: "flex", gap: 2, height: "100%", padding: 3 }}>
    {[0,1,2].map(i=><div key={i} className="wf-card" style={{ flex: 1, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
      <div className="wf-faint" style={{ width: "100%", height: 10, borderRadius: 1 }} />
      <div className="wf-faint" style={{ width: "65%", height: 2, borderRadius: 1 }} />
      <div className="wf-faint" style={{ width: "45%", height: 2, borderRadius: 1 }} />
    </div>)}
  </div>
}
function SkinSocialProof() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: "100%" }}>
    {[0,1,2,3,4].map(i=><div key={i} className="wf-faint" style={{ width: 14, height: 6, borderRadius: 1 }} />)}
  </div>
}
function SkinDoubleCta() {
  return <div style={{ display: "flex", gap: 4, height: "100%", padding: 4 }}>
    <div style={{ flex: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent)", opacity: 0.9 }}>
      <div style={{ width: "42%", height: 2, borderRadius: 1, background: "rgba(255,255,255,0.85)" }} />
    </div>
    <div style={{ flex: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--accent)", opacity: 0.75 }}>
      <div style={{ width: "42%", height: 2, borderRadius: 1, background: "var(--accent)" }} />
    </div>
  </div>
}
function SkinFooter() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 5px" }}>
    <div className="wf-faint" style={{ width: 10, height: 2, borderRadius: 1 }} />
    <div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i=><div key={i} className="wf-faint" style={{ width: 6, height: 2, borderRadius: 1 }} />)}</div>
  </div>
}
function SkinArguments() {
  return <div style={{ display: "flex", gap: 3, height: "100%", padding: 3 }}>
    {[0,1,2].map(i=><div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 2 }}>
      <div className="wf-strong" style={{ width: 8, height: 8, borderRadius: "50%" }} />
      <div className="wf-faint"  style={{ width: "75%", height: 2, borderRadius: 1 }} />
      <div className="wf-faint"  style={{ width: "55%", height: 2, borderRadius: 1 }} />
    </div>)}
  </div>
}
function SkinForm() {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4, height: "100%", padding: 5 }}>
    {[0,1,2,3].map(i=><div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <div className="wf-faint" style={{ width: "28%", height: 2, borderRadius: 1 }} />
      <div className="wf-border" style={{ width: "100%", height: 5, borderRadius: 2, borderWidth: 1, borderStyle: "solid" }} />
    </div>)}
  </div>
}

/* ─── Icons ─── */
const Ic = ({ d, s = 14 }: { d: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconChevronLeft = () => <Ic d="m15 18-6-6 6-6" />
const IconMoon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
const IconMsgCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
const IconFileDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
const IconLink2   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const IconEye     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
const IconMonitor = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
const IconCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
const IconTrash2  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
const IconPlus    = () => <Ic d="M5 12h14M12 5v14" s={13} />
const IconX       = () => <Ic d="M18 6 6 18M6 6l12 12" />
const IconMinus   = () => <Ic d="M5 12h14" />
const IconMaximize = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
const ArboLogo = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)"/><path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6"/><path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6"/></svg>

/* ─── HBtn ─── */
function HBtn({ children, style, disabled }: { children: React.ReactNode; style?: React.CSSProperties; disabled?: boolean }) {
  return (
    <button disabled={disabled} className="transition-colors duration-100 active:scale-95"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: disabled ? "default" : "pointer", background: "transparent", borderRadius: 6, ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
      {children}
    </button>
  )
}

/* ─── Cards (static, no click/hover for guest view) ─── */
function HomeCard() {
  const n = getNode("accueil")
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1, ease }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, background: "var(--card-bg)", borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)" }}>
      <div style={{ height: 4, background: "var(--accent)" }} />
      <div style={{ height: 32, background: "var(--accent-muted)", borderBottom: "1px solid var(--accent-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 7px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--title-color)" }}>{n.label}</p>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7 }}>{n.childrenCount}</span>
      </div>
      <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        <WfSection label="Navigation"     bg="rgba(139,147,165,0.10)" border="rgba(139,147,165,0.45)" h={10.4}><SkinNav /></WfSection>
        <WfSection label="Hero Section"   bg="rgba(124,93,250,0.09)"  border="rgba(124,93,250,0.55)"  h={36.4}><SkinHero /></WfSection>
        <WfSection label="Fonctionnalités"bg="rgba(67,140,245,0.09)"  border="rgba(67,140,245,0.50)"  h={32.5}><SkinCards /></WfSection>
        <WfSection label="Social Proof"   bg="rgba(100,140,255,0.08)" border="rgba(100,140,255,0.40)" h={19.5}><SkinSocialProof /></WfSection>
        <WfSection label="CTA Principal"  bg="rgba(94,106,210,0.08)"  border="rgba(94,106,210,0.70)"  h={15.6}><SkinDoubleCta /></WfSection>
        <WfSection label="Footer"         bg="rgba(100,116,139,0.08)" border="rgba(100,116,139,0.35)" h={15.6}><SkinFooter /></WfSection>
      </div>
    </motion.div>
  )
}
function CompactCard({ id, delay }: { id: string; delay: number }) {
  const n = getNode(id)
  const isUtility = n.type === "utility"
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: isUtility ? 0.65 : 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, background: "var(--card-bg)", borderRadius: 4, overflow: "hidden", boxShadow: isUtility ? "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--card-ring)" : "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring)" }}>
      {isUtility && <div style={{ height: 3, background: "var(--line-strong)" }} />}
      <div style={{ padding: 7, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card-title-bg)", borderBottom: "1px solid var(--card-title-border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--title-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</span>
        {n.childrenCount && <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7, marginLeft: 3, flexShrink: 0 }}>{n.childrenCount}</span>}
      </div>
    </motion.div>
  )
}
function ExpandedCard({ delay }: { delay: number }) {
  const n = getNode("entreprise")
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, background: "var(--card-bg)", borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring)" }}>
      <div style={{ height: 4, background: "var(--accent)" }} />
      <div style={{ height: 32, background: "var(--card-title-bg)", borderBottom: "1px solid var(--card-title-border)", display: "flex", alignItems: "center", padding: "0 7px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--title-color)" }}>{n.label}</p>
      </div>
      <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        <WfSection label="Navigation"       bg="rgba(139,147,165,0.10)" border="rgba(139,147,165,0.45)" h={10.4}><SkinNav /></WfSection>
        <WfSection label="Hero Enterprise"  bg="rgba(124,93,250,0.09)"  border="rgba(124,93,250,0.55)"  h={32.5}><SkinHero /></WfSection>
        <WfSection label="Arguments clés"   bg="rgba(255,120,80,0.09)"  border="rgba(255,120,80,0.50)"  h={39}><SkinArguments /></WfSection>
        <WfSection label="Études de cas"    bg="rgba(100,140,255,0.08)" border="rgba(100,140,255,0.40)" h={26}><SkinSocialProof /></WfSection>
        <WfSection label="Formulaire"       bg="rgba(255,100,130,0.09)" border="rgba(255,100,130,0.50)" h={22}><SkinForm /></WfSection>
      </div>
    </motion.div>
  )
}

/* ─── Zoom controls ─── */
function ZoomControls() {
  return (
    <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)", zIndex: 10 }}>
      {[{ icon: <IconPlus />, b: true }, { icon: <IconMinus />, b: true }, { icon: <IconMaximize />, b: false }].map((btn, i) => (
        <button key={i} style={{ padding: "6px 8px", color: "var(--text-muted)", cursor: "pointer", background: "transparent", border: "none", borderBottom: btn.b ? "1px solid var(--line)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {btn.icon}
        </button>
      ))}
    </div>
  )
}

/* ─── App chrome (read-only variant) ─── */
function AppChrome({ st }: { st: STxt }) {
  return (
    <div style={{ height: CHROME_H, padding: "0 8px 0 4px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <HBtn style={{ padding: 6, color: "var(--text-faint)" }}><IconChevronLeft /></HBtn>
        <div style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}><ArboLogo /></div>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{st.project}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)" }}>11p</span>
        <HBtn style={{ padding: "5px 10px", color: "var(--text-muted)", fontSize: 10, fontWeight: 500, gap: 5 }}><IconFileDown /><span>Export</span></HBtn>
        <HBtn style={{ padding: 6, color: "var(--text-muted)" }}><IconMsgCircle /></HBtn>
        <button className="transition-all duration-200 hover:scale-110 hover:shadow-theme-glow active:scale-90" style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--controls-bg,var(--surface))", border: "1px solid var(--line)", cursor: "pointer" }}>
          <span style={{ color: "var(--controls-fill,var(--text-muted))" }}><IconMoon /></span>
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: "var(--surface-hover, var(--surface))", color: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}>
          <IconMonitor /><span>{st.readOnly}</span>
        </span>
      </div>
    </div>
  )
}

/* ─── Step 1: Modal (matches real ShareModal.tsx) ─── */
function ShareModalStep({ onDone, st }: { onDone: () => void; st: STxt }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setCopied(true)
      setTimeout(onDone, 800)
    }, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 4 }}
      transition={{ duration: 0.14, ease }}
      style={{ width: "100%", maxWidth: 480, borderRadius: 12, overflow: "hidden", background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{st.share}</h3>
          <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{st.project}</p>
        </div>
        <div style={{ padding: 6, borderRadius: 6, color: "var(--text-muted)" }}><IconX /></div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Create button */}
        <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: "var(--accent-muted)", color: "var(--accent)", border: "none", cursor: "pointer" }}>
          <IconPlus /> {st.createLink}
        </button>

        {/* Existing links section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, color: "var(--text-faint)" }}>{st.activeLinks}</p>

          {/* Link row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-faint)", flexShrink: 0 }}><IconLink2 /></span>
                /share/e8f3k2a9...
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 10, color: "var(--text-faint)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IconEye /> {st.visits}</span>
              </div>
            </div>
            {/* Copy button */}
            <motion.button
              animate={copied ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.15 }}
              style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", background: copied ? "var(--success-bg, #dcfce7)" : "var(--accent-muted)", color: copied ? "var(--success-text, #16a34a)" : "var(--accent)" }}
            >
              {copied ? <IconCheck /> : (st.readOnly === "Lecture seule" ? "Copier" : "Copy")}
            </motion.button>
            <button style={{ padding: 6, borderRadius: 6, background: "transparent", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
              <IconTrash2 />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Step 2: Canvas guest view ─── */
function GuestCanvas({ scale, st }: { scale: number; st: STxt }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease }}
      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
    >
      <AppChrome st={st} />
      <div style={{ position: "relative", width: "100%", height: `calc(100% - ${CHROME_H}px)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.5 }} />
        <div style={{ width: CANVAS_W, height: CANVAS_H, position: "absolute", left: "50%", top: 20, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}>
          <svg style={{ position: "absolute", inset: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}>
            {edges.map((e, i) => (
              <motion.path key={`${e.from}-${e.to}`} d={edgePath(e.from, e.to)} fill="none" stroke="var(--line)" strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.04, ease }} />
            ))}
          </svg>
          <HomeCard />
          {["ressources","fonctionnalites","tarification","solutions","documentation","carrieres"].map((id, i) => (
            <CompactCard key={id} id={id} delay={0.3 + i * 0.05} />
          ))}
          {["blog","webinaires","startups"].map((id, i) => (
            <CompactCard key={id} id={id} delay={0.55 + i * 0.05} />
          ))}
          <ExpandedCard delay={0.6} />
        </div>
        <ZoomControls />
        {/* Minimap */}
        <div style={{ position: "absolute", bottom: 14, right: 14, width: 96, height: 64, borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", zIndex: 10, overflow: "hidden", padding: 5 }}>
          {nodes.map((n, i) => (
            <div key={i} style={{
              position: "absolute",
              left: 5 + (n.x / CANVAS_W) * 86, top: 5 + (n.y / CANVAS_H) * 54,
              width: Math.max((n.w / CANVAS_W) * 86, 4), height: Math.max((n.h / CANVAS_H) * 54, 2),
              background: i === 0 ? "var(--accent)" : "var(--text-faint)", borderRadius: 1, opacity: i === 0 ? 0.7 : 0.45,
            }} />
          ))}
          <div style={{ position: "absolute", left: 10, top: 5, width: 50, height: 34, border: "1.5px solid var(--accent)", borderRadius: 2, opacity: 0.35 }} />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Static mobile modal (no animation, with PDF export) ─── */
function MobileShareView({ st }: { st: STxt }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "16px 16px", gap: 12 }}>
      {/* Share modal */}
      <div style={{ width: "100%", maxWidth: 400, borderRadius: 12, overflow: "hidden", background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{st.share}</h3>
            <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{st.project}</p>
          </div>
          <div style={{ padding: 6, borderRadius: 6, color: "var(--text-muted)" }}><IconX /></div>
        </div>
        <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: "var(--accent-muted)", color: "var(--accent)", border: "none", cursor: "pointer" }}>
            <IconPlus /> {st.createLink}
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, color: "var(--text-faint)" }}>{st.activeLinks}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-faint)", flexShrink: 0 }}><IconLink2 /></span>
                  /share/e8f3k2a9...
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 10, color: "var(--text-faint)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IconEye /> {st.visits}</span>
                </div>
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "var(--success-bg, #dcfce7)", color: "var(--success-text, #16a34a)" }}>
                <IconCheck />
              </div>
              <button style={{ padding: 6, borderRadius: 6, background: "transparent", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
                <IconTrash2 />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF export card */}
      <div style={{ width: "100%", maxWidth: 400, borderRadius: 12, overflow: "hidden", background: "var(--elevated)", border: "1px solid var(--line-strong)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-muted)", flexShrink: 0 }}>
          <IconFileDown />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{st.exportPdf}</p>
          <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 1 }}>{st.exportPdfDesc}</p>
        </div>
        <div style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "var(--accent)", color: "#fff" }}>
          Export
        </div>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function ShareIllustration({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const st = stxt[locale]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: "-60px" })
  const [scale, setScale] = useState(0.6)
  const [mobile, setMobile] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const onDone = useCallback(() => setStep(2), [])

  useEffect(() => {
    function calcScale() {
      if (!ref.current) return
      const w = ref.current.clientWidth
      const m = w < 640
      const containerH = w * 9 / 16 - CHROME_H
      const sx = w / CANVAS_W
      const sy = containerH / CANVAS_H
      setScale(Math.min(sx, sy) * 0.92)
      setMobile(m)
    }
    calcScale()
    window.addEventListener("resize", calcScale)
    return () => window.removeEventListener("resize", calcScale)
  }, [])

  useEffect(() => {
    if (mobile || !inView || step !== 2) return
    const t = setTimeout(() => setStep(1), 5000)
    return () => clearTimeout(t)
  }, [inView, step, mobile])

  useEffect(() => {
    if (!inView) setStep(1)
  }, [inView])

  return (
    <div
      ref={ref}
      className={mobile ? "aspect-[3/4]" : "aspect-[16/9]"}
      style={{
        marginTop: 28, borderRadius: 12, overflow: "hidden",
        border: "1px solid var(--line)", position: "relative",
        background: "var(--canvas-bg)",
      }}
    >
      {inView && mobile ? (
        <MobileShareView st={st} />
      ) : inView ? (
        <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="modal"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", zIndex: 2 }}
              >
                <ShareModalStep onDone={onDone} st={st} />
              </motion.div>
            ) : (
              <GuestCanvas key="guest" scale={scale} st={st} />
            )}
          </AnimatePresence>
      ) : null}
    </div>
  )
}
