"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const ease = [0.16, 1, 0.3, 1] as const

const txt = {
  fr: {
    recentProjects: "Projets récents",
    projects: [
      { name: "E-commerce sneakers", pages: "24", time: "il y a 2h" },
      { name: "Portfolio agence", pages: "8", time: "hier" },
      { name: "App SaaS B2B", pages: "31", time: "il y a 3j" },
    ],
    newProject: "Nouveau projet",
    generateAi: "Générer avec l'IA",
    generateAiDesc: "Décris ton site, l'IA crée l'arborescence",
    emptyProject: "Projet vide",
    emptyProjectDesc: "Construire manuellement",
    importSite: "Importer un site existant",
    importSiteDesc: "URL, sitemap XML ou liste de pages",
    projectName: "Nom du projet",
    optional: "optionnel",
    describeLabel: "Décris ton site",
    descPlaceholder: "Ex : Site e-commerce de sneakers vintage...",
    typedName: "Refonte site ACME",
    typedDesc: "Site e-commerce de sneakers vintage avec blog, espace membre, programme de fidélité et click & collect",
    fast: "Rapide",
    quality: "Qualité",
    back: "Retour",
    generate: "Générer l'arborescence",
    hint: "Ctrl+Enter pour générer · Clé API perso dans Paramètres > IA",
  },
  en: {
    recentProjects: "Recent projects",
    projects: [
      { name: "Sneakers e-commerce", pages: "24", time: "2h ago" },
      { name: "Agency portfolio", pages: "8", time: "yesterday" },
      { name: "B2B SaaS App", pages: "31", time: "3d ago" },
    ],
    newProject: "New project",
    generateAi: "Generate with AI",
    generateAiDesc: "Describe your site, AI creates the sitemap",
    emptyProject: "Empty project",
    emptyProjectDesc: "Build manually",
    importSite: "Import existing site",
    importSiteDesc: "URL, XML sitemap or page list",
    projectName: "Project name",
    optional: "optional",
    describeLabel: "Describe your site",
    descPlaceholder: "E.g.: Vintage sneakers e-commerce with blog...",
    typedName: "ACME Website Redesign",
    typedDesc: "Vintage sneakers e-commerce with blog, member area, loyalty program and click & collect",
    fast: "Fast",
    quality: "Quality",
    back: "Back",
    generate: "Generate sitemap",
    hint: "Ctrl+Enter to generate · Custom API key in Settings > AI",
  },
} as const

/* ═══ Icons ═══ */
const IconX = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>)
const IconSparkles = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>)
const IconFileText = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>)
const IconGlobe = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>)
const IconArrowRight = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>)
const IconZap = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>)
const IconGem = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 3 8 9l4 13 4-13-2.5-6" /><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" /><path d="M2 9h20" /></svg>)
const IconKey = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" /></svg>)
const IconWand = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" /></svg>)

const ArboLogo = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)" /><path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6" /><path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6" /></svg>)

/* ═══ Typing animation hook ═══ */
function useTyping(text: string, startDelay: number, speed = 40) {
  const [typed, setTyped] = useState("")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(t1)
  }, [startDelay])

  useEffect(() => {
    if (!started) return
    if (typed.length >= text.length) return
    const t = setTimeout(() => setTyped(text.slice(0, typed.length + 1)), speed)
    return () => clearTimeout(t)
  }, [started, typed, text, speed])

  return typed
}

/* ═══ Icons for background ═══ */
const IconMoon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>)
const IconPlus = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>)

