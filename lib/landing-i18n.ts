export type Locale = "en" | "fr"

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en"
  const lang = navigator.language?.toLowerCase() || ""
  return lang.startsWith("fr") ? "fr" : "en"
}

const t = {
  en: {
    nav: {
      login: "Sign in",
      cta: "Try free",
    },
    hero: {
      title: "From brief to sitemap",
      titleAccent: "in 30 seconds",
      subtitle: "Describe your website. AI builds the full page tree. Edit visually, share with clients, export to PDF.",
      cta: "Start building for free",
      ctaSecondary: "No credit card required",
    },
    manifesto: {
      title: "Stop dragging boxes. Start describing.",
      subtitle: "Arbo generates your sitemap from a prompt, lets you edit it with AI or by hand, and gives you a shareable link and PDF export. That's it.",
      points: [
        {
          title: "AI generation",
          desc: "Describe your project in one sentence. Get a full page tree with types, hierarchy, and descriptions.",
        },
        {
          title: "Visual editor",
          desc: "Drag pages, rename nodes, restructure sections. Real-time collab keeps your team on the same page.",
        },
        {
          title: "Share and export",
          desc: "Send a live link to your client or export a clean PDF. No account needed on their end.",
        },
      ],
    },
    pillars: [
      {
        number: "1.0",
        label: "Generate",
        title: "Describe your site. Get the full structure.",
        subtitle: "Type a sentence. AI returns a complete page tree with hierarchy, types, and descriptions. Custom to your brief, ready in under 30 seconds.",
        placeholder: "AI generating a full sitemap from a prompt",
        link: "How generation works",
        subs: [
          { id: "1.1", title: "Prompt to sitemap", desc: "One sentence in, full page tree out. AI understands context, page types, and hierarchy." },
          { id: "1.2", title: "Smart structure", desc: "Pages are organized logically with types, descriptions, and parent-child relationships." },
          { id: "1.3", title: "Bring your own key", desc: "Use included AI credits or plug your own API key. OpenAI, Anthropic, or Google." },
        ],
      },
      {
        number: "2.0",
        label: "Edit",
        title: "Refine with AI or by hand.",
        subtitle: "Select any node and tell AI what to change. Or just drag, rename, restructure. Real-time collaboration keeps your whole team in sync.",
        placeholder: "Canvas with inline AI editing and live collaboration",
        link: "How editing works",
        subs: [
          { id: "2.1", title: "AI inline editing", desc: "\"Split this into 3 sub-pages\" or \"Add a blog section.\" AI restructures conversationally." },
          { id: "2.2", title: "Real-time collaboration", desc: "Invite your team. See who's editing what. Live presence, instant sync, zero conflicts." },
          { id: "2.3", title: "Version history", desc: "Every change is saved. Made a mistake? Restore any previous version in one click." },
        ],
      },
      {
        number: "3.0",
        label: "Share",
        title: "Present to clients in one click.",
        subtitle: "Generate a live share link your client can explore without an account. Need a deliverable? Export a clean, presentation-ready PDF.",
        placeholder: "Share modal, PDF export, and client view",
        link: "How sharing works",
        subs: [
          { id: "3.1", title: "Share links", desc: "One click to share an interactive view. Your client sees the sitemap live, no login needed." },
          { id: "3.2", title: "PDF export", desc: "Export a clean, presentation-ready PDF. Perfect for client decks and stakeholder reviews." },
          { id: "3.3", title: "Comments", desc: "Collect feedback directly on the sitemap. No more back-and-forth emails." },
        ],
      },
    ],
    social: {
      line: "Trusted by freelancers, agencies, and product teams to plan their next website.",
    },
    pricing: {
      label: "Pricing",
      title: "Free to start. Seriously.",
      subtitle: "3 projects, 20 AI credits, all features. No credit card, no trial timer, no gotcha.",
      cta: "Get started for free",
      soon: "Pro plans coming soon",
      perks: [
        "3 projects included",
        "20 AI generations",
        "PDF export",
        "Share links",
        "Collaboration",
        "Version history",
      ],
    },
    faq: {
      title: "Frequently asked",
      items: [
        {
          q: "Is it really free?",
          a: "Yes. During beta, you get 3 projects and 20 AI credits at no cost. All features are included. We'll introduce Pro plans later, but your free tier will always exist.",
        },
        {
          q: "What happens when I run out of AI credits?",
          a: "You can plug your own API key (OpenAI, Anthropic, or Google) and keep using AI with no limits. BYOK is free forever.",
        },
        {
          q: "Can my client see the sitemap without creating an account?",
          a: "Yes. Share links are public and interactive. Your client can view and navigate the sitemap without signing up.",
        },
        {
          q: "How is this different from Octopus.do or FlowMapp?",
          a: "AI. Other tools make you drag boxes manually. Arbo generates your entire sitemap from a sentence, and lets you edit it with natural language. It's faster by an order of magnitude.",
        },
      ],
    },
    finalCta: {
      title: "Your next sitemap starts with a sentence.",
      cta: "Get started",
      ctaSecondary: "No credit card required",
    },
    footer: {
      built: "Built by",
      maker: "Ilies Allali",
      makerDesc: "indie designer, Lille, France",
    },
  },
  fr: {
    nav: {
      login: "Connexion",
      cta: "Essayer",
    },
    hero: {
      title: "Du brief au sitemap",
      titleAccent: "en 30 secondes",
      subtitle: "Décris ton site web. L'IA construit l'arborescence complète. Modifie visuellement, partage avec tes clients, exporte en PDF.",
      cta: "Commencer gratuitement",
      ctaSecondary: "Pas de carte bancaire",
    },
    manifesto: {
      title: "Arrête de glisser des boîtes. Commence à décrire.",
      subtitle: "Arbo génère ton sitemap depuis un prompt, te laisse l'éditer avec l'IA ou à la main, et te donne un lien partageable et un export PDF. C'est tout.",
      points: [
        {
          title: "Génération IA",
          desc: "Décris ton projet en une phrase. Obtiens un arbre de pages complet avec types, hiérarchie et descriptions.",
        },
        {
          title: "Éditeur visuel",
          desc: "Glisse des pages, renomme des nœuds, restructure des sections. La collab temps réel garde ton équipe alignée.",
        },
        {
          title: "Partage et export",
          desc: "Envoie un lien live à ton client ou exporte un PDF propre. Pas de compte nécessaire de son côté.",
        },
      ],
    },
    pillars: [
      {
        number: "1.0",
        label: "Générer",
        title: "Décris ton site. Obtiens la structure complète.",
        subtitle: "Tape une phrase. L'IA retourne un arbre de pages complet avec hiérarchie, types et descriptions. Sur-mesure pour ton brief, prêt en moins de 30 secondes.",
        placeholder: "L'IA génère un sitemap complet depuis un prompt",
        link: "Comment la génération fonctionne",
        subs: [
          { id: "1.1", title: "Du prompt au sitemap", desc: "Une phrase en entrée, un arbre complet en sortie. L'IA comprend le contexte, les types de pages et la hiérarchie." },
          { id: "1.2", title: "Structure intelligente", desc: "Les pages sont organisées logiquement avec types, descriptions et relations parent-enfant." },
          { id: "1.3", title: "Apporte ta propre clé", desc: "Utilise les crédits IA inclus ou branche ta propre clé API. OpenAI, Anthropic ou Google." },
        ],
      },
      {
        number: "2.0",
        label: "Éditer",
        title: "Affine avec l'IA ou à la main.",
        subtitle: "Sélectionne un nœud et dis à l'IA ce que tu veux. Ou glisse, renomme, restructure. La collaboration temps réel garde ton équipe synchronisée.",
        placeholder: "Canvas avec édition IA inline et collaboration live",
        link: "Comment l'édition fonctionne",
        subs: [
          { id: "2.1", title: "Édition IA inline", desc: "\"Découpe ça en 3 sous-pages\" ou \"Ajoute une section blog.\" L'IA restructure en conversationnel." },
          { id: "2.2", title: "Collaboration temps réel", desc: "Invite ton équipe. Vois qui édite quoi. Présence live, sync instantanée, zéro conflit." },
          { id: "2.3", title: "Historique de versions", desc: "Chaque modif est sauvegardée. Une erreur ? Restaure n'importe quelle version en un clic." },
        ],
      },
      {
        number: "3.0",
        label: "Partager",
        title: "Présente à tes clients en un clic.",
        subtitle: "Génère un lien de partage que ton client peut explorer sans compte. Besoin d'un livrable ? Exporte un PDF propre, prêt à présenter.",
        placeholder: "Modal de partage, export PDF et vue client",
        link: "Comment le partage fonctionne",
        subs: [
          { id: "3.1", title: "Liens de partage", desc: "Un clic pour partager une vue interactive. Ton client voit le sitemap live, pas besoin de compte." },
          { id: "3.2", title: "Export PDF", desc: "Exporte un PDF propre, prêt à présenter. Parfait pour les decks client et les revues de projet." },
          { id: "3.3", title: "Commentaires", desc: "Collecte du feedback directement sur le sitemap. Fini les allers-retours par email." },
        ],
      },
    ],
    social: {
      line: "Utilisé par des freelances, agences et équipes produit pour planifier leur prochain site.",
    },
    pricing: {
      label: "Tarifs",
      title: "Gratuit pour commencer. Vraiment.",
      subtitle: "3 projets, 20 crédits IA, toutes les fonctions. Pas de carte bancaire, pas de compte à rebours, pas de piège.",
      cta: "Commencer gratuitement",
      soon: "Offres Pro bientôt disponibles",
      perks: [
        "3 projets inclus",
        "20 générations IA",
        "Export PDF",
        "Liens de partage",
        "Collaboration",
        "Historique de versions",
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "C'est vraiment gratuit ?",
          a: "Oui. Pendant la bêta, tu as 3 projets et 20 crédits IA sans rien payer. Toutes les fonctions sont incluses. On lancera des offres Pro plus tard, mais le tier gratuit existera toujours.",
        },
        {
          q: "Et quand j'ai plus de crédits IA ?",
          a: "Tu peux brancher ta propre clé API (OpenAI, Anthropic ou Google) et continuer à utiliser l'IA sans limite. Le BYOK est gratuit pour toujours.",
        },
        {
          q: "Mon client peut voir le sitemap sans créer de compte ?",
          a: "Oui. Les liens de partage sont publics et interactifs. Ton client peut voir et naviguer dans le sitemap sans s'inscrire.",
        },
        {
          q: "En quoi c'est différent d'Octopus.do ou FlowMapp ?",
          a: "L'IA. Les autres outils te font glisser des boîtes à la main. Arbo génère ton sitemap entier à partir d'une phrase et te laisse l'éditer en langage naturel. C'est plus rapide d'un ordre de grandeur.",
        },
      ],
    },
    finalCta: {
      title: "Ton prochain sitemap commence par une phrase.",
      cta: "Commencer",
      ctaSecondary: "Pas de carte bancaire",
    },
    footer: {
      built: "Fait par",
      maker: "Ilies Allali",
      makerDesc: "indie designer, Lille, France",
    },
  },
}

export type Translations = typeof t.en
export function getTranslations(locale: Locale): Translations {
  return t[locale] as Translations
}
