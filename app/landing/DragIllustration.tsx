"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const ease = [0.16, 1, 0.3, 1] as const

type DTxt = { project: string; saved: string; share: string; home: string; produit: string; ressources: string; solutions: string; blog: string; webinaires: string; api: string }
const dtxt: Record<string, DTxt> = {
  fr: { project: "Mon site web", saved: "Sauvegardé", share: "Partager", home: "Accueil", produit: "Produit", ressources: "Ressources", solutions: "Solutions", blog: "Blog", webinaires: "Webinaires", api: "API Docs" },
  en: { project: "My website", saved: "Saved", share: "Share", home: "Home", produit: "Product", ressources: "Resources", solutions: "Solutions", blog: "Blog", webinaires: "Webinars", api: "API Docs" },
}

const CANVAS_W = 1100
const CANVAS_H = 580
const CHROME_H = 44

/* ─────────────────────────────────────────
   Canvas center = 550px  (1100/2)
   Scale ~0.9 at desktop → everything scaled down, crisp

   home (center=550)
   ├─ produit    (center=358)  []                      → [Blog]
   ├─ ressources (center=551)  [Blog, Webinaires, API] → [Webinaires, API]
   └─ solutions  (center=788)  badge "2↓" only

   NW=97, NH=34, SN compact w=128 h=34

   Ressources 3-child centered at 551: blog=436, web=549, api=662
     blog       INIT x=388  → FINAL x=309 (dx=−79, to Produit center 358)
     webinaires INIT x=501  → FINAL x=445 (dx=−56, closes gap)
     api        INIT x=614  → FINAL x=558 (dx=−56, closes gap)
───────────────────────────────────────── */

const NW = 97, NH = 34

const SN = {
  home:       { x: 440, y: 0,   w: 220, h: 318 },
  produit:    { x: 294, y: 400, w: 128, h: 34  },
  ressources: { x: 487, y: 400, w: 128, h: 34  },
  solutions:  { x: 724, y: 400, w: 128, h: 34  },
} as const
type SNodeId = keyof typeof SN

const I0 = {
  blog:       { x: 388, y: 530 },
  webinaires: { x: 501, y: 530 },
  api:        { x: 614, y: 530 },
}
const DX = {
  blog:       -79, // to Produit center 358
  webinaires: -56, // closes gap
  api:        -56, // closes gap
}

/* ─── Edge helpers ─── */
function cx(n: { x: number; w: number }) { return n.x + n.w / 2 }
function by(n: { y: number; h: number }) { return n.y + n.h }
function ePath(fx: number, fy: number, tx: number, ty: number) {
  const dy = ty - fy
  const pull = Math.max(dy * 0.55, 30)
  return `M ${fx} ${fy} C ${fx} ${fy + pull}, ${tx} ${ty - pull}, ${tx} ${ty}`
}

