"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import Link from "next/link"
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion"
import { ArrowRight, Check, ChevronDown, Plus, MessageSquare, Sparkles, Share2, X, Terminal, Plug } from "lucide-react"
import Logo from "@/components/Logo"
import HeroTreeIllustration from "./HeroTreeIllustration"
import GenerateIllustration from "./GenerateIllustration"
import DragIllustration from "./DragIllustration"
import ShareIllustration from "./ShareIllustration"
import WireframeIllustration from "./WireframeIllustration"
import { detectLocale, getTranslations } from "@/lib/landing-i18n"
import type { Locale, Translations } from "@/lib/landing-i18n"

/* ───── Shared ───── */

const ease = [0.16, 1, 0.3, 1] as const

/* ───── Scroll-linked fade + lift ───── */

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ───── Word-by-word title reveal ───── */

function RevealTitle({
  text,
  className,
  style,
  delay = 0,
}: {
  text: string
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  const words = text.split(" ")
  return (
    <motion.span className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.04, ease }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}

/* ───── Parallax wrapper ───── */

function Parallax({
  children,
  offset = 60,
  className = "",
}: {
  children: ReactNode
  offset?: number
  className?: string
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

/* ───── CTA Button with glow hover ───── */

function CtaButton({
  children,
  className = "",
  style,
  href,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  href: string
}) {
  return (
    <Link href={href} className={`group/cta relative overflow-hidden ${className}`} style={style}>
      <span
        className="absolute inset-0 rounded-[inherit] opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)" }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Link>
  )
}

/* ───── Scroll progress bar ───── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        background: "var(--accent)",
      }}
    />
  )
}

/* ───── Nav ───── */

function Nav({
  t,
  locale,
  onLocaleChange,
}: {
  t: Translations
  locale: Locale
  onLocaleChange: (l: Locale) => void
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease }}
      className="fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-200"
      style={{
        background: scrolled ? "rgba(245,245,247,0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(1.8)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--line)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-[1120px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-2 group">
          <Logo size={16} />
          <span
            className="text-sm font-semibold transition-colors duration-200 group-hover:opacity-70"
            style={{ color: "var(--text-primary)" }}
          >
            arbo
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onLocaleChange(locale === "en" ? "fr" : "en")}
            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-70"
            style={{ color: "var(--text-faint)" }}
          >
            {locale === "en" ? "FR" : "EN"}
          </button>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md text-sm transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            {t.nav.login}
          </Link>
          <CtaButton
            href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-[transform,box-shadow] duration-150 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.97]"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {t.nav.cta}
          </CtaButton>
        </div>
      </div>
    </motion.nav>
  )
}

/* ───── Hero ───── */

function Hero({ t }: { t: Translations }) {
  return (
    <div className="pt-28 sm:pt-44 pb-12 sm:pb-16 px-6">
      <div className="max-w-[1120px] mx-auto text-center">
        <h1 className="text-[36px] sm:text-[56px] lg:text-[68px] font-semibold leading-[1.04] tracking-[-0.03em]">
          <RevealTitle
            text={t.hero.title}
            style={{ color: "var(--text-primary)" }}
          />
          <br />
          <RevealTitle
            text={t.hero.titleAccent}
            style={{ color: "var(--accent)" }}
            delay={0.2}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, delay: 0.4, ease }}
          className="text-[15px] sm:text-lg mt-6 max-w-lg mx-auto leading-[1.65]"
          style={{ color: "var(--text-secondary)" }}
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease }}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <CtaButton
            href="/signup"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.97]"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {t.hero.cta}
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </CtaButton>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t.hero.ctaSecondary}
          </span>
        </motion.div>
      </div>
    </div>
  )
}

/* ───── Hero Screenshot ───── */

function HeroScreenshot({ locale = "fr" }: { locale?: Locale }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.92, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.6, 1])

  return (
    <div className="px-6 pb-0" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease }}
        className="max-w-[1120px] mx-auto"
        style={{ scale, opacity }}
      >
        <HeroTreeIllustration locale={locale} />
      </motion.div>
    </div>
  )
}

/* ───── Manifesto ───── */