/* ═══ Background: real app home page ═══ */
function BlurredBackground({ l }: { l: "fr" | "en" }) {
  const t = txt[l]
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--canvas-bg)", overflow: "hidden" }}>
      {/* Header — exact match of app/page.tsx header */}
      <header style={{
        height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 12px 0 20px", borderBottom: "1px solid var(--line)",
      }}>
        {/* Left: logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L16 6L12 10L8 6L12 2Z" fill="var(--text-primary)" />
              <path d="M5 11L9 15L5 19L1 15L5 11Z" fill="var(--text-primary)" opacity="0.6" />
              <path d="M19 11L23 15L19 19L15 15L19 11Z" fill="var(--text-primary)" opacity="0.6" />
              <line x1="9.5" y1="7.5" x2="6.5" y2="12.5" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4" />
              <line x1="14.5" y1="7.5" x2="17.5" y2="12.5" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>arbo</span>
        </div>
        {/* Right: project count + theme toggle + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)" }}>{l === "fr" ? "3 projets" : "3 projects"}</span>
          {/* Theme toggle — exact match */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--controls-bg, var(--surface))", border: "1px solid var(--line)",
          }}>
            <span style={{ color: "var(--controls-fill, var(--text-muted))" }}><IconMoon /></span>
          </div>
          {/* Avatar — real photo, w-7 h-7 rounded-full like UserMenu */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar-demo.jpg" alt="" width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover", display: "block" }} />
        </div>
      </header>

      {/* Project list — matches app/page.tsx main content */}
      <div style={{ maxWidth: 512, margin: "0 auto", padding: "32px 16px 0" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "var(--text-faint)" }}>{t.recentProjects}</span>
          {/* NewProjectButton "small" variant — exact match */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8,
            background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 500,
          }}>
            <IconPlus /> {l === "fr" ? "Nouveau" : "New"}
          </div>
        </div>

        {/* ProjectCard rows — exact style from ProjectCard component */}
        {t.projects.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8, marginBottom: 2,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--card-title-bg)", border: "1px solid var(--card-ring)",
            }}>
              <ArboLogo />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</p>
            </div>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)", flexShrink: 0 }}>{p.pages}p</span>
            <span style={{ fontSize: 10, color: "var(--text-faint)", flexShrink: 0 }}>{p.time}</span>
          </div>
        ))}
      </div>

      {/* Blur overlay — exact: backdrop-blur-[2px] + var(--overlay-bg) */}
      <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", background: "var(--overlay-bg)" }} />
    </div>
  )
}

