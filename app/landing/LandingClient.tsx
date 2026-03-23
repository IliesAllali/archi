"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Play, Zap, MessageSquare, Users, Share2, FileText, History } from "lucide-react"
import { detectLocale, getTranslations } from "@/lib/landing-i18n"
import type { Locale, Translations } from "@/lib/landing-i18n"

/* ──────────────────── Shared animation config ──────────────────── */

const ease = [0.16, 1, 0.3, 1] as const
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease },
  }),
}
const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease },
  }),
}

/* ──────────────────── Section wrapper with scroll reveal ──────── */

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ──────────────────── Logo ──────────────────────────────────────── */

function ArboLogo({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-lg flex items-center justify-center"
      style={{
        width: size + 8,
        height: size + 8,
        background: "var(--accent)",
      }}
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
        <path d="M12 4V12M12 12L6 18M12 12L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ──────────────────── Nav ──────────────────────────────────────── */

function Nav({ t, locale, onLocaleChange }: { t: Translations; locale: Locale; onLocaleChange: (l: Locale) => void }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(var(--nav-rgb, 255,255,255), 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <ArboLogo size={24} />
            <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              arbo
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            <a href="#features" className="text-xs font-medium transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>
              {t.nav.features}
            </a>
            <a href="#pricing" className="text-xs font-medium transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>
              {t.nav.pricing}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => onLocaleChange(locale === "en" ? "fr" : "en")}
            className="px-2 py-1 rounded-md text-2xs font-medium transition-all hover:opacity-80"
            style={{ color: "var(--text-faint)" }}
          >
            {locale === "en" ? "FR" : "EN"}
          </button>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            {t.nav.login}
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 hover:brightness-110 active:scale-95"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {t.nav.cta}
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

/* ──────────────────── Hero ──────────────────────────────────────── */

function Hero({ t }: { t: Translations }) {
  return (
    <div className="relative pt-32 sm:pt-40 pb-8 sm:pb-12 px-4 sm:px-6 overflow-hidden">
      {/* Subtle radial glow behind hero */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, var(--accent-muted) 0%, transparent 70%)",
          opacity: 0.6,
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{
            background: "var(--accent-muted)",
            border: "1px solid var(--accent-strong)",
          }}
        >
          <Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />
          <span className="text-2xs font-medium" style={{ color: "var(--accent)" }}>
            {t.hero.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="visible"
          className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
          style={{ color: "var(--text-primary)" }}
        >
          {t.hero.title}
          <br />
          <span style={{ color: "var(--accent)" }}>{t.hero.titleAccent}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="visible"
          className="text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t.hero.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-[0.97]"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 4px 20px var(--accent-strong)",
            }}
          >
            {t.hero.cta}
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <Play className="w-3.5 h-3.5" />
            {t.hero.ctaSecondary}
          </a>
        </motion.div>
      </div>
    </div>
  )
}

/* ──────────────────── Demo window (placeholder) ────────────────── */

function DemoWindow({ t }: { t: Translations }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.95, 1])

  return (
    <div ref={ref} className="px-4 sm:px-6 pb-16 sm:pb-24">
      <motion.div
        style={{ y, scale }}
        className="max-w-4xl mx-auto rounded-2xl overflow-hidden relative"
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <div
            className="flex-1 mx-12 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--elevated)" }}
          >
            <span className="text-2xs font-mono" style={{ color: "var(--text-faint)" }}>
              arbo.patchou.cloud
            </span>
          </div>
        </div>

        {/* Content placeholder */}
        <div
          className="aspect-[16/9] flex flex-col items-center justify-center gap-4 relative"
          style={{ background: "var(--canvas-bg)" }}
        >
          {/* Animated fake nodes */}
          <div className="relative w-full h-full overflow-hidden">
            <FakeTree />
          </div>

          {/* Overlay with play button for future video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full cursor-pointer"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Play className="w-5 h-5 text-white fill-white" />
              <span className="text-sm font-medium text-white">{t.demo.placeholder}</span>
            </motion.div>
          </div>
        </div>

        {/* Border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: "1px solid var(--line-strong)", boxShadow: "0 24px 80px rgba(0,0,0,0.12)" }}
        />
      </motion.div>
    </div>
  )
}

/* ──────────────────── Fake tree for demo ───────────────────────── */

function FakeTree() {
  const nodes = [
    { x: 50, y: 12, w: 14, label: "Home", accent: true },
    { x: 22, y: 36, w: 12, label: "About" },
    { x: 50, y: 36, w: 12, label: "Services" },
    { x: 78, y: 36, w: 12, label: "Blog" },
    { x: 12, y: 60, w: 11, label: "Team" },
    { x: 32, y: 60, w: 11, label: "Careers" },
    { x: 42, y: 60, w: 12, label: "Web Design" },
    { x: 58, y: 60, w: 11, label: "Branding" },
    { x: 72, y: 60, w: 12, label: "Articles" },
    { x: 86, y: 60, w: 12, label: "Categories" },
    { x: 50, y: 84, w: 11, label: "Contact" },
  ]

  const edges = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5],
    [2, 6], [2, 7],
    [3, 8], [3, 9],
    [0, 10],
  ]

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {/* Edges */}
      {edges.map(([from, to], i) => (
        <motion.line
          key={`e-${i}`}
          x1={`${nodes[from].x}%`}
          y1={`${nodes[from].y + 4}%`}
          x2={`${nodes[to].x}%`}
          y2={`${nodes[to].y}%`}
          stroke="var(--edge-color)"
          strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x={`${n.x - n.w / 2}%`}
            y={`${n.y}%`}
            width={`${n.w}%`}
            height="6%"
            rx="1"
            fill={n.accent ? "var(--accent)" : "var(--surface)"}
            stroke={n.accent ? "var(--accent)" : "var(--line-strong)"}
            strokeWidth="0.3"
          />
          <text
            x={`${n.x}%`}
            y={`${n.y + 3.6}%`}
            textAnchor="middle"
            className="font-sans"
            style={{
              fontSize: "2px",
              fill: n.accent ? "#fff" : "var(--text-secondary)",
              fontWeight: n.accent ? 600 : 400,
            }}
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}

/* ──────────────────── How it works ─────────────────────────────── */

function HowItWorks({ t }: { t: Translations }) {
  return (
    <Section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
          <span
            className="text-2xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {t.howItWorks.label}
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mt-3"
            style={{ color: "var(--text-primary)" }}
          >
            {t.howItWorks.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          {t.howItWorks.steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i + 1}
              className="relative p-6 rounded-2xl group"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
              }}
            >
              {/* Step number */}
              <span
                className="text-4xl sm:text-5xl font-black leading-none"
                style={{ color: "var(--accent-muted)" }}
              >
                {step.number}
              </span>
              <h3
                className="text-base font-semibold mt-3 mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {step.desc}
              </p>

              {/* Screenshot placeholder */}
              <div
                className="mt-5 aspect-[4/3] rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--canvas-bg)",
                  border: "1px solid var(--line-subtle)",
                }}
              >
                <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  Screenshot
                </span>
              </div>

              {/* Connector line between cards (desktop only) */}
              {i < 2 && (
                <div
                  className="hidden sm:block absolute top-1/2 -right-2 w-4 h-px"
                  style={{ background: "var(--line-strong)" }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ──────────────────── Features grid ────────────────────────────── */

const featureIcons = [Sparkles, MessageSquare, Users, Share2, FileText, History]

function Features({ t }: { t: Translations }) {
  return (
    <Section id="features" className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
          <span
            className="text-2xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {t.features.label}
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mt-3"
            style={{ color: "var(--text-primary)" }}
          >
            {t.features.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.features.items.map((item, i) => {
            const Icon = featureIcons[i]
            const isHero = i < 2
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 1}
                className={`group relative p-5 rounded-xl transition-all duration-300 hover:translate-y-[-2px] ${
                  isHero ? "sm:col-span-1 lg:col-span-1" : ""
                }`}
                style={{
                  background: "var(--surface)",
                  border: isHero
                    ? "1px solid var(--accent-strong)"
                    : "1px solid var(--line)",
                  boxShadow: isHero
                    ? "0 0 0 1px var(--accent-muted)"
                    : "none",
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{
                    background: isHero ? "var(--accent-muted)" : "var(--elevated)",
                    border: `1px solid ${isHero ? "var(--accent-strong)" : "var(--line)"}`,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isHero ? "var(--accent)" : "var(--text-secondary)" }}
                  />
                </div>

                {/* Tag */}
                <span
                  className="text-2xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: isHero ? "var(--accent-muted)" : "var(--elevated)",
                    color: isHero ? "var(--accent)" : "var(--text-faint)",
                  }}
                >
                  {item.tag}
                </span>

                <h3
                  className="text-sm font-semibold mt-3 mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

/* ──────────────────── Pricing teaser ───────────────────────────── */

function Pricing({ t }: { t: Translations }) {
  return (
    <Section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div variants={fadeUp} custom={0}>
          <span
            className="text-2xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {t.pricing.label}
          </span>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          custom={1}
          className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {t.pricing.title}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-sm sm:text-base mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          {t.pricing.subtitle}
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="flex flex-col items-center gap-3">
          <Link
            href="/register"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-[0.97]"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 4px 20px var(--accent-strong)",
            }}
          >
            {t.pricing.cta}
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
            {t.pricing.soon}
          </span>
        </motion.div>
      </div>
    </Section>
  )
}

/* ──────────────────── Footer ───────────────────────────────────── */

function Footer({ t }: { t: Translations }) {
  return (
    <footer
      className="py-10 px-4 sm:px-6"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArboLogo size={20} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.footer.built}{" "}
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {t.footer.maker}
            </span>
            {" "}&middot; {t.footer.makerDesc}
          </span>
        </div>
        <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
          &copy; {new Date().getFullYear()} arbo. {t.footer.rights}
        </span>
      </div>
    </footer>
  )
}

/* ──────────────────── Main ─────────────────────────────────────── */

export default function LandingClient() {
  const [locale, setLocale] = useState<Locale>("en")

  useEffect(() => {
    setLocale(detectLocale())
  }, [])

  const t = getTranslations(locale)

  return (
    <div
      className="min-h-screen selection:bg-orange-500/20"
      style={{ background: "var(--canvas-bg)" }}
    >
      <Nav t={t} locale={locale} onLocaleChange={setLocale} />
      <Hero t={t} />
      <DemoWindow t={t} />
      <HowItWorks t={t} />
      <Features t={t} />
      <Pricing t={t} />
      <Footer t={t} />
    </div>
  )
}