/* ─── Wireframe bits ─── */
function WfSection({ label, bg, border, h, children }: { label: string; bg: string; border: string; h: number; children?: React.ReactNode }) {
  return (
    <div style={{ background: bg, borderLeft: `4px solid ${border}`, borderRadius: 3, marginBottom: 3, overflow: "hidden" }}>
      <div style={{ padding: "3px 5px 1px" }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--label-color)" }}>{label}</span>
      </div>
      <div style={{ height: h }}>{children}</div>
    </div>
  )
}
function SkinNav() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 6px" }}>
    <div className="wf-strong" style={{ width: 15, height: 3, borderRadius: 1 }} />
    <div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i=><div key={i} className="wf-faint" style={{ width: 11, height: 3, borderRadius: 1 }} />)}</div>
  </div>
}
function SkinHero() {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 4 }}>
    <div className="wf-strong" style={{ width: "55%", height: 3, borderRadius: 1 }} />
    <div className="wf-faint"  style={{ width: "38%", height: 3, borderRadius: 1 }} />
    <div className="wf-strong" style={{ width: 34, height: 8, borderRadius: 3, marginTop: 3 }} />
  </div>
}
function SkinCards() {
  return <div style={{ display: "flex", gap: 3, height: "100%", padding: "3px 4px" }}>
    {[0,1,2].map(i=><div key={i} className="wf-card" style={{ flex: 1, borderRadius: 3, padding: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <div className="wf-faint" style={{ width: "100%", height: 9, borderRadius: 1 }} />
      <div className="wf-faint" style={{ width: "60%", height: 3, borderRadius: 1 }} />
    </div>)}
  </div>
}
function SkinSocialProof() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: "100%" }}>
    {[0,1,2,3,4].map(i=><div key={i} className="wf-faint" style={{ width: 18, height: 8, borderRadius: 1 }} />)}
  </div>
}
function SkinDoubleCta() {
  return <div style={{ display: "flex", gap: 4, height: "100%", padding: "4px 6px" }}>
    <div style={{ flex: 1, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent)", opacity: 0.85 }}>
      <div style={{ width: "40%", height: 3, borderRadius: 1, background: "rgba(255,255,255,0.85)" }} />
    </div>
    <div style={{ flex: 1, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--accent)", opacity: 0.7 }}>
      <div style={{ width: "40%", height: 3, borderRadius: 1, background: "var(--accent)" }} />
    </div>
  </div>
}
function SkinArguments() {
  return <div style={{ display: "flex", gap: 3, height: "100%", padding: "2px 4px" }}>
    {[0,1,2].map(i=><div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 2 }}>
      <div className="wf-strong" style={{ width: 9, height: 9, borderRadius: "50%" }} />
      <div className="wf-faint" style={{ width: "80%", height: 3, borderRadius: 1 }} />
    </div>)}
  </div>
}
function SkinFooter() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 6px" }}>
    <div className="wf-faint" style={{ width: 12, height: 3, borderRadius: 1 }} />
    <div style={{ display: "flex", gap: 5 }}>{[0,1,2].map(i=><div key={i} className="wf-faint" style={{ width: 8, height: 3, borderRadius: 1 }} />)}</div>
  </div>
}

/* ─── Icons ─── */
const Ic = ({ d, s = 14 }: { d: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconChevronLeft = () => <Ic d="m15 18-6-6 6-6" />
const IconUndo2  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
const IconRedo2  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>
const IconFileDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
const IconCloud  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
const IconMore   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
const IconMoon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
const IconShare2 = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
const IconPlus   = () => <Ic d="M5 12h14M12 5v14" />
const IconMinus  = () => <Ic d="M5 12h14" />
const IconMaximize = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
const ArboLogo = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)"/><path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6"/><path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6"/></svg>

/* ─── HBtn ─── */
function HBtn({ children, style, disabled }: { children: React.ReactNode; style?: React.CSSProperties; disabled?: boolean }) {
  return (
    <button disabled={disabled} className="transition-colors duration-100 active:scale-95" style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: disabled ? "default" : "pointer", background: "transparent", borderRadius: 6, ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
      {children}
    </button>
  )
}

/* ─── PresenceAvatars — exact match of real component ─── */
const COLLABS = [
  { src: "https://i.pravatar.cc/56?img=47", name: "Sara A.", color: "#4F46E5", active: false },
  { src: "https://i.pravatar.cc/56?img=11", name: "Marc L.", color: "#059669", active: false },
]
function PresenceAvatarsDemo() {
  return (
    <div style={{ display: "flex", alignItems: "center", marginLeft: -6 }}>
      {COLLABS.map((u, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + i * 0.12, type: "spring", damping: 20, stiffness: 300 }}
          title={u.name}
          style={{
            position: "relative", width: 28, height: 28, borderRadius: "50%",
            marginLeft: i > 0 ? -6 : 0, flexShrink: 0,
            border: "2px solid var(--surface)",
            boxShadow: `0 0 0 1px ${u.color}40`,
            overflow: "hidden", backgroundColor: u.color,
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u.src} alt={u.name} width={28} height={28} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
          {u.active && (
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22C55E", border: "2px solid var(--surface)" }} />
          )}
        </motion.div>
      ))}
    </div>
  )
}