/* ═══ Step 1: "Nouveau projet" modal ═══ */
function NewProjectModal({ onSelect, l }: { onSelect: () => void; l: "fr" | "en" }) {
  const t = txt[l]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.3, ease }}
      style={{
        width: "100%", maxWidth: 440, borderRadius: 12, overflow: "hidden",
        background: "var(--elevated)", border: "1px solid var(--line-strong)",
        boxShadow: "var(--modal-shadow)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.newProject}</h3>
        <div style={{ padding: 6, borderRadius: 6, color: "var(--text-muted)" }}><IconX /></div>
      </div>

      {/* Options */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { icon: <IconSparkles />, iconBg: "var(--accent)", iconColor: "#fff", title: t.generateAi, desc: t.generateAiDesc, active: true },
          { icon: <IconFileText />, iconBg: "var(--elevated)", iconColor: "var(--text-muted)", title: t.emptyProject, desc: t.emptyProjectDesc, active: false },
          { icon: <IconGlobe />, iconBg: "var(--elevated)", iconColor: "var(--text-muted)", title: t.importSite, desc: t.importSiteDesc, active: false },
        ].map((opt, i) => (
          <button
            key={i}
            onClick={opt.active ? onSelect : undefined}
            className="group transition-[transform,border-color,box-shadow] duration-150"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 8,
              textAlign: "left", background: "var(--surface)", border: "1px solid var(--line)",
              cursor: opt.active ? "pointer" : "default",
            }}
            onMouseEnter={e => { if (opt.active) e.currentTarget.style.borderColor = "var(--accent-strong)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)" }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: opt.iconBg, color: opt.iconColor, flexShrink: 0,
              border: opt.active ? "none" : "1px solid var(--line-strong)",
            }}>{opt.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{opt.title}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{opt.desc}</p>
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-faint)", flexShrink: 0 }}><IconArrowRight /></span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══ Step 2: "Générer avec l'IA" modal ═══ */
function GenerateModal({ active, l }: { active: boolean; l: "fr" | "en" }) {
  const t = txt[l]
  const projectName = useTyping(t.typedName, active ? 400 : 99999, 50)
  const description = useTyping(
    t.typedDesc,
    active ? 1400 : 99999,
    30,
  )
  const canGenerate = description.length > 20

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.3, ease }}
      style={{
        width: "100%", maxWidth: 440, borderRadius: 12, overflow: "hidden",
        background: "var(--elevated)", border: "1px solid var(--line-strong)",
        boxShadow: "var(--modal-shadow)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.generateAi}</h3>
        <div style={{ padding: 6, borderRadius: 6, color: "var(--text-muted)" }}><IconX /></div>
      </div>

      {/* Form */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Project name */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
            {t.projectName} <span style={{ color: "var(--text-faint)" }}>({t.optional})</span>
          </label>
          <div style={{
            width: "100%", height: 36, padding: "0 12px", borderRadius: 8, fontSize: 12,
            background: "var(--elevated)", color: "var(--text-primary)",
            border: "1px solid var(--line-strong)", display: "flex", alignItems: "center",
          }}>
            {projectName}<span className="animate-pulse" style={{ display: active && projectName.length < 18 ? "inline" : "none", width: 1, height: 14, background: "var(--text-primary)", marginLeft: 1 }} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
            {t.describeLabel}
          </label>
          <div style={{
            width: "100%", minHeight: 72, padding: "8px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5,
            background: "var(--elevated)", color: "var(--text-primary)",
            border: "1px solid var(--line-strong)",
          }}>
            {description || <span style={{ color: "var(--text-faint)" }}>{t.descPlaceholder}</span>}
            <span className="animate-pulse" style={{ display: active && description.length < 100 ? "inline" : "none", width: 1, height: 14, background: "var(--text-primary)", marginLeft: 1, verticalAlign: "middle" }} />
          </div>
        </div>

        {/* Speed toggle + BYOK */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              height: 32, padding: "0 12px", borderRadius: 8, fontSize: 10, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface)", color: "var(--text-faint)", border: "1px solid var(--line)",
            }}><IconZap /> {t.fast}</div>
            <div style={{
              height: 32, padding: "0 12px", borderRadius: 8, fontSize: 10, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid var(--accent-strong)",
            }}><IconGem /> {t.quality} <span style={{ opacity: 0.6 }}>3x</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, color: "var(--text-faint)", fontSize: 10 }}>
            <IconKey /> BYOK
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <div style={{
            padding: "0 12px", height: 36, borderRadius: 8, fontSize: 10, display: "flex", alignItems: "center",
            color: "var(--text-muted)", border: "1px solid var(--line)",
          }}>{t.back}</div>
          <motion.div
            animate={{ opacity: canGenerate ? 1 : 0.4 }}
            style={{
              flex: 1, height: 36, borderRadius: 8, fontSize: 10, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "var(--accent)", color: "#fff",
            }}
          >
            <IconWand /> {t.generate}
          </motion.div>
        </div>

        <p style={{ fontSize: 10, color: "var(--text-faint)", textAlign: "center" }}>
          {t.hint}
        </p>
      </div>
    </motion.div>
  )
}

/* ═══ Main Illustration ═══ */
export default function GenerateIllustration({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const [step, setStep] = useState<1 | 2>(1)

  // Auto-advance from step 1 to step 2
  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setStep(2), 2200)
    return () => clearTimeout(t)
  }, [inView])

  // Loop: reset after typing finishes
  useEffect(() => {
    if (!inView || step !== 2) return
    const t = setTimeout(() => {
      setStep(1)
      setTimeout(() => setStep(2), 2200)
    }, 8000)
    return () => clearTimeout(t)
  }, [inView, step])

  return (
    <div
      ref={ref}
      className="aspect-[3/4] sm:aspect-[16/9]"
      style={{
        marginTop: 28, borderRadius: 12, overflow: "hidden",
        border: "1px solid var(--line)", position: "relative",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.06)",
      }}
    >
      {inView && (
        <>
          <BlurredBackground l={locale} />

          {/* Modal centered */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 20px", zIndex: 2,
          }}>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <NewProjectModal key="new" onSelect={() => setStep(2)} l={locale} />
              ) : (
                <GenerateModal key="gen" active={true} l={locale} />
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
