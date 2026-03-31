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
import { ArrowRight, Check, ChevronDown, Plus } from "lucide-react"
import Logo from "@/components/Logo"
import HeroTreeIllustration from "./HeroTreeIllustration"
import GenerateIllustration from "./GenerateIllustration"
import DragIllustration from "./DragIllustration"
import ShareIllustration from "./ShareIllustration"
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
      transition={{ duration: 0.7, delay, ease }}
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.97]"
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
          transition={{ duration: 0.7, delay: 0.5, ease }}
          className="text-[15px] sm:text-lg mt-6 max-w-lg mx-auto leading-[1.65]"
          style={{ color: "var(--text-secondary)" }}
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease }}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <CtaButton
            href="/signup"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.97]"
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

function HeroScreenshot() {
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
        transition={{ duration: 0.8, delay: 0.35, ease }}
        className="max-w-[1120px] mx-auto"
        style={{ scale, opacity }}
      >
        <HeroTreeIllustration />
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
                  className="w-6 h-[2px] mb-4 transition-all duration-500 group-hover:w-10"
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
}: {
  pillar: Translations["pillars"][0]
  index: number
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
          {index === 0 ? <GenerateIllustration /> : index === 1 ? <DragIllustration /> : index === 2 ? <ShareIllustration /> : <PillarIllustration placeholder={pillar.placeholder} />}
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
                    className="w-3 h-3 shrink-0 transition-all duration-300"
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

function Pricing({ t }: { t: Translations }) {
  return (
    <section id="pricing" className="px-6 pt-20 sm:pt-28 pb-14 sm:pb-20">
      <div className="max-w-[1120px] mx-auto">
        <FadeUp>
          <div className="max-w-xl">
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
              className="text-[15px] sm:text-base leading-[1.65] mb-10"
              style={{ color: "var(--text-secondary)" }}
            >
              {t.pricing.subtitle}
            </p>

            <CtaButton
              href="/signup"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.97]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {t.pricing.cta}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </CtaButton>
            <p
              className="text-[11px] mt-3"
              style={{ color: "var(--text-faint)" }}
            >
              {t.pricing.soon}
            </p>
          </div>
        </FadeUp>

        {/* Perks — full width below */}
        <FadeUp delay={0.1}>
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
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: open ? "var(--accent-muted)" : "var(--surface)",
            border: `1px solid ${open ? "var(--accent-strong)" : "var(--line)"}`,
          }}
        >
          <Plus
            className="w-3.5 h-3.5 transition-all duration-300"
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
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[15px] font-medium transition-all duration-200 hover:shadow-2xl hover:shadow-orange-500/25 active:scale-[0.97]"
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
      <HeroScreenshot />

      <Manifesto t={t} />

      {t.pillars.map((pillar, i) => (
        <Pillar key={i} pillar={pillar} index={i} />
      ))}

      <SocialProof t={t} />
      <Pricing t={t} />
      <Faq t={t} />
      <FinalCta t={t} />
    </div>
  )
}
