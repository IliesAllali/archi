"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const ease = [0.16, 1, 0.3, 1] as const
const CHROME_H = 44

/* ─── Icons — same as DragIllustration (pixel exact) ─── */
const Ic = ({ d, s = 14 }: { d: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const ArboLogo = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)"/><path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6"/><path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6"/></svg>
const IconChevronLeft = () => <Ic d="m15 18-6-6 6-6" />
const IconUndo2  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
const IconRedo2  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>
const IconFileDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
const IconCloud  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
const IconMore   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
const IconMoon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
const IconShare2 = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
const IconGitBranch = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
const IconLayout = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
const IconMessageCircle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg>
const IconFileText = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"/><path d="M14 2v6h6"/></svg>
const IconEye = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
const IconCode = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
const IconSparkles = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/></svg>
const IconCopy = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
const IconRefreshCw = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
const IconMonitor = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
const IconTablet = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
const IconSmartphone = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
const IconZap = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
const IconSend = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
const IconDownload = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
const IconPanelRightOpen = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m10 15-3-3 3-3"/></svg>

/* ─── HBtn — same as DragIllustration ─── */
function HBtn({ children, style, disabled }: { children: React.ReactNode; style?: React.CSSProperties; disabled?: boolean }) {
  return (
    <button disabled={disabled} className="transition-colors duration-100 active:scale-95" style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: disabled ? "default" : "pointer", background: "transparent", borderRadius: 6, ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
      {children}
    </button>
  )
}

/* ─── Presence avatars — same as DragIllustration ─── */
const COLLABS = [
  { src: "https://i.pravatar.cc/56?img=47", name: "Sara A.", color: "#4F46E5" },
  { src: "https://i.pravatar.cc/56?img=11", name: "Marc L.", color: "#059669" },
]
function PresenceAvatarsDemo() {
  return (
    <div style={{ display: "flex", alignItems: "center", marginLeft: -6 }}>
      {COLLABS.map((u, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + i * 0.12, type: "spring", damping: 20, stiffness: 300 }}
          title={u.name}
          style={{ position: "relative", width: 28, height: 28, borderRadius: "50%", marginLeft: i > 0 ? -6 : 0, flexShrink: 0, border: "2px solid var(--surface)", boxShadow: `0 0 0 1px ${u.color}40`, overflow: "hidden", backgroundColor: u.color }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u.src} alt={u.name} width={28} height={28} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>
      ))}
    </div>
  )
}

const PAGES = [
  { label: "Accueil", depth: 0, dot: true, sel: true },
  { label: "Catalogue", depth: 0, dot: true, sel: false },
  { label: "Fiche produit", depth: 1, dot: false, sel: false },
  { label: "Panier", depth: 0, dot: true, sel: false },
  { label: "Blog", depth: 0, dot: false, sel: false },
  { label: "À propos", depth: 0, dot: true, sel: false },
  { label: "Contact", depth: 0, dot: true, sel: false },
]

