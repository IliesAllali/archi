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
      title: "Stop building sitemaps by hand.",
      titleAccent: "Describe your site. Get the structure.",
      subtitle: "Type one sentence. AI generates a full page tree with hierarchy, types, and descriptions — ready in under 30 seconds. Edit, share, and export without leaving the tab.",
      cta: "Generate your first sitemap free",
      ctaSecondary: "No credit card required",
    },
    manifesto: {
      title: "Every project starts with a blank page. Yours shouldn't.",
      subtitle: "Describe your project in plain English. Get a complete, editable site structure — not a template to fill in, a real architecture to build from.",
      points: [
        {
          title: "Skip the blank canvas",
          desc: "One sentence in, full page tree out. Stop dragging empty boxes and start from a structure that already makes sense.",
        },
        {
          title: "Iterate without starting over",
          desc: "Tell AI what to change, or drag and restructure manually. Your team sees every update live — no file versions, no confusion.",
        },
        {
          title: "Send it in 10 seconds",
          desc: "Share a live link your client can explore without an account. Or export a clean PDF for the kickoff deck.",
        },
      ],
    },
    pillars: [
      {
        number: "1.0",
        label: "Generate",
        title: "A full sitemap before your coffee gets cold.",
        subtitle: "One sentence about your site. AI returns a complete page tree — hierarchy, page types, SEO descriptions — in under 30 seconds. No template to fill in. No boxes to drag.",
        placeholder: "AI generating a full visual sitemap from a text prompt",
        link: "How AI generation works",
        subs: [
          { id: "1.1", title: "One sentence is enough", desc: "Describe your project in plain English. AI handles the hierarchy, page types, and information architecture." },
          { id: "1.2", title: "Ready for handoff", desc: "Every page comes with a type, description, and parent-child relationship. Pass it to design or dev immediately." },
          { id: "1.3", title: "No credit limits with your own key", desc: "Use included credits or plug your OpenAI, Anthropic, or Mistral API key. Unlimited generation, zero margin." },
        ],
      },
      {
        number: "2.0",
        label: "Edit",
        title: "Change anything. In plain English or by hand.",
        subtitle: "Select a node, tell AI what to do. Or drag, rename, restructure yourself. Your whole team sees changes live. No merge conflicts, no 'who has the latest version.'",
        placeholder: "Visual sitemap canvas with inline AI editing and live collaboration",
        link: "How editing works",
        subs: [
          { id: "2.1", title: "Talk to your sitemap", desc: "\"Split this into 3 sub-pages\" or \"Add a blog section.\" AI restructures the tree without you touching a node." },
          { id: "2.2", title: "Everyone on the same page", desc: "Invite your team. Live presence, instant sync. No one's working off an outdated export." },
          { id: "2.3", title: "Undo anything, anytime", desc: "Every change is saved automatically. Restore any previous version in one click — no questions asked." },
        ],
      },
      {
        number: "3.0",
        label: "Share",
        title: "Clients approve faster when they can actually see it.",
        subtitle: "Share a live link they can explore without creating an account. Or export a PDF that holds up in a boardroom. Either way, no back-and-forth emails about page names.",
        placeholder: "Sitemap share modal, PDF export, and client view",
        link: "How sharing works",
        subs: [
          { id: "3.1", title: "No 'please sign up' friction", desc: "One link. Your client sees the full interactive sitemap — no login, no install, no friction." },
          { id: "3.2", title: "A PDF worth putting in a deck", desc: "Clean, presentation-ready export. Not a screenshot — a document your client will actually read." },
          { id: "3.3", title: "Feedback stays on the sitemap", desc: "Comments live right on the structure. Stop translating email threads into page changes." },
        ],
      },
    ],
    pricing: {
      label: "Pricing",
      title: "Pay once. Use it on every project.",
      subtitle: "No subscription. No 'your trial expired.' One payment, yours forever.",
      cta: "Start free",
      ctaBuy: "Buy now",
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
          a: "Yes. The free tier includes 3 projects, 20 AI credits, PDF export, share links, collaboration, and version history. No credit card required. Paid plans (Solo 59\u20ac, Studio 129\u20ac, Agency 249\u20ac) are one-time purchases for unlimited projects and more credits.",
        },
        {
          q: "What happens when I run out of AI credits?",
          a: "You can buy credit packs (from 4\u20ac for 200 credits) or plug your own API key (OpenAI, Anthropic, or Mistral) on paid plans. BYOK means unlimited AI with zero margin from Arbo.",
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
        {
          q: "Can Arbo generate wireframes too?",
          a: "Yes. Select any page in your sitemap and AI generates a lo-fi wireframe. Header and footer are auto-extracted as global components. You can export the wireframe HTML and paste it into htmlto.design for instant Figma import.",
        },
        {
          q: "What is MCP and how does it work with Arbo?",
          a: "MCP (Model Context Protocol) lets AI assistants like Claude, Cursor, or ChatGPT read and edit your sitemaps programmatically. Arbo is an MCP server \u2014 one command to connect, and your AI assistant has full access to your projects.",
        },
        {
          q: "Why lifetime pricing instead of a subscription?",
          a: "A sitemap builder is a tool, not a service. You shouldn't pay monthly for something you use per project. Buy once, use forever. We charge for AI credit packs separately if you don't bring your own API key.",
        },
        {
          q: "Can I bring my own API key?",
          a: "Yes. BYOK is available on Solo, Studio, and Agency plans. Plug your OpenAI, Anthropic, or Mistral key and use AI with no credit limits. Zero margin from Arbo on your API usage.",
        },
      ],
    },
    howItWorks: {
      label: "How it works",
      steps: [
        { title: "Describe", desc: "One sentence about your site. What it does, who it's for." },
        { title: "Generate", desc: "AI returns a full page tree in under 30 seconds. Hierarchy, page types, descriptions included." },
        { title: "Deliver", desc: "Share a live link, hand off a PDF, or connect via MCP. Done." },
      ],
    },
    wireframe: {
      number: "4.0",
      label: "Wireframe",
      title: "Skip the back-and-forth on page layouts.",
      subtitle: "Select any page, get a lo-fi wireframe. Header and footer auto-extracted as global components. Export HTML directly to Figma.",
      placeholder: "AI wireframe preview",
      link: "How wireframes work",
      subs: [
        { id: "4.1", title: "Layout in one click", desc: "AI reads the page type and description and proposes a relevant lo-fi layout. No blank artboard." },
        { id: "4.2", title: "Global components extracted automatically", desc: "Header and footer detected and shared across all pages. Edit once, applied everywhere." },
        { id: "4.3", title: "In Figma in 30 seconds", desc: "Copy the wireframe HTML, paste into htmlto.design. Auto-layered and ready for hi-fi — no manual cleanup." },
      ],
    },
    integrations: {
      label: "Integrations",
      title: "Connect to your AI tools.",
      subtitle: "Arbo is an MCP server. Any AI client can read and edit your sitemaps programmatically.",
      clients: [
        { name: "Claude Desktop", desc: "Native MCP support" },
        { name: "Claude Code", desc: "CLI integration" },
        { name: "Cursor", desc: "IDE-native MCP" },
        { name: "ChatGPT", desc: "Via Apps connector" },
      ],
      snippet: 'claude mcp add --transport http arbo "https://arbo.patchou.cloud/api/mcp"',
      note: "One command to connect. Full read/write access to your sitemaps from any MCP client.",
    },
    social: {
      line: "Used by freelancers, agencies, and product teams to plan website structure before design.",
    },
    finalCta: {
      title: "Your next project kickoff starts here.",
      cta: "Build your first sitemap free",
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
      title: "Arrête de construire tes arborescences à la main.",
      titleAccent: "Décris ton site. Obtiens la structure.",
      subtitle: "Une phrase suffit. L'IA génère un arbre de pages complet avec hiérarchie, types et descriptions en moins de 30 secondes. Modifie, partage et exporte sans changer d'onglet.",
      cta: "Génère ton premier sitemap gratuitement",
      ctaSecondary: "Pas de carte bancaire",
    },
    manifesto: {
      title: "Chaque projet commence avec une page blanche. Le tien, non.",
      subtitle: "Décris ton projet normalement. Obtiens une architecture de site complète et modifiable — pas un template à remplir, une vraie base pour construire.",
      points: [
        {
          title: "Finis les boîtes vides",
          desc: "Une phrase en entrée, un arbre de pages en sortie. Arrête de glisser des blocs vides, commence avec une structure qui a déjà du sens.",
        },
        {
          title: "Itère sans tout recommencer",
          desc: "Dis à l'IA ce que tu veux changer, ou restructure à la main. Ton équipe voit chaque modif en direct — pas de version qui traîne.",
        },
        {
          title: "Envoie en 10 secondes",
          desc: "Partage un lien live que ton client peut explorer sans créer de compte. Ou exporte un PDF propre pour le deck de kickoff.",
        },
      ],
    },
    pillars: [
      {
        number: "1.0",
        label: "Générer",
        title: "Un sitemap complet avant que ton café refroidisse.",
        subtitle: "Une phrase sur ton site. L'IA retourne un arbre complet — hiérarchie, types de pages, descriptions SEO — en moins de 30 secondes. Pas de template. Pas de boîtes à glisser.",
        placeholder: "L'IA génère un sitemap visuel complet depuis un texte",
        link: "Comment la génération IA fonctionne",
        subs: [
          { id: "1.1", title: "Une phrase suffit", desc: "Décris ton projet normalement. L'IA gère la hiérarchie, les types de pages et l'architecture d'information." },
          { id: "1.2", title: "Prêt pour le handoff", desc: "Chaque page a son type, sa description et sa relation parent-enfant. Transmissible au design ou au dev immédiatement." },
          { id: "1.3", title: "Pas de limite avec ta propre clé", desc: "Utilise les crédits inclus ou branche ta clé OpenAI, Anthropic ou Mistral. Génération illimitée, zéro marge." },
        ],
      },
      {
        number: "2.0",
        label: "Éditer",
        title: "Modifie n'importe quoi. En texte ou à la main.",
        subtitle: "Sélectionne un nœud, dis à l'IA ce que tu veux. Ou glisse, renomme, restructure toi-même. Toute ton équipe voit les changements en direct. Fini le 'qui a la dernière version ?'",
        placeholder: "Canvas de sitemap visuel avec édition IA et collaboration live",
        link: "Comment l'édition fonctionne",
        subs: [
          { id: "2.1", title: "Parle à ton sitemap", desc: "\"Découpe ça en 3 sous-pages\" ou \"Ajoute une section blog.\" L'IA restructure l'arbre sans que tu touches un nœud." },
          { id: "2.2", title: "Tout le monde sur la même page", desc: "Invite ton équipe. Présence live, sync instantanée. Personne ne travaille sur une version périmée." },
          { id: "2.3", title: "Annule n'importe quoi, à tout moment", desc: "Chaque modif est sauvegardée automatiquement. Restaure n'importe quelle version en un clic." },
        ],
      },
      {
        number: "3.0",
        label: "Partager",
        title: "Les clients valident plus vite quand ils voient vraiment.",
        subtitle: "Partage un lien qu'ils peuvent explorer sans créer de compte. Ou exporte un PDF qui tient en réunion. Dans les deux cas, fini les allers-retours par email sur les noms de pages.",
        placeholder: "Modal de partage de sitemap, export PDF et vue client",
        link: "Comment le partage fonctionne",
        subs: [
          { id: "3.1", title: "Pas de 'merci de vous inscrire'", desc: "Un lien. Ton client voit le sitemap interactif complet — pas de connexion, pas d'install, pas de friction." },
          { id: "3.2", title: "Un PDF qu'on met vraiment dans un deck", desc: "Export propre, prêt à présenter. Pas une capture d'écran — un document que ton client va lire." },
          { id: "3.3", title: "Les retours restent sur le sitemap", desc: "Les commentaires vivent sur la structure. Arrête de traduire des fils d'email en modifications de pages." },
        ],
      },
    ],
    pricing: {
      label: "Tarifs",
      title: "Tu paies une fois. Tu l'utilises sur tous tes projets.",
      subtitle: "Pas d'abonnement. Pas de 'ton essai a expiré'. Un paiement, c'est à toi pour toujours.",
      cta: "Commencer gratuitement",
      ctaBuy: "Acheter",
      free: {
        name: "Free",
        price: "0",
        desc: "Tout essayer",
        features: ["3 projets", "20 cr\u00e9dits IA", "Export PDF (watermark)", "Liens de partage"],
      },
      solo: {
        name: "Solo",
        price: "59",
        desc: "Pour les freelances actifs",
        features: ["Projets illimit\u00e9s", "300 cr\u00e9dits IA", "BYOK + MCP", "PDF sans watermark", "50 snapshots / projet"],
      },
      studio: {
        name: "Studio",
        price: "129",
        desc: "Pour les petites \u00e9quipes",
        features: ["Tout de Solo", "5 \u00e9diteurs", "1 000 cr\u00e9dits IA", "White label (logo custom)", "Historique illimit\u00e9"],
      },
      agency: {
        name: "Agency",
        price: "249",
        desc: "Pour les agences",
        features: ["Tout de Studio", "15 \u00e9diteurs", "3 000 cr\u00e9dits IA", "Multi-workspace", "Support prioritaire"],
      },
      once: "une fois",
      perks: [
        "Acc\u00e8s \u00e0 vie",
        "BYOK : utilise ta propre cl\u00e9 API",
        "MCP : connecte Claude, Cursor, ChatGPT",
        "G\u00e9n\u00e9ration IA de sitemap",
        "Collaboration temps r\u00e9el",
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
          a: "Oui. Le tier gratuit inclut 3 projets, 20 cr\u00e9dits IA, export PDF, liens de partage, collaboration et historique. Pas de carte bancaire. Les plans payants (Solo 59\u20ac, Studio 129\u20ac, Agency 249\u20ac) sont des achats uniques pour des projets illimit\u00e9s et plus de cr\u00e9dits.",
        },
        {
          q: "Et quand j\u2019ai plus de cr\u00e9dits IA ?",
          a: "Tu peux acheter des packs de cr\u00e9dits (\u00e0 partir de 4\u20ac pour 200 cr\u00e9dits) ou brancher ta propre cl\u00e9 API (OpenAI, Anthropic ou Mistral) sur les plans payants. BYOK = IA illimit\u00e9e, z\u00e9ro marge Arbo.",
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
        {
          q: "Arbo peut g\u00e9n\u00e9rer des wireframes aussi ?",
          a: "Oui. S\u00e9lectionne n\u2019importe quelle page de ton sitemap et l\u2019IA g\u00e9n\u00e8re un wireframe lo-fi. Header et footer sont auto-extraits comme composants globaux. Tu peux exporter le HTML et le coller dans htmlto.design pour un import Figma instantan\u00e9.",
        },
        {
          q: "C\u2019est quoi le MCP et comment \u00e7a marche avec Arbo ?",
          a: "Le MCP (Model Context Protocol) permet aux assistants IA comme Claude, Cursor ou ChatGPT de lire et modifier tes sitemaps. Arbo est un serveur MCP \u2014 une commande pour connecter, et ton assistant IA a acc\u00e8s complet \u00e0 tes projets.",
        },
        {
          q: "Pourquoi un tarif lifetime au lieu d\u2019un abonnement ?",
          a: "Un outil de sitemap est un outil, pas un service. Tu ne devrais pas payer chaque mois pour quelque chose que tu utilises par projet. Ach\u00e8te une fois, utilise pour toujours. Les cr\u00e9dits IA sont vendus s\u00e9par\u00e9ment si tu n\u2019as pas ta propre cl\u00e9 API.",
        },
        {
          q: "Je peux utiliser ma propre cl\u00e9 API ?",
          a: "Oui. Le BYOK est disponible sur les plans Solo, Studio et Agency. Branche ta cl\u00e9 OpenAI, Anthropic ou Mistral et utilise l\u2019IA sans limite de cr\u00e9dits. Z\u00e9ro marge Arbo sur ta consommation API.",
        },
      ],
    },
    howItWorks: {
      label: "Comment ça marche",
      steps: [
        { title: "Décris", desc: "Une phrase sur ton site. Ce qu'il fait, pour qui." },
        { title: "Génère", desc: "L'IA retourne un arbre complet en moins de 30 secondes. Hiérarchie, types de pages, descriptions inclus." },
        { title: "Livre", desc: "Partage un lien live, transmets un PDF, ou connecte via MCP. C'est fait." },
      ],
    },
    wireframe: {
      number: "4.0",
      label: "Wireframe",
      title: "Finis les discussions sur les layouts de pages.",
      subtitle: "Sélectionne une page, obtiens un wireframe lo-fi. Header et footer auto-extraits comme composants globaux. Exporte le HTML directement vers Figma.",
      placeholder: "Aperçu wireframe IA",
      link: "Comment marchent les wireframes",
      subs: [
        { id: "4.1", title: "Un layout en un clic", desc: "L'IA lit le type et la description de la page et propose un layout lo-fi pertinent. Pas d'artboard vide." },
        { id: "4.2", title: "Composants globaux extraits automatiquement", desc: "Header et footer détectés et partagés sur toutes les pages. Édite une fois, appliqué partout." },
        { id: "4.3", title: "Dans Figma en 30 secondes", desc: "Copie le HTML du wireframe, colle dans htmlto.design. Auto-layeré, prêt pour le hi-fi — zéro nettoyage manuel." },
      ],
    },
    integrations: {
      label: "Int\u00e9grations",
      title: "Connecte tes outils IA.",
      subtitle: "Arbo est un serveur MCP. N\u2019importe quel client IA peut lire et modifier tes sitemaps.",
      clients: [
        { name: "Claude Desktop", desc: "Support MCP natif" },
        { name: "Claude Code", desc: "Int\u00e9gration CLI" },
        { name: "Cursor", desc: "MCP natif dans l\u2019IDE" },
        { name: "ChatGPT", desc: "Via connecteur Apps" },
      ],
      snippet: 'claude mcp add --transport http arbo "https://arbo.patchou.cloud/api/mcp"',
      note: "Une commande pour connecter. Acc\u00e8s lecture/\u00e9criture complet \u00e0 tes sitemaps depuis n\u2019importe quel client MCP.",
    },
    social: {
      line: "Utilis\u00e9 par des freelances, agences et \u00e9quipes produit pour planifier l\u2019arborescence de leur site.",
    },
    finalCta: {
      title: "Ton prochain kickoff commence ici.",
      cta: "Construis ton premier sitemap gratuitement",
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
