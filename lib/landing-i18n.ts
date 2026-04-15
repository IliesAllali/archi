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
      title: "AI visual sitemap builder.",
      titleAccent: "Brief to structure in 30 seconds",
      subtitle: "Describe your website in one sentence. AI generates a complete visual sitemap with page hierarchy, types, and descriptions. Edit with AI or drag-and-drop, collaborate in real-time, export to PDF.",
      cta: "Generate your first sitemap free",
      ctaSecondary: "No credit card required",
    },
    manifesto: {
      title: "A sitemap builder that starts from words, not boxes.",
      subtitle: "Built around AI from day one. Describe your project, get a complete site structure. Edit it with natural language or by hand, share a live link with clients, export a clean PDF.",
      points: [
        {
          title: "AI sitemap generation",
          desc: "Describe your project in one sentence. Get a complete page tree with types, hierarchy, and descriptions. No manual box dragging.",
        },
        {
          title: "Visual sitemap editor",
          desc: "Drag pages, rename nodes, restructure sections. Real-time collaboration keeps your whole team on the same page.",
        },
        {
          title: "Share and export",
          desc: "Send a live link to your client or export a presentation-ready PDF. No account needed on their end.",
        },
      ],
    },
    pillars: [
      {
        number: "1.0",
        label: "Generate",
        title: "Generate a sitemap from text. In seconds.",
        subtitle: "Type one sentence about your website. AI returns a complete page tree with hierarchy, page types, and SEO descriptions. Custom to your brief, ready in under 30 seconds. No templates, no manual work.",
        placeholder: "AI generating a full visual sitemap from a text prompt",
        link: "How AI generation works",
        subs: [
          { id: "1.1", title: "Text to sitemap", desc: "One sentence in, full page tree out. AI understands context, page types, and information architecture." },
          { id: "1.2", title: "Smart structure", desc: "Pages are organized logically with types, descriptions, and parent-child relationships. Ready for design handoff." },
          { id: "1.3", title: "Bring your own key", desc: "Use included AI credits or plug your own API key. OpenAI, Anthropic, or Mistral. Unlimited generation with BYOK." },
        ],
      },
      {
        number: "2.0",
        label: "Edit",
        title: "Refine your sitemap with AI or drag-and-drop.",
        subtitle: "Select any node and tell AI what to change. Or just drag, rename, restructure. Real-time collaboration keeps your whole team in sync. Like Figma, but for website planning.",
        placeholder: "Visual sitemap canvas with inline AI editing and live collaboration",
        link: "How editing works",
        subs: [
          { id: "2.1", title: "AI inline editing", desc: "\"Split this into 3 sub-pages\" or \"Add a blog section.\" AI restructures your sitemap conversationally." },
          { id: "2.2", title: "Real-time collaboration", desc: "Invite your team. See who's editing what. Live presence, instant sync, zero merge conflicts." },
          { id: "2.3", title: "Version history", desc: "Every change is saved automatically. Made a mistake? Restore any previous version in one click." },
        ],
      },
      {
        number: "3.0",
        label: "Share",
        title: "Present sitemaps to clients in one click.",
        subtitle: "Generate a live share link your client can explore without creating an account. Need a deliverable? Export a clean, presentation-ready PDF for stakeholder reviews.",
        placeholder: "Sitemap share modal, PDF export, and client view",
        link: "How sharing works",
        subs: [
          { id: "3.1", title: "Client-ready share links", desc: "One click to share an interactive sitemap view. Your client sees it live, no login needed." },
          { id: "3.2", title: "PDF sitemap export", desc: "Export a clean, presentation-ready PDF. Perfect for client decks, project kickoffs, and stakeholder reviews." },
          { id: "3.3", title: "Comments and feedback", desc: "Collect feedback directly on the sitemap. No more back-and-forth emails about page structure." },
        ],
      },
    ],
    social: {
      line: "Used by freelancers, agencies, and product teams to plan website structure before design.",
    },
    pricing: {
      label: "Pricing",
      title: "Buy once, own forever.",
      subtitle: "No subscription. One payment, lifetime access. While competitors charge $15/month, Arbo is yours.",
      cta: "Start free",
      free: {
        name: "Free",
        price: "0",
        desc: "Try everything",
        features: ["3 projects", "20 AI credits", "PDF export (watermark)", "Share links", "BYOK API keys"],
      },
      solo: {
        name: "Solo",
        price: "59",
        desc: "For active freelancers",
        features: ["Unlimited projects", "300 AI credits", "PDF without watermark", "Clean share links", "50 snapshots / project"],
      },
      studio: {
        name: "Studio",
        price: "129",
        desc: "For small teams",
        features: ["Everything in Solo", "5 editors", "1,000 AI credits", "White label (custom logo)", "Unlimited history"],
      },
      agency: {
        name: "Agency",
        price: "249",
        desc: "For agencies",
        features: ["Everything in Studio", "15 editors", "3,000 AI credits", "Multi-workspace", "Priority support"],
      },
      once: "one-time",
      competitor: "Competitors charge $15/month for less.",
      perks: [
        "Lifetime access",
        "BYOK: use your own API key",
        "MCP: connect to Claude, Cursor, ChatGPT",
        "AI sitemap generation",
        "Real-time collaboration",
        "Version history",
      ],
    },
    faq: {
      title: "Frequently asked",
      items: [
        {
          q: "What is a visual sitemap builder?",
          a: "A visual sitemap builder helps you plan your website's page structure with a tree or flowchart view. Unlike XML sitemap generators used for SEO crawling, visual sitemaps are for planning information architecture before design and development. Arbo adds AI to generate the structure from a text description.",
        },
        {
          q: "Is Arbo really free?",
          a: "Yes. During beta, you get 3 projects and 20 AI credits at no cost. All features are included: PDF export, share links, collaboration, version history. We'll introduce Pro plans later, but your free tier will always exist.",
        },
        {
          q: "What happens when I run out of AI credits?",
          a: "You can plug your own API key (OpenAI, Anthropic, or Mistral) and keep using AI generation with no limits. BYOK is free forever.",
        },
        {
          q: "Can my client view the sitemap without an account?",
          a: "Yes. Share links are public and interactive. Your client can view and navigate the full sitemap without signing up or installing anything.",
        },
        {
          q: "How is Arbo different from Octopus.do or FlowMapp?",
          a: "AI generation. Other sitemap tools make you drag boxes manually. Arbo generates your entire website structure from a sentence and lets you edit it with natural language. Octopus.do starts at $16/month, FlowMapp at $15/month. Arbo is free to start.",
        },
        {
          q: "Can I use Arbo for client presentations?",
          a: "Yes. Export a clean PDF for stakeholder reviews, or share a live interactive link. Clients can explore the sitemap, leave comments, and approve the structure without creating an account.",
        },
      ],
    },
    finalCta: {
      title: "Your next sitemap starts with one sentence.",
      cta: "Generate your first sitemap",
      ctaSecondary: "Free. No credit card required.",
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
      title: "Outil d'arborescence IA.",
      titleAccent: "Du brief au sitemap en 30 secondes",
      subtitle: "Décris ton site en une phrase. L'IA génère une arborescence visuelle complète avec hiérarchie, types de pages et descriptions. Modifie avec l'IA ou en drag-and-drop, collabore en temps réel, exporte en PDF.",
      cta: "Génère ton premier sitemap gratuitement",
      ctaSecondary: "Pas de carte bancaire",
    },
    manifesto: {
      title: "Un outil d'arborescence qui part du texte, pas des boîtes.",
      subtitle: "Pensé autour de l'IA depuis le premier jour. Décris ton projet, obtiens une structure de site complète. Édite en langage naturel ou à la main, partage un lien live avec tes clients, exporte un PDF propre.",
      points: [
        {
          title: "Génération IA de sitemap",
          desc: "Décris ton projet en une phrase. Obtiens un arbre de pages complet avec types, hiérarchie et descriptions. Zéro travail manuel.",
        },
        {
          title: "Éditeur visuel de sitemap",
          desc: "Glisse des pages, renomme des nœuds, restructure des sections. La collaboration temps réel garde toute ton équipe alignée.",
        },
        {
          title: "Partage et export",
          desc: "Envoie un lien live à ton client ou exporte un PDF prêt à présenter. Pas de compte nécessaire de son côté.",
        },
      ],
    },
    pillars: [
      {
        number: "1.0",
        label: "Générer",
        title: "Génère un sitemap depuis un texte. En secondes.",
        subtitle: "Tape une phrase sur ton site web. L'IA retourne un arbre de pages complet avec hiérarchie, types et descriptions SEO. Sur-mesure pour ton brief, prêt en moins de 30 secondes. Pas de templates, pas de travail manuel.",
        placeholder: "L'IA génère un sitemap visuel complet depuis un texte",
        link: "Comment la génération IA fonctionne",
        subs: [
          { id: "1.1", title: "Du texte au sitemap", desc: "Une phrase en entrée, un arbre complet en sortie. L'IA comprend le contexte, les types de pages et l'architecture d'information." },
          { id: "1.2", title: "Structure intelligente", desc: "Les pages sont organisées logiquement avec types, descriptions et relations parent-enfant. Prêt pour le handoff design." },
          { id: "1.3", title: "Apporte ta propre clé", desc: "Utilise les crédits IA inclus ou branche ta propre clé API. OpenAI, Anthropic ou Mistral. Génération illimitée en BYOK." },
        ],
      },
      {
        number: "2.0",
        label: "Éditer",
        title: "Affine ton sitemap avec l'IA ou en drag-and-drop.",
        subtitle: "Sélectionne un nœud et dis à l'IA ce que tu veux. Ou glisse, renomme, restructure. La collaboration temps réel garde toute ton équipe synchronisée. Comme Figma, mais pour l'arborescence.",
        placeholder: "Canvas de sitemap visuel avec édition IA et collaboration live",
        link: "Comment l'édition fonctionne",
        subs: [
          { id: "2.1", title: "Édition IA inline", desc: "\"Découpe ça en 3 sous-pages\" ou \"Ajoute une section blog.\" L'IA restructure ton sitemap en conversationnel." },
          { id: "2.2", title: "Collaboration temps réel", desc: "Invite ton équipe. Vois qui édite quoi. Présence live, sync instantanée, zéro conflit de merge." },
          { id: "2.3", title: "Historique de versions", desc: "Chaque modif est sauvegardée automatiquement. Une erreur ? Restaure n'importe quelle version en un clic." },
        ],
      },
      {
        number: "3.0",
        label: "Partager",
        title: "Présente tes sitemaps aux clients en un clic.",
        subtitle: "Génère un lien de partage que ton client peut explorer sans créer de compte. Besoin d'un livrable ? Exporte un PDF propre, prêt pour les revues de projet.",
        placeholder: "Modal de partage de sitemap, export PDF et vue client",
        link: "Comment le partage fonctionne",
        subs: [
          { id: "3.1", title: "Liens de partage client", desc: "Un clic pour partager une vue interactive du sitemap. Ton client voit tout live, pas besoin de compte." },
          { id: "3.2", title: "Export PDF de sitemap", desc: "Exporte un PDF propre, prêt à présenter. Parfait pour les decks client, kickoffs et revues de projet." },
          { id: "3.3", title: "Commentaires et feedback", desc: "Collecte du feedback directement sur le sitemap. Fini les allers-retours par email sur la structure des pages." },
        ],
      },
    ],
    social: {
      line: "Utilisé par des freelances, agences et équipes produit pour planifier l'arborescence de leur site.",
    },
    pricing: {
      label: "Tarifs",
      title: "Achete une fois, garde pour toujours.",
      subtitle: "Pas d'abonnement. Un paiement, un acces a vie. La ou la concurrence facture 15$/mois, Arbo est a toi.",
      cta: "Commencer gratuitement",
      free: {
        name: "Free",
        price: "0",
        desc: "Tout essayer",
        features: ["3 projets", "20 credits IA", "Export PDF (watermark)", "Liens de partage", "BYOK cles API"],
      },
      solo: {
        name: "Solo",
        price: "59",
        desc: "Pour les freelances actifs",
        features: ["Projets illimites", "300 credits IA", "PDF sans watermark", "Liens sans branding", "50 snapshots / projet"],
      },
      studio: {
        name: "Studio",
        price: "129",
        desc: "Pour les petites equipes",
        features: ["Tout de Solo", "5 editeurs", "1 000 credits IA", "White label (logo custom)", "Historique illimite"],
      },
      agency: {
        name: "Agency",
        price: "249",
        desc: "Pour les agences",
        features: ["Tout de Studio", "15 editeurs", "3 000 credits IA", "Multi-workspace", "Support prioritaire"],
      },
      once: "une fois",
      competitor: "La concurrence facture 15$/mois pour moins.",
      perks: [
        "Acces a vie",
        "BYOK : utilise ta propre cle API",
        "MCP : connecte Claude, Cursor, ChatGPT",
        "Generation IA de sitemap",
        "Collaboration temps reel",
        "Historique de versions",
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "C'est quoi un outil de sitemap visuel ?",
          a: "Un outil de sitemap visuel permet de planifier l'arborescence de ton site web avec une vue en arbre. Contrairement aux générateurs de sitemap XML (pour le SEO), les sitemaps visuels servent à planifier l'architecture d'information avant le design et le développement. Arbo ajoute l'IA pour générer la structure depuis une description textuelle.",
        },
        {
          q: "Arbo est vraiment gratuit ?",
          a: "Oui. Pendant la bêta, tu as 3 projets et 20 crédits IA sans rien payer. Toutes les fonctions sont incluses : export PDF, liens de partage, collaboration, historique. On lancera des offres Pro plus tard, mais le tier gratuit existera toujours.",
        },
        {
          q: "Et quand j'ai plus de crédits IA ?",
          a: "Tu peux brancher ta propre clé API (OpenAI, Anthropic ou Mistral) et continuer à utiliser la génération IA sans limite. Le BYOK est gratuit pour toujours.",
        },
        {
          q: "Mon client peut voir le sitemap sans créer de compte ?",
          a: "Oui. Les liens de partage sont publics et interactifs. Ton client peut voir et naviguer dans le sitemap complet sans s'inscrire ni installer quoi que ce soit.",
        },
        {
          q: "En quoi c'est différent d'Octopus.do ou FlowMapp ?",
          a: "La génération IA. Les autres outils de sitemap te font glisser des boîtes à la main. Arbo génère toute l'arborescence à partir d'une phrase et te laisse l'éditer en langage naturel. Octopus.do démarre à 16$/mois, FlowMapp à 15$/mois. Arbo est gratuit pour commencer.",
        },
        {
          q: "Je peux utiliser Arbo pour des présentations client ?",
          a: "Oui. Exporte un PDF propre pour tes revues de projet, ou partage un lien interactif live. Tes clients peuvent explorer le sitemap, laisser des commentaires et valider la structure sans créer de compte.",
        },
      ],
    },
    finalCta: {
      title: "Ton prochain sitemap commence par une phrase.",
      cta: "Génère ton premier sitemap",
      ctaSecondary: "Gratuit. Pas de carte bancaire.",
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