/* ─── App Chrome ─── */
function AppChrome({ dt }: { dt: DTxt }) {
  return (
    <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ height: CHROME_H, padding: "0 8px 0 4px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <HBtn style={{ padding: 6, color: "var(--text-faint)" }}><IconChevronLeft /></HBtn>
        <div style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}><ArboLogo /></div>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{dt.project}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 10, padding: 2, borderRadius: 8, background: "var(--surface-hover)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--accent)", background: "var(--elevated)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg><span>Sitemap</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--text-faint)", cursor: "pointer" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg><span>Wireframe</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
          <HBtn disabled style={{ padding: 6, color: "var(--text-muted)", opacity: 0.3 }}><IconUndo2 /></HBtn>
          <HBtn disabled style={{ padding: 6, color: "var(--text-muted)", opacity: 0.3 }}><IconRedo2 /></HBtn>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <PresenceAvatarsDemo />
        <div style={{ width: 1, height: 16, background: "var(--line)", margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", color: "var(--text-faint)", fontSize: 10 }}><IconCloud /><span>{dt.saved}</span></div>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)" }}>8p</span>
        <HBtn style={{ padding: "5px 10px", color: "var(--text-muted)", fontSize: 10, fontWeight: 500, gap: 5 }}><IconFileDown /><span>PDF</span></HBtn>
        <div style={{ position: "relative" }}>
          <HBtn style={{ padding: 6, color: "var(--text-muted)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg></HBtn>
          <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: "#F76B15", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>3</span></div>
        </div>
        <HBtn style={{ padding: 6, color: "var(--text-muted)" }}><IconMore /></HBtn>
        <button className="transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-theme-glow active:scale-95" style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--controls-bg,var(--surface))", border: "1px solid var(--line)", cursor: "pointer" }}>
          <span style={{ color: "var(--controls-fill,var(--text-muted))" }}><IconMoon /></span>
        </button>
        <button className="transition-[transform,filter] duration-150 hover:brightness-125 active:scale-95" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 6, backgroundColor: "#F76B1520", color: "#F76B15", fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer" }}>
          <IconShare2 /><span>{dt.share}</span>
        </button>
      </div>
    </motion.header>
  )
}

/* ─── Home card ─── */
function HomeCard({ homeLabel }: { homeLabel: string }) {
  const n = SN.home
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1, ease }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: "auto", background: "var(--card-bg)", borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)", cursor: "pointer" }}>
      <div style={{ height: 6, background: "var(--accent)" }} />
      <div style={{ height: 30, background: "var(--accent-muted)", borderBottom: "1px solid var(--accent-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 9px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--title-color)" }}>{homeLabel}</span>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7 }}>7↓</span>
      </div>
      <div style={{ padding: "5px 5px 0" }}>
        <WfSection label="Navigation"    bg="rgba(139,147,165,0.10)" border="rgba(139,147,165,0.45)" h={6}><SkinNav /></WfSection>
        <WfSection label="Hero Section"  bg="rgba(124,93,250,0.09)"  border="rgba(124,93,250,0.55)"  h={21}><SkinHero /></WfSection>
        <WfSection label="Fonctionnalités" bg="rgba(67,140,245,0.09)" border="rgba(67,140,245,0.50)" h={12}><SkinCards /></WfSection>
        <WfSection label="Arguments"     bg="rgba(255,120,80,0.08)"  border="rgba(255,120,80,0.45)"  h={12}><SkinArguments /></WfSection>
        <WfSection label="Social Proof"  bg="rgba(100,140,255,0.08)" border="rgba(100,140,255,0.40)" h={8}><SkinSocialProof /></WfSection>
        <WfSection label="CTA"           bg="rgba(94,106,210,0.08)"  border="rgba(94,106,210,0.70)"  h={8}><SkinDoubleCta /></WfSection>
        <WfSection label="Footer"        bg="rgba(100,116,139,0.08)" border="rgba(100,116,139,0.35)" h={5}><SkinFooter /></WfSection>
      </div>
    </motion.div>
  )
}

/* ─── Static compact card ─── */
function SCard({ id, label, delay, badge }: { id: SNodeId; label: string; delay: number; badge?: string }) {
  const n = SN[id]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }}
      whileHover={{ y: -1, boxShadow: "0 4px 14px rgba(0,0,0,0.12), 0 0 0 1.5px var(--card-ring-hover)" }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h, background: "var(--card-bg)", borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring)", cursor: "pointer", transition: "box-shadow 0.2s" }}>
      <div style={{ padding: "0 11px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card-title-bg)" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--title-color)" }}>{label}</span>
        {badge && <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--label-color)", opacity: 0.7 }}>{badge}</span>}
      </div>
    </motion.div>
  )
}