export default function WireframeIllustration({ locale = "fr" }: { locale?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [selectedPage, setSelectedPage] = useState(0)
  const [viewport, setViewport] = useState<1440 | 768 | 375>(1440)
  const viewportScale = viewport === 1440 ? 0.44 : viewport === 768 ? 0.54 : 0.28
  const viewportLabel = viewport === 1440 ? "1440px" : viewport === 768 ? "768px" : "375px"

  const sharedStyle = { marginTop: 28, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", background: "var(--canvas-bg)", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 80px rgba(0,0,0,0.08)" } as const

  return (
    <>
    {/* ── Mobile — static screenshot ── */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/images/wireframe-mobile.png"
      alt="Arbo — wireframe editor on mobile"
      className="block sm:hidden w-full rounded-xl"
      style={{ marginTop: 28, border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 80px rgba(0,0,0,0.08)" }}
    />

    {/* ── Desktop illustration ── */}
    <div ref={ref} className="hidden sm:block aspect-[16/9]" style={sharedStyle}>
      {inView && <>

        {/* ── App chrome — EXACT same as DragIllustration + tabs + comment button ── */}
        <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          style={{ height: CHROME_H, padding: "0 8px 0 4px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <HBtn style={{ padding: 6, color: "var(--text-faint)" }}><IconChevronLeft /></HBtn>
            <div style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}><ArboLogo /></div>
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Refonte ACME</span>
            {/* Tabs — Sitemap | Wireframe (active) */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 10, padding: 2, borderRadius: 8, background: "var(--surface-hover)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--text-faint)", cursor: "pointer" }}><IconGitBranch /><span>Sitemap</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--accent)", background: "var(--elevated)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}><IconLayout /><span>Wireframe</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
              <HBtn disabled style={{ padding: 6, color: "var(--text-muted)", opacity: 0.3 }}><IconUndo2 /></HBtn>
              <HBtn disabled style={{ padding: 6, color: "var(--text-muted)", opacity: 0.3 }}><IconRedo2 /></HBtn>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <PresenceAvatarsDemo />
            <div style={{ width: 1, height: 16, background: "var(--line)", margin: "0 4px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", color: "var(--text-faint)", fontSize: 10 }}><IconCloud /><span>Sauvegard&eacute;</span></div>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)" }}>8p</span>
            <HBtn style={{ padding: "5px 10px", color: "var(--text-muted)", fontSize: 10, fontWeight: 500, gap: 5 }}><IconFileDown /><span>PDF</span></HBtn>
            {/* Comment button with badge */}
            <div style={{ position: "relative" }}>
              <HBtn style={{ padding: 6, color: "var(--text-muted)" }}><IconMessageCircle /></HBtn>
              <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>3</span>
              </div>
            </div>
            <HBtn style={{ padding: 6, color: "var(--text-muted)" }}><IconMore /></HBtn>
            <button style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--controls-bg,var(--surface))", border: "1px solid var(--line)", cursor: "pointer" }}>
              <span style={{ color: "var(--controls-fill,var(--text-muted))" }}><IconMoon /></span>
            </button>
            <button className="transition-all duration-150 hover:brightness-125 active:scale-95" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 6, backgroundColor: "#F76B1520", color: "#F76B15", fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer" }}><IconShare2 /><span>Partager</span></button>
          </div>
        </motion.header>

        {/* ── Content ── */}
        <div style={{ display: "flex", height: `calc(100% - ${CHROME_H}px)`, position: "relative" }}>

          {/* ── Page list sidebar ── */}
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1, ease }}
            style={{ width: 170, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--line)", background: "var(--elevated)" }}>
            <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center" }}><span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>Pages</span></div>
            <div style={{ flex: 1, overflow: "hidden", paddingTop: 2 }}>
              {PAGES.map((p, i) => {
                const isSel = i === selectedPage
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.03, duration: 0.2, ease }}
                    onClick={() => setSelectedPage(i)}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--surface-hover)" }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent" }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", paddingLeft: 12 + p.depth * 14, marginLeft: 3, marginRight: 3, borderRadius: 6, background: isSel ? "var(--accent-muted)" : "transparent", color: isSel ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", transition: "background 0.15s" }}>
                    <span style={{ opacity: 0.5 }}><IconFileText /></span>
                    <span style={{ fontSize: 11, fontWeight: 500, flex: 1 }}>{p.label}</span>
                    {p.dot && <div style={{ width: 6, height: 6, borderRadius: "50%", background: isSel ? "var(--accent)" : "var(--text-faint)", opacity: isSel ? 1 : 0.35, flexShrink: 0 }} />}
                  </motion.div>
                )
              })}
            </div>
            <div style={{ padding: "4px 12px", borderTop: "1px solid var(--line)", display: "flex", gap: 10, fontSize: 9, color: "var(--text-faint)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />Wireframe</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-faint)", opacity: 0.35 }} />Vide</span>
            </div>
          </motion.div>

          {/* ── Main ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Toolbar — exact match of WireframeView toolbar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 6px 14px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0, gap: 8 }}>
              {/* Left: page name */}
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{PAGES[selectedPage].label}</span>
              {/* Right: actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                {/* Preview/Code toggle — rounded-lg p-0.5 bg-hover */}
                <div style={{ display: "flex", alignItems: "center", padding: 2, borderRadius: 8, background: "var(--surface-hover)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, fontSize: 11, color: "var(--accent)", background: "var(--elevated)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}><IconEye /><span>Preview</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, fontSize: 11, color: "var(--text-faint)" }}><IconCode /><span>Code</span></div>
                </div>
                {/* Regenerate — rounded-lg accent */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 500 }}><IconRefreshCw /><span>Reg&eacute;n&eacute;rer</span></div>
                {/* Copy — rounded-lg accent-muted */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "var(--accent-muted)", color: "var(--accent)", fontSize: 11, fontWeight: 500 }}><IconCopy /><span>Copier</span></div>
                {/* Download — border, rounded-lg */}
                <div style={{ padding: 5, borderRadius: 8, border: "1px solid var(--line)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconDownload /></div>
                {/* Annotations toggle — border, rounded-lg */}
                <div style={{ padding: 5, borderRadius: 8, border: "1px solid var(--line)", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconPanelRightOpen /></div>
              </div>
            </motion.div>

            {/* Wireframe — real HTML from the sneakers demo, in a scaled iframe */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "var(--canvas-bg)" }}>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease }}
                style={{
                  position: "absolute",
                  top: 8, bottom: 8, left: 0, right: 0,
                  margin: "0 auto",
                  borderRadius: 6, border: "1px solid var(--line)", overflow: "hidden", background: "#fff",
                  width: viewport === 375 ? 165 : viewport === 768 ? 340 : "calc(100% - 16px)",
                  maxWidth: 640,
                  transition: "width 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}>
                <div style={{ width: viewport, height: 2000, transform: `scale(${viewportScale})`, transformOrigin: "top left", transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
                  <iframe
                    src="/demo-wireframe.html"
                    title="Wireframe preview"
                    style={{ width: "100%", height: "100%", border: "none" }}
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </div>

            {/* Bottom bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", borderTop: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>Copiez le HTML &rarr; <strong>htmlto.design</strong> dans Figma &rarr; onglet Code &rarr; collez.</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>5 sections</span>
                <div style={{ display: "flex", padding: 2, borderRadius: 6, background: "var(--surface-hover)" }}>
                  {([
                    { w: 1440 as const, icon: IconMonitor },
                    { w: 768 as const, icon: IconTablet },
                    { w: 375 as const, icon: IconSmartphone },
                  ]).map(v => (
                    <div key={v.w} onClick={() => setViewport(v.w)} style={{ padding: "3px 5px", borderRadius: 4, cursor: "pointer", color: viewport === v.w ? "var(--accent)" : "var(--text-faint)", background: viewport === v.w ? "var(--elevated)" : "transparent", boxShadow: viewport === v.w ? "0 1px 2px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}><v.icon /></div>
                  ))}
                </div>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)" }}>{viewportLabel}</span>
              </div>
            </motion.div>
          </div>

          {/* ── AI bar — exact replica of AiBar.tsx ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3, ease }}
            style={{
              position: "absolute", bottom: 12, left: 170, right: 0,
              margin: "0 auto", width: 420, borderRadius: 12, overflow: "hidden",
              border: "1px solid var(--line-strong)", background: "var(--elevated)",
              boxShadow: "var(--shadow-panel)", zIndex: 20,
            }}>
            {/* Header — Sparkles "Assistant IA" | speed + source picker + close */}
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
            <div style={{ padding: "6px 10px 8px 12px", display: "flex", gap: 6, alignItems: "flex-end" }}>
              <div style={{ flex: 1, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)", overflow: "hidden" }}>
                <div style={{ padding: "7px 10px", fontSize: 11, color: "var(--text-faint)" }}>
                  Wireframe &ldquo;Accueil&rdquo; &mdash; d&eacute;cris les modifications...
                </div>
                {/* Paperclip row */}
                <div style={{ padding: "0 8px 5px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" /></svg>
                </div>
              </div>
              {/* Send button — rounded-lg, accent bg */}
              <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent)", opacity: 0.4, cursor: "not-allowed", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>
              </div>
            </div>
            {/* Hints */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 12px 6px", fontSize: 9, color: "var(--text-faint)" }}>
              <span>Enter pour envoyer, Shift+Enter pour retour ligne</span>
              <span>Esc pour fermer</span>
            </div>
          </motion.div>
        </div>
      </>}
    </div>
    </>
  )
}