function Manifesto({ t }: { t: Translations }) {
  return (
    <section className="px-6 pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-[1120px] mx-auto">
        <FadeUp>
          <h2
            className="text-2xl sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.02em] leading-[1.08] max-w-xl"
            style={{ color: "var(--text-primary)" }}
          >
            {t.manifesto.title}
          </h2>
          <p
            className="text-[15px] sm:text-base mt-4 max-w-lg leading-[1.65]"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.manifesto.subtitle}
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 mt-12 sm:mt-16">
          {t.manifesto.points.map((point, i) => (
            <FadeUp key={i} delay={0.08 * i}>
              <div className="group">
                <div
                  className="w-6 h-[2px] mb-4 transition-[width] duration-500 group-hover:w-10"
                  style={{ background: "var(--accent)" }}
                />
                <h3
                  className="text-[13px] font-semibold mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {point.title}
                </h3>
                <p
                  className="text-[13px] leading-[1.6]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {point.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───── Pillar Section ───── */

function PillarIllustration({ placeholder }: { placeholder: string }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.96, 1, 1])

  return (
    <div ref={ref} className="mt-7 sm:mt-8">
      <motion.div
        className="w-full rounded-xl overflow-hidden flex items-center justify-center relative"
        style={{
          border: "1px solid var(--line)",
          background: "var(--surface)",
          aspectRatio: "16/9",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.06)",
          y,
          scale,
        }}
      >
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          {placeholder}
        </p>
      </motion.div>
    </div>
  )
}

function Pillar({
  pillar,
  index,
  locale,
}: {
  pillar: Translations["pillars"][0]
  index: number
  locale: Locale
}) {
  const [expandedSub, setExpandedSub] = useState<number | null>(null)

  return (
    <section className="px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
      <div className="max-w-[1120px] mx-auto">
        {/* Number + label + title + subtitle */}
        <FadeUp>
          <div className="flex items-start gap-4 sm:gap-6">
            <span
              className="text-[11px] font-mono font-medium shrink-0 tabular-nums"
              style={{ color: "var(--accent)", opacity: 0.5, lineHeight: "1.6em", paddingTop: "0.05em" }}
            >
              {pillar.number}
            </span>
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
                style={{ color: "var(--accent)" }}
              >
                {pillar.label}
              </p>
              <h2
                className="text-2xl sm:text-[32px] lg:text-[40px] font-semibold tracking-[-0.02em] leading-[1.1]"
                style={{ color: "var(--text-primary)" }}
              >
                {pillar.title}
              </h2>
              <p
                className="text-[15px] sm:text-base mt-4 max-w-lg leading-[1.65]"
                style={{ color: "var(--text-secondary)" }}
              >
                {pillar.subtitle}
              </p>
            </div>
          </div>
        </FadeUp>

        {/* Illustration with parallax */}
        <FadeUp delay={0.1}>
          {index === 0 ? <GenerateIllustration locale={locale} /> : index === 1 ? <DragIllustration locale={locale} /> : index === 2 ? <ShareIllustration locale={locale} /> : <PillarIllustration placeholder={pillar.placeholder} />}
        </FadeUp>

        {/* Sub-features accordion */}
        <FadeUp delay={0.15}>
          <div
            className="mt-6"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            {pillar.subs.map((sub, i) => (
              <div
                key={sub.id}
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <button
                  onClick={() =>
                    setExpandedSub(expandedSub === i ? null : i)
                  }
                  className="w-full flex items-center gap-3.5 py-3 text-left group"
                >
                  <span
                    className="text-[11px] font-mono shrink-0 w-7 tabular-nums transition-colors duration-200 group-hover:text-[var(--accent)]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {sub.id}
                  </span>
                  <span
                    className="text-[13px] font-medium flex-1 transition-colors duration-200 group-hover:text-[var(--accent)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sub.title}
                  </span>
                  <Plus
                    className="w-3 h-3 shrink-0 transition-transform duration-300"
                    style={{
                      color: "var(--text-faint)",
                      transform:
                        expandedSub === i ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: expandedSub === i ? "auto" : 0,
                    opacity: expandedSub === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden"
                >
                  <p
                    className="text-[13px] leading-[1.6] pb-3.5 pl-[42px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {sub.desc}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

/* ───── How it works ───── */

function HowItWorks({ t }: { t: Translations }) {
  const icons = [MessageSquare, Sparkles, Share2]
  return (
    <section className="px-6 pt-16 sm:pt-20 pb-8">
      <div className="max-w-[1120px] mx-auto">
        <FadeUp>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-8 text-center"
            style={{ color: "var(--accent)" }}
          >
            {t.howItWorks.label}
          </p>
        </FadeUp>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative">
          {/* Connection line (desktop only) */}
          <div
            className="hidden sm:block absolute top-8 left-[20%] right-[20%] h-[1px]"
            style={{ background: "var(--line)" }}
          />
          {t.howItWorks.steps.map((step, i) => {
            const Icon = icons[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center relative"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative z-10"
                  style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: "var(--text-faint)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed max-w-[240px]" style={{ color: "var(--text-muted)" }}>
                  {step.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───── Wireframe pillar ───── */

function WireframePillar({ t, locale }: { t: Translations; locale: Locale }) {
  const [expandedSub, setExpandedSub] = useState<number | null>(null)
  const wf = t.wireframe

  return (
    <section className="px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
      <div className="max-w-[1120px] mx-auto">
        <FadeUp>
          <div className="flex items-start gap-4 sm:gap-6">
            <span
              className="text-[11px] font-mono font-medium shrink-0 tabular-nums"
              style={{ color: "var(--accent)", opacity: 0.5, lineHeight: "1.6em", paddingTop: "0.05em" }}
            >
              {wf.number}
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent)" }}>
                {wf.label}
              </p>
              <h2 className="text-2xl sm:text-[32px] lg:text-[40px] font-semibold tracking-[-0.02em] leading-[1.1]" style={{ color: "var(--text-primary)" }}>
                {wf.title}
              </h2>
              <p className="text-[15px] sm:text-base mt-4 max-w-lg leading-[1.65]" style={{ color: "var(--text-secondary)" }}>
                {wf.subtitle}
              </p>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <WireframeIllustration />
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="mt-6" style={{ borderTop: "1px solid var(--line)" }}>
            {wf.subs.map((sub, i) => (
              <div key={sub.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  onClick={() => setExpandedSub(expandedSub === i ? null : i)}
                  className="w-full flex items-center gap-3.5 py-3 text-left group"
                >
                  <span className="text-[11px] font-mono shrink-0 w-7 tabular-nums transition-colors duration-200 group-hover:text-[var(--accent)]" style={{ color: "var(--text-faint)" }}>
                    {sub.id}
                  </span>
                  <span className="text-[13px] font-medium flex-1 transition-colors duration-200 group-hover:text-[var(--accent)]" style={{ color: "var(--text-primary)" }}>
                    {sub.title}
                  </span>
                  <Plus className="w-3 h-3 shrink-0 transition-transform duration-300" style={{ color: "var(--text-faint)", transform: expandedSub === i ? "rotate(45deg)" : "rotate(0deg)" }} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: expandedSub === i ? "auto" : 0, opacity: expandedSub === i ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-[13px] leading-[1.6] pb-3.5 pl-[42px]" style={{ color: "var(--text-secondary)" }}>
                    {sub.desc}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

/* ───── Integrations / MCP ───── */

function Integrations({ t }: { t: Translations }) {
  const intg = t.integrations
  return (
    <section className="px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
      <div className="max-w-[1120px] mx-auto">
        <FadeUp>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent)" }}>
            {intg.label}
          </p>
          <h2 className="text-2xl sm:text-[32px] lg:text-[40px] font-semibold tracking-[-0.02em] leading-[1.1] mb-3" style={{ color: "var(--text-primary)" }}>
            {intg.title}
          </h2>
          <p className="text-[15px] sm:text-base max-w-lg leading-[1.65] mb-10" style={{ color: "var(--text-secondary)" }}>
            {intg.subtitle}
          </p>
        </FadeUp>

        {/* Client cards with real brand icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {intg.clients.map((client, i) => {
            const icons: Record<string, React.ReactNode> = {
              /* Anthropic / Claude — official spark mark from claude.ai, color #D97757 */
              "Claude Desktop": (
                <svg width="20" height="20" viewBox="-5 10 155 140" fill="none">
                  <g transform="translate(-75.96,-223.53)">
                    <path fill="#D97757" d="m 105.01,322.07 29.14,-16.35 0.49,-1.42 -0.49,-0.79 h -1.42 l -4.87,-0.3 -16.65,-0.45 -14.44,-0.6 -13.99,-0.75 -3.52,-0.75 -3.3,-4.35 0.34,-2.17 2.96,-1.99 4.24,0.37 9.37,0.64 14.06,0.97 10.2,0.6 15.11,1.57 h 2.4 l 0.34,-0.97 -0.82,-0.6 -0.64,-0.6 -14.55,-9.86 -15.75,-10.42 -8.25,-6 -4.46,-3.04 -2.25,-2.85 -0.97,-6.22 4.05,-4.46 5.44,0.37 1.39,0.37 5.51,4.24 11.77,9.11 15.37,11.32 2.25,1.87 0.9,-0.64 0.11,-0.45 -1.01,-1.69 -8.36,-15.11 -8.92,-15.37 -3.97,-6.37 -1.05,-3.82 c -0.37,-1.57 -0.64,-2.89 -0.64,-4.5 l 4.61,-6.26 2.55,-0.82 6.15,0.82 2.59,2.25 3.82,8.74 6.19,13.76 9.6,18.71 2.81,5.55 1.5,5.14 0.56,1.57 h 0.97 v -0.9 l 0.79,-10.54 1.46,-12.94 1.42,-16.65 0.49,-4.69 2.32,-5.62 4.61,-3.04 3.6,1.72 2.96,4.24 -0.41,2.74 -1.76,11.44 -3.45,17.92 -2.25,12 h 1.31 l 1.5,-1.5 6.07,-8.06 10.2,-12.75 4.5,-5.06 5.25,-5.59 3.37,-2.66 h 6.37 l 4.69,6.97 -2.1,7.2 -6.56,8.32 -5.44,7.05 -7.8,10.5 -4.87,8.4 0.45,0.67 1.16,-0.11 17.62,-3.75 9.52,-1.72 11.36,-1.95 5.14,2.4 0.56,2.44 -2.02,4.99 -12.15,3 -14.25,2.85 -21.22,5.02 -0.26,0.19 0.3,0.37 9.56,0.9 4.09,0.22 h 10.01 l 18.64,1.39 4.87,3.22 2.92,3.94 -0.49,3 -7.5,3.82 -10.12,-2.4 -23.62,-5.62 -8.1,-2.02 h -1.12 v 0.67 l 6.75,6.6 12.37,11.17 15.49,14.4 0.79,3.56 -1.99,2.81 -2.1,-0.3 -13.61,-10.24 -5.25,-4.61 -11.89,-10.01 h -0.79 v 1.05 l 2.74,4.01 14.47,21.75 0.75,6.67 -1.05,2.17 -3.75,1.31 -4.12,-0.75 -8.47,-11.89 -8.74,-13.39 -7.05,-12 -0.86,0.49 -4.16,44.81 -1.95,2.29 -4.5,1.72 -3.75,-2.85 -1.99,-4.61 1.99,-9.11 2.4,-11.89 1.95,-9.45 1.76,-11.74 1.05,-3.9 -0.07,-0.26 -0.86,0.11 -8.85,12.15 -13.46,18.19 -10.65,11.4 -2.55,1.01 -4.42,-2.29 0.41,-4.09 2.47,-3.64 14.74,-18.75 8.89,-11.62 5.74,-6.71 -0.04,-0.97 h -0.34 l -39.15,25.42 -6.97,0.9 -3,-2.81 0.37,-4.61 1.42,-1.5 11.77,-8.1 -0.04,0.04 z"/>
                  </g>
                </svg>
              ),
              "Claude Code": (
                <svg width="20" height="20" viewBox="-5 10 155 140" fill="none">
                  <g transform="translate(-75.96,-223.53)">
                    <path fill="#D97757" d="m 105.01,322.07 29.14,-16.35 0.49,-1.42 -0.49,-0.79 h -1.42 l -4.87,-0.3 -16.65,-0.45 -14.44,-0.6 -13.99,-0.75 -3.52,-0.75 -3.3,-4.35 0.34,-2.17 2.96,-1.99 4.24,0.37 9.37,0.64 14.06,0.97 10.2,0.6 15.11,1.57 h 2.4 l 0.34,-0.97 -0.82,-0.6 -0.64,-0.6 -14.55,-9.86 -15.75,-10.42 -8.25,-6 -4.46,-3.04 -2.25,-2.85 -0.97,-6.22 4.05,-4.46 5.44,0.37 1.39,0.37 5.51,4.24 11.77,9.11 15.37,11.32 2.25,1.87 0.9,-0.64 0.11,-0.45 -1.01,-1.69 -8.36,-15.11 -8.92,-15.37 -3.97,-6.37 -1.05,-3.82 c -0.37,-1.57 -0.64,-2.89 -0.64,-4.5 l 4.61,-6.26 2.55,-0.82 6.15,0.82 2.59,2.25 3.82,8.74 6.19,13.76 9.6,18.71 2.81,5.55 1.5,5.14 0.56,1.57 h 0.97 v -0.9 l 0.79,-10.54 1.46,-12.94 1.42,-16.65 0.49,-4.69 2.32,-5.62 4.61,-3.04 3.6,1.72 2.96,4.24 -0.41,2.74 -1.76,11.44 -3.45,17.92 -2.25,12 h 1.31 l 1.5,-1.5 6.07,-8.06 10.2,-12.75 4.5,-5.06 5.25,-5.59 3.37,-2.66 h 6.37 l 4.69,6.97 -2.1,7.2 -6.56,8.32 -5.44,7.05 -7.8,10.5 -4.87,8.4 0.45,0.67 1.16,-0.11 17.62,-3.75 9.52,-1.72 11.36,-1.95 5.14,2.4 0.56,2.44 -2.02,4.99 -12.15,3 -14.25,2.85 -21.22,5.02 -0.26,0.19 0.3,0.37 9.56,0.9 4.09,0.22 h 10.01 l 18.64,1.39 4.87,3.22 2.92,3.94 -0.49,3 -7.5,3.82 -10.12,-2.4 -23.62,-5.62 -8.1,-2.02 h -1.12 v 0.67 l 6.75,6.6 12.37,11.17 15.49,14.4 0.79,3.56 -1.99,2.81 -2.1,-0.3 -13.61,-10.24 -5.25,-4.61 -11.89,-10.01 h -0.79 v 1.05 l 2.74,4.01 14.47,21.75 0.75,6.67 -1.05,2.17 -3.75,1.31 -4.12,-0.75 -8.47,-11.89 -8.74,-13.39 -7.05,-12 -0.86,0.49 -4.16,44.81 -1.95,2.29 -4.5,1.72 -3.75,-2.85 -1.99,-4.61 1.99,-9.11 2.4,-11.89 1.95,-9.45 1.76,-11.74 1.05,-3.9 -0.07,-0.26 -0.86,0.11 -8.85,12.15 -13.46,18.19 -10.65,11.4 -2.55,1.01 -4.42,-2.29 0.41,-4.09 2.47,-3.64 14.74,-18.75 8.89,-11.62 5.74,-6.71 -0.04,-0.97 h -0.34 l -39.15,25.42 -6.97,0.9 -3,-2.81 0.37,-4.61 1.42,-1.5 11.77,-8.1 -0.04,0.04 z"/>
                  </g>
                </svg>
              ),
              /* Cursor — official cube mark from cursor.com/brand */
              "Cursor": (
                <svg width="20" height="20" viewBox="396 392 176 196" fill="none">
                  <path fill="var(--text-primary)" d="M563.463 439.971L487.344 396.057C484.899 394.646 481.883 394.646 479.439 396.057L403.323 439.971C401.269 441.156 400 443.349 400 445.723V534.276C400 536.647 401.269 538.843 403.323 540.029L479.443 583.943C481.887 585.353 484.903 585.353 487.347 583.943L563.466 540.029C565.521 538.843 566.79 536.651 566.79 534.276V445.723C566.79 443.352 565.521 441.156 563.466 439.971H563.463ZM558.681 449.273L485.199 576.451C484.703 577.308 483.391 576.958 483.391 575.966V492.691C483.391 491.027 482.501 489.488 481.058 488.652L408.887 447.016C408.03 446.52 408.38 445.209 409.373 445.209H556.337C558.424 445.209 559.728 447.47 558.685 449.276H558.681V449.273Z"/>
                </svg>
              ),
              /* OpenAI — official glyph */
              "ChatGPT": (
                <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813ZM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496ZM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103L16.5 34.2a7.505 7.505 0 0 1-10.108-3.194Zm-2.32-17.032a7.47 7.47 0 0 1 3.91-3.286c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L7.044 23.2a7.504 7.504 0 0 1-2.972-9.226Zm27.658 6.437-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l7.844 4.528a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.443-1.01Zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l7.943-4.586a7.498 7.498 0 0 1 11.24 7.703Zm-21.063 6.929-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225Zm1.829-3.943 4.33-2.501 4.332 2.497v4.996l-4.331 2.5-4.331-2.5V19.354Z" fill="#10A37F"/>
                </svg>
              ),
            }
            return (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl p-5 text-center"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--canvas-bg)" }}>
                  {icons[client.name] || <Plug className="w-4 h-4" style={{ color: "var(--accent)" }} />}
                </div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{client.name}</p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{client.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Code snippet */}
        <FadeUp delay={0.15}>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)", background: "var(--elevated)" }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>terminal</span>
            </div>
            <div className="px-4 py-4 overflow-x-auto">
              <code className="text-xs font-mono whitespace-nowrap" style={{ color: "var(--accent)" }}>
                $ {intg.snippet}
              </code>
            </div>
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "var(--text-faint)" }}>
            {intg.note}
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

/* ───── Social proof ───── */

function SocialProof({ t }: { t: Translations }) {
  return (
    <section className="px-6 pt-6 pb-10 sm:pt-8 sm:pb-14">
      <div className="max-w-[1120px] mx-auto text-center">
        <FadeUp>
          <div className="w-8 h-[1px] mx-auto mb-6" style={{ background: "var(--line)" }} />
          <p className="text-[13px]" style={{ color: "var(--text-faint)" }}>
            {t.social.line}
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

/* ───── Pricing ───── */

function PricingCard({
  tier,
  recommended = false,
  delay = 0,
  ctaFree,
  ctaBuy,
  onceLabel,
}: {
  tier: { name: string; price: string; desc: string; features: string[] }
  recommended?: boolean
  delay?: number
  ctaFree: string
  ctaBuy: string
  onceLabel: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease }}
      className="relative rounded-xl p-6 flex flex-col"
      style={{
        background: "var(--surface)",
        border: recommended ? "1.5px solid var(--accent)" : "1px solid var(--line)",
        boxShadow: recommended ? "0 0 0 1px var(--accent), 0 8px 32px rgba(247,107,21,0.10)" : undefined,
      }}
    >
      {recommended && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {"\u2605"}
        </div>
      )}
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {tier.name}
      </p>
      <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>
        {tier.desc}
      </p>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {tier.price}&euro;
        </span>
        {tier.price !== "0" && (
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {onceLabel}
          </span>
        )}
      </div>
      <ul className="space-y-2 flex-1 mb-6">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <CtaButton
        href="/signup"
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-[transform,box-shadow] duration-200 active:scale-[0.97] ${
          recommended
            ? "hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5"
            : "hover:bg-[var(--surface-hover)]"
        }`}
        style={{
          background: recommended ? "var(--accent)" : "transparent",
          color: recommended ? "#fff" : "var(--text-primary)",
          border: recommended ? "none" : "1px solid var(--line)",
        }}
      >
        {tier.price === "0" ? ctaFree : ctaBuy}
        <ArrowRight className="w-3.5 h-3.5" />
      </CtaButton>
    </motion.div>
  )
}

function Pricing({ t }: { t: Translations }) {
  const tiers = [t.pricing.free, t.pricing.solo, t.pricing.studio, t.pricing.agency]

  return (
    <section id="pricing" className="px-6 pt-20 sm:pt-28 pb-14 sm:pb-20">
      <div className="max-w-[1120px] mx-auto">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: "var(--accent)" }}
            >
              {t.pricing.label}
            </p>
            <h2
              className="text-2xl sm:text-[32px] lg:text-[40px] font-semibold tracking-[-0.02em] leading-[1.1] mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {t.pricing.title}
            </h2>
            <p
              className="text-[15px] sm:text-base leading-[1.65]"
              style={{ color: "var(--text-secondary)" }}
            >
              {t.pricing.subtitle}
            </p>
          </div>
        </FadeUp>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier, i) => (
            <PricingCard
              key={tier.name}
              tier={tier}
              recommended={i === 1}
              delay={i * 0.06}
              ctaFree={t.pricing.cta}
              ctaBuy={t.pricing.ctaBuy}
              onceLabel={t.pricing.once}
            />
          ))}
        </div>

        {/* Perks — full width below */}
        <FadeUp delay={0.2}>
          <div
            className="mt-10 sm:mt-14 pt-8 sm:pt-10 grid grid-cols-2 sm:grid-cols-3 gap-6"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            {t.pricing.perks.map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05, ease }}
                className="flex items-start gap-2.5"
              >
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                <span
                  className="text-xs sm:text-sm leading-snug"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {perk}
                </span>
              </motion.div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

/* ───── FAQ ───── */

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05, ease }}
      className="group"
      style={{ borderBottom: "1px solid var(--line)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 sm:py-5 text-left"
      >
        <span
          className="text-sm sm:text-[15px] font-medium pr-6 transition-colors duration-200 group-hover:text-[var(--accent)]"
          style={{ color: open ? "var(--accent)" : "var(--text-primary)" }}
        >
          {q}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-[background-color,border-color] duration-300"
          style={{
            background: open ? "var(--accent-muted)" : "var(--surface)",
            border: `1px solid ${open ? "var(--accent-strong)" : "var(--line)"}`,
          }}
        >
          <Plus
            className="w-3.5 h-3.5 transition-transform duration-300"
            style={{
              color: open ? "var(--accent)" : "var(--text-faint)",
              transform: open ? "rotate(45deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease }}
        className="overflow-hidden"
      >
        <p
          className="text-[13px] sm:text-sm leading-[1.7] pb-5 pr-12"
          style={{ color: "var(--text-secondary)" }}
        >
          {a}
        </p>
      </motion.div>
    </motion.div>
  )
}

function Faq({ t }: { t: Translations }) {
  return (
    <section className="px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <div className="max-w-2xl mx-auto">
        <FadeUp>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--accent)" }}
          >
            FAQ
          </p>
          <h2
            className="text-2xl sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.1] mb-10 sm:mb-12"
            style={{ color: "var(--text-primary)" }}
          >
            {t.faq.title}
          </h2>
        </FadeUp>
        <div style={{ borderTop: "1px solid var(--line)" }}>
          {t.faq.items.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───── Final CTA ───── */

function FinalCta({ t }: { t: Translations }) {
  return (
    <section className="relative px-6 pt-24 sm:pt-36 pb-24 sm:pb-40 overflow-hidden">
      {/* Orange gradient blob from bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 100%, #F76B15 0%, #F76B1560 25%, transparent 65%)",
        }}
      />

      {/* Glass + grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(80px)",
          WebkitBackdropFilter: "blur(80px)",
          background: "rgba(255,255,255,0.55)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-[580px] mx-auto text-center relative z-10">
        <FadeUp>
          <h2
            className="text-[28px] sm:text-[40px] lg:text-[48px] font-semibold tracking-[-0.03em] leading-[1.06] mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            {t.finalCta.title}
          </h2>
          <p
            className="text-[15px] sm:text-lg leading-[1.65] mb-10 max-w-sm mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.finalCta.ctaSecondary}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CtaButton
              href="/signup"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[15px] font-medium transition-[transform,box-shadow] duration-200 hover:shadow-2xl hover:shadow-orange-500/25 active:scale-[0.97]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {t.finalCta.cta}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </CtaButton>
          </div>
        </FadeUp>
      </div>

      {/* Footer inside CTA section */}
      <footer className="relative z-10 mt-20 sm:mt-28 px-0">
        <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size={14} />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t.footer.built}{" "}
              <a
                href="https://www.linkedin.com/in/ilies-allali"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-[var(--accent)]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.footer.maker}
              </a>
              {" "}&middot; {t.footer.makerDesc}
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            &copy; {new Date().getFullYear()} arbo
          </span>
        </div>
      </footer>
    </section>
  )
}

/* ───── Noise overlay ───── */

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.025,
        mixBlendMode: "multiply",
      }}
    />
  )
}

/* ───── Page ───── */

export default function LandingClient() {
  const [locale, setLocale] = useState<Locale>("en")

  useEffect(() => {
    setLocale(detectLocale())
  }, [])

  const t = getTranslations(locale)

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "var(--canvas-bg)" }}
    >
      <GrainOverlay />
      <ScrollProgress />
      <Nav t={t} locale={locale} onLocaleChange={setLocale} />
      <Hero t={t} />
      <HeroScreenshot locale={locale} />

      <HowItWorks t={t} />
      <Manifesto t={t} />

      {t.pillars.map((pillar, i) => (
        <Pillar key={i} pillar={pillar} index={i} locale={locale} />
      ))}

      <WireframePillar t={t} locale={locale} />
      <Integrations t={t} />
      <SocialProof t={t} />
      <Pricing t={t} />
      <Faq t={t} />
      <FinalCta t={t} />
    </div>
  )
}