/* ─── Dynamic node card ─── */
function DNode({
  label, baseX, baseY, dx, atFinal,
  isDragged, isLifted, isSnap,
}: {
  label: string; baseX: number; baseY: number; dx: number;
  atFinal: boolean;
  isDragged?: boolean; isLifted?: boolean; isSnap?: boolean;
}) {
  const moveTr = { duration: 0.88, ease: [0.16, 1, 0.3, 1] as const }
  const snapTr = { type: "spring" as const, damping: 22, stiffness: 300 }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        x: atFinal ? dx : 0,
        scale: isDragged && isLifted ? 1.05 : 1,
        rotate: isDragged && isLifted ? (dx < 0 ? -1.8 : 1.8) : 0,
        boxShadow: isDragged && isLifted
          ? "0 14px 40px rgba(0,0,0,0.22), 0 0 0 2px var(--accent)"
          : isDragged && isSnap
            ? "0 6px 18px rgba(0,0,0,0.14), 0 0 0 2px var(--accent)"
            : "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring)",
      }}
      transition={isDragged && isSnap ? snapTr : moveTr}
      style={{
        position: "absolute", left: baseX, top: baseY, width: NW, height: NH,
        background: "var(--card-bg)", borderRadius: 4, overflow: "hidden",
        cursor: isDragged ? (isLifted ? "grabbing" : "grab") : "pointer",
        zIndex: isDragged && isLifted ? 20 : 5,
        transformOrigin: "center center", willChange: "transform",
      }}>
      <div style={{ padding: "0 11px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card-title-bg)" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--title-color)" }}>{label}</span>
        {isDragged && isLifted && (
          <span style={{ fontSize: 12, color: "var(--text-faint)", opacity: 0.4 }}>⠿</span>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Zoom controls ─── */
function ZoomControls() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      style={{ position: "absolute", bottom: 14, left: 14, display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)", zIndex: 10 }}>
      {[{ icon: <IconPlus />, b: true }, { icon: <IconMinus />, b: true }, { icon: <IconMaximize />, b: false }].map((btn, i) => (
        <button key={i} style={{ padding: "6px 8px", color: "var(--text-muted)", cursor: "pointer", background: "transparent", border: "none", borderBottom: btn.b ? "1px solid var(--line)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.04))" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
          {btn.icon}
        </button>
      ))}
    </motion.div>
  )
}

/* ─── Mini map ─── */
function FakeMiniMap({ blogX }: { blogX: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      style={{ position: "absolute", bottom: 14, right: 14, width: 96, height: 64, borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", zIndex: 10, overflow: "hidden", padding: 5 }}>
      {Object.values(SN).map((n, i) => (
        <div key={i} style={{
          position: "absolute",
          left: 5 + (n.x / CANVAS_W) * 86, top: 5 + (n.y / CANVAS_H) * 54,
          width: Math.max((n.w / CANVAS_W) * 86, 4), height: Math.max((n.h / CANVAS_H) * 54, 2),
          background: i === 0 ? "var(--accent)" : "var(--text-faint)", borderRadius: 1, opacity: i === 0 ? 0.7 : 0.45,
        }} />
      ))}
      {/* Animated blog dot */}
      <motion.div animate={{ left: 5 + (blogX / CANVAS_W) * 86 }} transition={{ ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", top: 5 + (I0.blog.y / CANVAS_H) * 54, width: (NW / CANVAS_W) * 86, height: 2, background: "var(--accent)", borderRadius: 1, opacity: 0.8 }} />
      <div style={{ position: "absolute", left: 10, top: 5, width: 50, height: 34, border: "1.5px solid var(--accent)", borderRadius: 2, opacity: 0.35 }} />
    </motion.div>
  )
}

/* ═══════════════════════════
   Main
═══════════════════════════ */
export default function DragIllustration({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const dt = dtxt[locale]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [scale, setScale] = useState(0.7)
  const [mobile, setMobile] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    function calc() {
      if (!ref.current) return
      const w = ref.current.clientWidth
      const m = w < 640
      const h = w * 9 / 16 - CHROME_H
      setScale(m ? (w / 500) : Math.min(w / CANVAS_W, (h + 50) / CANVAS_H) * 0.93)
      setMobile(m)
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  useEffect(() => {
    if (!inView) return
    // [phase, ms]
    const seq: [number, number][] = [
      [0, 1600],  // rest at origin
      [1, 360],   // lift
      [2, 900],   // drag → Produit  (all siblings re-layout simultaneously)
      [3, 450],   // hover over drop zone
      [4, 130],   // snap drop
      [5, 2200],  // rest at Produit
      [6, 360],   // lift back
      [7, 900],   // drag back → Ressources
      [8, 130],   // snap back
    ]
    let idx = 0
    let t: ReturnType<typeof setTimeout>
    function tick() {
      const [p, dur] = seq[idx]
      setPhase(p)
      idx = (idx + 1) % seq.length
      t = setTimeout(tick, dur)
    }
    t = setTimeout(tick, 500)
    return () => clearTimeout(t)
  }, [inView])

  /* ─── Derived state ─── */
  // atFinal: all nodes shifted to their FINAL positions
  const atFinal       = phase >= 2 && phase <= 6
  const blogLifted    = phase === 1 || phase === 2 || phase === 3 || phase === 6 || phase === 7
  const blogSnap      = phase === 4 || phase === 8
  const showGhostSrc  = phase >= 1 && phase <= 3   // ghost where blog was (Ressources)
  const showGhostDst  = phase >= 6 && phase <= 7   // ghost where blog is (Produit)
  const showDZProduit = phase === 2 || phase === 3  // drop zone at Produit slot
  const showDZRes     = phase === 7                 // drop zone at Ressources slot (dragging back)

  // Blog edge: which parent draws it
  const blogEdge = phase <= 1 || phase === 8
    ? "ressources"
    : phase >= 4 && phase <= 6
      ? "produit"
      : "none"

  // Ressources badge
  const resBadge = atFinal && phase >= 4 ? "2↓" : "3↓"

  // Blog x for minimap
  const blogMiniX = atFinal ? I0.blog.x + DX.blog : I0.blog.x

  // Edge base coords
  const homeB = { x: cx(SN.home), y: by(SN.home) }
  const resB  = { x: cx(SN.ressources), y: by(SN.ressources) }
  const proB  = { x: cx(SN.produit),    y: by(SN.produit)    }

  // Dynamic edge targets (sibling nodes animate so their centers shift)
  function webCx() { return I0.webinaires.x + NW/2 + (atFinal ? DX.webinaires : 0) }
  function apiCx()  { return I0.api.x       + NW/2 + (atFinal ? DX.api       : 0) }

  return (
    <div ref={ref} className={mobile ? "aspect-[3/4]" : "aspect-[16/9]"} style={{
      marginTop: 28, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)",
      background: "var(--canvas-bg)", width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 80px rgba(0,0,0,0.08)",
    }}>
      {inView && <>
        {!mobile && <AppChrome dt={dt} />}
        <div style={{ position: "relative", width: "100%", height: mobile ? "100%" : `calc(100% - ${CHROME_H}px)`, overflow: "hidden" }}>
          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.5 }} />

          {/* ─── Scaled canvas ─── */}
          <div style={{ width: CANVAS_W, height: CANVAS_H, position: "absolute", left: mobile ? -80 : "50%", top: mobile ? -20 : -50, transform: mobile ? `scale(${scale})` : `translateX(-50%) scale(${scale})`, transformOrigin: mobile ? "top left" : "top center" }}>

            {/* ── SVG Edges ── */}
            <svg style={{ position: "absolute", inset: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none", overflow: "visible" }}>

              {/* Home → level 1 */}
              {[cx(SN.produit), cx(SN.ressources), cx(SN.solutions)].map((tx, i) => (
                <motion.path key={i} fill="none" stroke="var(--line)" strokeWidth={1.5}
                  d={ePath(homeB.x, homeB.y, tx, SN.produit.y)}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease }} />
              ))}

              {/* Ressources → webinaires (endpoint follows animation) */}
              <path fill="none" stroke="var(--line)" strokeWidth={1.5}
                d={ePath(resB.x, resB.y, webCx(), I0.webinaires.y)} />
              {/* Ressources → api */}
              <path fill="none" stroke="var(--line)" strokeWidth={1.5}
                d={ePath(resB.x, resB.y, apiCx(), I0.api.y)} />

              {/* Blog solid edge */}
              {blogEdge === "ressources" && (
                <motion.path fill="none" stroke="var(--line)" strokeWidth={1.5}
                  d={ePath(resB.x, resB.y, I0.blog.x + NW/2, I0.blog.y)}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }} />
              )}
              {blogEdge === "produit" && (
                <motion.path fill="none" stroke="var(--line)" strokeWidth={1.5}
                  d={ePath(proB.x, proB.y, I0.blog.x + NW/2 + DX.blog, I0.blog.y)}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.35 }} />
              )}
              {/* Dashed old edge (blog leaving Ressources) */}
              {(phase === 1 || phase === 2 || phase === 3) && (
                <path fill="none" stroke="var(--line)" strokeWidth={1.1}
                  strokeDasharray="4 3" opacity={0.28}
                  d={ePath(resB.x, resB.y, I0.blog.x + NW/2, I0.blog.y)} />
              )}
              {/* Dashed preview edge Produit → blog target */}
              {(phase === 2 || phase === 3) && (
                <motion.path fill="none" stroke="var(--accent)" strokeWidth={1.4}
                  strokeDasharray="5 3" opacity={0.6}
                  d={ePath(proB.x, proB.y, I0.blog.x + NW/2 + DX.blog, I0.blog.y)}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.2 }} />
              )}
              {/* Dashed old (blog leaving Produit back) */}
              {(phase === 6 || phase === 7) && (
                <path fill="none" stroke="var(--line)" strokeWidth={1.1}
                  strokeDasharray="4 3" opacity={0.28}
                  d={ePath(proB.x, proB.y, I0.blog.x + NW/2 + DX.blog, I0.blog.y)} />
              )}
            </svg>

            {/* ── Static level 1 ── */}
            <HomeCard homeLabel={dt.home} />
            <SCard id="produit"    label={dt.produit}    delay={0.28} />
            <SCard id="ressources" label={dt.ressources} delay={0.31} badge={resBadge} />
            <SCard id="solutions"  label={dt.solutions}  delay={0.34} badge="2↓" />


            {/* ── Dynamic Ressources children ── */}
            <DNode label={dt.webinaires} baseX={I0.webinaires.x} baseY={I0.webinaires.y} dx={DX.webinaires} atFinal={atFinal} />
            <DNode label={dt.api}        baseX={I0.api.x}        baseY={I0.api.y}        dx={DX.api}        atFinal={atFinal} />

            {/* ── Ghost at source (Ressources slot) while dragging forward ── */}
            <AnimatePresence>
              {showGhostSrc && (
                <motion.div key="ghost-src"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ position: "absolute", left: I0.blog.x, top: I0.blog.y, width: NW, height: NH, borderRadius: 4, border: "1.5px dashed var(--line)", opacity: 0.35, pointerEvents: "none" }} />
              )}
            </AnimatePresence>

            {/* ── Ghost at destination (Produit slot) while dragging back ── */}
            <AnimatePresence>
              {showGhostDst && (
                <motion.div key="ghost-dst"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ position: "absolute", left: I0.blog.x + DX.blog, top: I0.blog.y, width: NW, height: NH, borderRadius: 4, border: "1.5px dashed var(--line)", opacity: 0.35, pointerEvents: "none" }} />
              )}
            </AnimatePresence>

            {/* ── Drop zone at Produit slot ── */}
            <AnimatePresence>
              {showDZProduit && (
                <motion.div key="dz-produit"
                  initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  style={{ position: "absolute", left: I0.blog.x + DX.blog, top: I0.blog.y, width: NW, height: NH, borderRadius: 4, border: "1.5px dashed var(--accent)", background: "var(--accent-muted)", pointerEvents: "none", zIndex: 4 }}>
                  <motion.div animate={{ opacity: [0.05, 0.18, 0.05] }} transition={{ repeat: Infinity, duration: 0.85 }}
                    style={{ position: "absolute", inset: 0, borderRadius: 4, background: "var(--accent)" }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Drop zone at Ressources slot (dragging back) ── */}
            <AnimatePresence>
              {showDZRes && (
                <motion.div key="dz-res"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} exit={{ opacity: 0 }}
                  style={{ position: "absolute", left: I0.blog.x, top: I0.blog.y, width: NW, height: NH, borderRadius: 4, border: "1.5px dashed var(--line)", background: "var(--surface)", pointerEvents: "none", zIndex: 4 }} />
              )}
            </AnimatePresence>

            {/* ── Blog node — THE dragged card ── */}
            <DNode
              label={dt.blog}
              baseX={I0.blog.x} baseY={I0.blog.y}
              dx={DX.blog} atFinal={atFinal}
              isDragged isLifted={blogLifted} isSnap={blogSnap}
            />

          </div>

          {!mobile && <ZoomControls />}
          {!mobile && <FakeMiniMap blogX={blogMiniX} />}
        </div>
      </>}
    </div>
  )
}
