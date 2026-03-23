export type Locale = "en" | "fr"

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en"
  const lang = navigator.language?.toLowerCase() || ""
  return lang.startsWith("fr") ? "fr" : "en"
}

const t = {
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      login: "Sign in",
      cta: "Try free",
    },
    hero: {
      badge: "Free during beta",
      title: "Plan your site structure",
      titleAccent: "with AI",
      subtitle: "Describe your website in plain text. Get a full sitemap in seconds. Edit, collaborate, export.",
      cta: "Start building, it's free",
      ctaSecondary: "See how it works",
    },
    demo: {
      placeholder: "Demo video coming soon",
      alt: "Arbo AI sitemap builder in action",
    },
    howItWorks: {
      label: "How it works",
      title: "From idea to sitemap in 3 steps",
      steps: [
        {
          number: "01",
          title: "Describe",
          desc: "Tell AI what your website is about. A sentence is enough.",
        },
        {
          number: "02",
          title: "Generate",
          desc: "AI creates a complete page tree with hierarchy, types, and descriptions.",
        },
        {
          number: "03",
          title: "Refine",
          desc: "Edit visually, restructure with AI, then share or export to PDF.",
        },
      ],
    },
    features: {
      label: "Features",
      title: "Everything you need to plan websites",
      items: [
        {
          title: "AI Generation",
          desc: "Prompt to sitemap in 30 seconds. Full page tree with descriptions.",
          tag: "Core",
        },
        {
          title: "AI Inline Editing",
          desc: "Select any node, press Ctrl+I. Restructure your sitemap conversationally.",
          tag: "Core",
        },
        {
          title: "Real-time Collaboration",
          desc: "See who's editing what. Live cursors, instant sync, zero conflicts.",
          tag: "Team",
        },
        {
          title: "Share Links",
          desc: "One click to share a live, interactive view. No login required for viewers.",
          tag: "Share",
        },
        {
          title: "PDF Export",
          desc: "Export your sitemap as a clean PDF for client presentations.",
          tag: "Export",
        },
        {
          title: "Version History",
          desc: "Every change is saved. Restore any previous version in one click.",
          tag: "Safety",
        },
      ],
    },
    pricing: {
      label: "Pricing",
      title: "Free. Really.",
      subtitle: "3 projects, 20 AI credits, all features. No credit card.",
      cta: "Get started",
      soon: "Pro plans coming soon",
    },
    footer: {
      built: "Built by",
      maker: "Patch",
      makerDesc: "indie designer, Lille, France",
      rights: "All rights reserved.",
    },
  },
  fr: {
    nav: {
      features: "Fonctions",
      pricing: "Tarifs",
      login: "Connexion",
      cta: "Essayer",
    },
    hero: {
      badge: "Gratuit pendant la beta",
      title: "Planifie l'arborescence de ton site",
      titleAccent: "avec l'IA",
      subtitle: "Dis ce que tu veux construire. L'IA te donne un sitemap complet en secondes. Modifie, collabore, exporte.",
      cta: "Commencer gratuitement",
      ctaSecondary: "Voir comment ca marche",
    },
    demo: {
      placeholder: "Video demo bientot disponible",
      alt: "Arbo AI sitemap builder en action",
    },
    howItWorks: {
      label: "Comment ca marche",
      title: "De l'idee au sitemap en 3 etapes",
      steps: [
        {
          number: "01",
          title: "Decris",
          desc: "Explique ton site a l'IA. Une phrase suffit.",
        },
        {
          number: "02",
          title: "Genere",
          desc: "L'IA cree un arbre complet avec hierarchie, types et descriptions.",
        },
        {
          number: "03",
          title: "Affine",
          desc: "Modifie visuellement, restructure avec l'IA, partage ou exporte en PDF.",
        },
      ],
    },
    features: {
      label: "Fonctions",
      title: "Tout ce qu'il faut pour planifier un site",
      items: [
        {
          title: "Generation IA",
          desc: "Un prompt, un sitemap en 30 secondes. Arbre complet avec descriptions.",
          tag: "Core",
        },
        {
          title: "Edition IA inline",
          desc: "Selectionne un noeud, Ctrl+I. Restructure ton sitemap en conversationnel.",
          tag: "Core",
        },
        {
          title: "Collaboration temps reel",
          desc: "Vois qui edite quoi. Curseurs live, sync instantanee, zero conflit.",
          tag: "Equipe",
        },
        {
          title: "Liens de partage",
          desc: "Un clic pour partager une vue interactive. Pas de login requis.",
          tag: "Partage",
        },
        {
          title: "Export PDF",
          desc: "Exporte ton sitemap en PDF propre pour tes presentations client.",
          tag: "Export",
        },
        {
          title: "Historique de versions",
          desc: "Chaque modif est sauvegardee. Restaure n'importe quelle version en un clic.",
          tag: "Securite",
        },
      ],
    },
    pricing: {
      label: "Tarifs",
      title: "Gratuit. Vraiment.",
      subtitle: "3 projets, 20 credits IA, toutes les fonctions. Pas de carte bancaire.",
      cta: "Commencer",
      soon: "Offres Pro bientot disponibles",
    },
    footer: {
      built: "Fait par",
      maker: "Patch",
      makerDesc: "designer indie, Lille, France",
      rights: "Tous droits reserves.",
    },
  },
}

export type Translations = typeof t.en
export function getTranslations(locale: Locale): Translations {
  return t[locale] as Translations
}
