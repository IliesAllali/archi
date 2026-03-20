"use client";

import Link from "next/link";
import {
  GitBranch,
  Bot,
  Users,
  Share2,
  Zap,
  FileText,
  ArrowRight,
  CheckCircle,
  Monitor,
  History,
  Layout,
} from "lucide-react";

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#5E6AD2" />
      <path d="M16 8V16M16 16L10 22M16 16L22 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof GitBranch;
  title: string;
  desc: string;
}) {
  return (
    <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50"
      style={{ background: "white", borderColor: "#e5e7eb" }}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-colors group-hover:bg-indigo-100"
        style={{ background: "#f0f0ff" }}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#5E6AD2" }} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-1.5" style={{ color: "#1a1a2e" }}>
        {title}
      </h3>
      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#6b7280" }}>
        {desc}
      </p>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
        style={{ background: "#5E6AD2" }}>
        {num}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-0.5" style={{ color: "#1a1a2e" }}>{title}</h4>
        <p className="text-sm" style={{ color: "#6b7280" }}>{desc}</p>
      </div>
    </div>
  );
}

export default function LandingClient() {
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base sm:text-lg font-bold" style={{ color: "#1a1a2e" }}>arbo</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors hover:bg-gray-100" style={{ color: "#6b7280" }}>
            Connexion
          </Link>
          <Link href="/signup" className="text-xs sm:text-sm font-medium px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-white transition-all hover:brightness-110 active:scale-95" style={{ background: "#5E6AD2" }}>
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-2xs sm:text-xs font-medium mb-4 sm:mb-6"
          style={{ background: "#f0f0ff", color: "#5E6AD2" }}>
          <Zap className="w-3 h-3" />
          Gratuit, open-source, IA-ready
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 sm:mb-5" style={{ color: "#1a1a2e" }}>
          L&apos;outil d&apos;arborescence
          <br />
          <span style={{ color: "#5E6AD2" }}>que vos projets attendent</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed" style={{ color: "#6b7280" }}>
          Construisez vos sitemaps visuellement. Collaborez en temps réel. Connectez Claude, ChatGPT ou Cursor pour générer vos arborescences par IA.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
          <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white font-medium text-sm sm:text-base transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-indigo-200" style={{ background: "#5E6AD2" }}>
            Créer un projet
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/api/v1/docs" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-colors hover:bg-gray-100 border" style={{ color: "#1a1a2e", borderColor: "#e5e7eb" }}>
            <FileText className="w-4 h-4" />
            Documentation API
          </Link>
        </div>

        {/* Visual placeholder */}
        <div className="mt-8 sm:mt-12 rounded-xl sm:rounded-2xl border overflow-hidden shadow-2xl shadow-gray-200/50"
          style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5" style={{ borderBottom: "1px solid #2a2a3e" }}>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ background: "#EF4444" }} />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ background: "#F59E0B" }} />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ background: "#22C55E" }} />
            <span className="ml-2 sm:ml-3 text-2xs sm:text-xs" style={{ color: "#6b7280" }}>arbo.patchou.cloud</span>
          </div>
          <div className="px-4 sm:px-8 py-8 sm:py-12 flex items-center justify-center min-h-[180px] sm:min-h-[300px]">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              {/* Tree visualization */}
              <div className="w-20 sm:w-28 h-8 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium text-white" style={{ background: "#5E6AD2" }}>
                Accueil
              </div>
              <div className="w-px h-3 sm:h-4" style={{ background: "#4a4a6e" }} />
              <div className="flex items-start gap-3 sm:gap-6">
                {["Services", "Portfolio", "Contact"].map((label, i) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <div className="w-16 sm:w-24 h-7 sm:h-9 rounded-lg flex items-center justify-center text-2xs sm:text-xs font-medium" style={{ background: "#2a2a4e", color: "#a0a0c0" }}>
                      {label}
                    </div>
                    {i === 0 && (
                      <>
                        <div className="w-px h-2 sm:h-3" style={{ background: "#4a4a6e" }} />
                        <div className="flex gap-1.5 sm:gap-3">
                          {["Web", "Branding"].map(sub => (
                            <div key={sub} className="w-12 sm:w-16 h-6 sm:h-7 rounded flex items-center justify-center text-[9px] sm:text-[10px]" style={{ background: "#1e1e3e", color: "#6b6b9e" }}>
                              {sub}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center" style={{ borderTop: "1px solid #e5e7eb" }}>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: "#1a1a2e" }}>
          Les sitemaps, c&apos;est vite le chaos
        </h2>
        <p className="text-sm sm:text-base max-w-2xl mx-auto mb-8 sm:mb-10" style={{ color: "#6b7280" }}>
          Fichiers Figma illisibles, tableurs sans fin, arborescences perdues entre 3 outils. Arbo centralise tout dans un éditeur visuel pensé pour les vrais projets.
        </p>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FeatureCard icon={Layout} title="Éditeur canvas"
            desc="Drag-and-drop, édition inline, zonings par blocs. Tout est visuel, tout est rapide." />
          <FeatureCard icon={Bot} title="API IA intégrée"
            desc="MCP pour Claude, REST pour les scripts, GPT Actions pour ChatGPT. Générez un sitemap complet en une commande." />
          <FeatureCard icon={Users} title="Collaboration live"
            desc="Présence en temps réel, sync cross-clients. Voyez qui édite quoi, sans conflit." />
          <FeatureCard icon={Share2} title="Partage en un clic"
            desc="Liens guest avec ou sans mot de passe. Invitez des clients en lecture seule, sans inscription." />
          <FeatureCard icon={History} title="Version history"
            desc="10 snapshots automatiques. Restaurez n'importe quel état en 2 clics." />
          <FeatureCard icon={Monitor} title="Export PDF"
            desc="Exportez votre arborescence complète en PDF haute qualité pour vos livrables clients." />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16" style={{ borderTop: "1px solid #e5e7eb" }}>
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center" style={{ color: "#1a1a2e" }}>
          3 étapes, 2 minutes
        </h2>
        <div className="space-y-6">
          <Step num={1} title="Créez un projet" desc="Nom du site, client, c'est parti. Zéro configuration." />
          <Step num={2} title="Construisez votre arbo" desc="Ajoutez des pages, glissez-déposez, structurez. Ou laissez votre IA générer le sitemap complet." />
          <Step num={3} title="Partagez et itérez" desc="Envoyez un lien guest au client. Modifiez en temps réel. Exportez en PDF." />
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center" style={{ borderTop: "1px solid #e5e7eb" }}>
        <p className="text-xs sm:text-sm font-medium mb-2" style={{ color: "#5E6AD2" }}>
          Déjà utilisé sur
        </p>
        <p className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: "#1a1a2e" }}>
          Des projets réels, en production
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {["SERCE", "Métiers Électricité"].map(name => (
            <div key={name} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ background: "white", border: "1px solid #e5e7eb" }}>
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "#22C55E" }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: "#1a1a2e" }}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center" style={{ borderTop: "1px solid #e5e7eb" }}>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: "#1a1a2e" }}>Gratuit, sans limite</h2>
        <p className="text-sm sm:text-base mb-6 sm:mb-8" style={{ color: "#6b7280" }}>
          Projets illimités. Pages illimitées. Export PDF. API IA.
          <br />
          La collaboration avancée arrive bientôt en premium.
        </p>
        <Link href="/signup" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-white font-medium transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-indigo-200 text-sm sm:text-base" style={{ background: "#5E6AD2" }}>
          Commencer maintenant
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8" style={{ borderTop: "1px solid #e5e7eb" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>arbo</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs" style={{ color: "#6b7280" }}>
            <Link href="/api/v1/docs" className="hover:underline">API Docs</Link>
            <Link href="/api/v1/openapi.json" className="hover:underline">OpenAPI</Link>
            <span>fait par Patch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
