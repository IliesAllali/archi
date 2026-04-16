import type { Metadata } from "next"
import LandingClient from "./LandingClient"

/** Avoid Full Route Cache (s-maxage=1y) so deploys show new landing HTML immediately */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Arbo — Free AI Visual Sitemap Builder & Wireframe Generator | Generate Sitemaps from Text",
  description:
    "Free AI sitemap generator and wireframe builder. Describe your website in one sentence, get a complete visual sitemap in 30 seconds. AI wireframes, MCP server integration, real-time collaboration, PDF export. Lifetime pricing, no subscription. Octopus.do & FlowMapp alternative.",
  keywords: [
    "sitemap builder",
    "AI sitemap generator",
    "visual sitemap",
    "sitemap tool",
    "website planning tool",
    "information architecture",
    "sitemap creator",
    "free sitemap generator",
    "collaborative sitemap",
    "AI website structure",
    "wireframe generator",
    "lo-fi wireframe",
    "MCP server",
    "lifetime deal",
    "octopus.do alternative",
    "flowmapp alternative",
    "slickplan alternative",
    "AI wireframe",
    "sitemap to wireframe",
    "website architecture tool",
  ],
  alternates: {
    canonical: "https://arbo.patchou.cloud/landing",
  },
  openGraph: {
    title: "Arbo — Free AI Sitemap Builder & Wireframe Generator",
    description:
      "Generate a complete visual sitemap from a text prompt in 30 seconds. AI wireframes, MCP integration, lifetime pricing. Free to start.",
    type: "website",
    url: "https://arbo.patchou.cloud/landing",
    siteName: "Arbo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arbo — AI Sitemap Builder & Wireframe Generator",
    description:
      "Describe your website. Get a sitemap + wireframes in 30 seconds. Free, AI-powered, lifetime pricing.",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Arbo",
  url: "https://arbo.patchou.cloud",
  applicationCategory: "DesignApplication",
  applicationSubCategory: "Sitemap Builder",
  operatingSystem: "Web",
  description:
    "Free AI visual sitemap builder and wireframe generator. Generate a complete website sitemap from a text prompt in 30 seconds. Edit with AI, collaborate in real-time, generate wireframes, connect via MCP, export to PDF.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "249",
    priceCurrency: "EUR",
    offerCount: "4",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "EUR", description: "3 projects, 20 AI credits, PDF export, share links" },
      { "@type": "Offer", name: "Solo", price: "59", priceCurrency: "EUR", description: "Unlimited projects, 300 AI credits, BYOK, MCP, no watermark. One-time payment." },
      { "@type": "Offer", name: "Studio", price: "129", priceCurrency: "EUR", description: "5 editors, 1000 AI credits, white label. One-time payment." },
      { "@type": "Offer", name: "Agency", price: "249", priceCurrency: "EUR", description: "15 editors, 3000 AI credits, multi-workspace. One-time payment." },
    ],
  },
  featureList: [
    "AI sitemap generation from text prompt",
    "AI inline editing with natural language",
    "AI wireframe generation per page",
    "Visual drag-and-drop sitemap editor",
    "Real-time collaboration with live presence",
    "PDF export for client presentations",
    "Share links without account required",
    "MCP server for Claude, Cursor, ChatGPT integration",
    "Bring your own API key (OpenAI, Anthropic, Mistral)",
    "Version history with restore",
    "White label branding (Studio/Agency)",
    "Zoning editor for custom wireframe layouts",
    "Global components (header/footer auto-extraction)",
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a visual sitemap builder?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A visual sitemap builder is a tool that helps you plan your website's page structure visually, with a tree or flowchart view. Unlike XML sitemap generators used for SEO crawling, visual sitemaps are for planning information architecture before design and development.",
      },
    },
    {
      "@type": "Question",
      name: "Can AI generate a sitemap from a text description?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Arbo generates a complete visual sitemap from a single sentence. Describe your website project, and AI returns a full page tree with hierarchy, page types, and descriptions in under 30 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Is Arbo free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Arbo's free tier includes 3 projects, 20 AI credits, PDF export, share links, collaboration, and version history. No credit card required. Paid plans (Solo 59\u20ac, Studio 129\u20ac, Agency 249\u20ac) are one-time purchases.",
      },
    },
    {
      "@type": "Question",
      name: "How is Arbo different from Octopus.do or FlowMapp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Arbo is AI-native: you generate your entire sitemap from a text prompt instead of dragging boxes manually. It includes AI wireframes, MCP server integration, and lifetime pricing. Octopus.do starts at $16/mo, FlowMapp at $15/mo. Arbo is a one-time purchase from 59\u20ac.",
      },
    },
    {
      "@type": "Question",
      name: "Can Arbo generate wireframes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Select any page in your sitemap and AI generates a lo-fi wireframe. Header and footer are auto-extracted as global components. Export to Figma via htmlto.design.",
      },
    },
    {
      "@type": "Question",
      name: "What is MCP and how does Arbo use it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MCP (Model Context Protocol) lets AI assistants like Claude, Cursor, or ChatGPT read and edit your sitemaps programmatically. Arbo is an MCP server \u2014 one command to connect.",
      },
    },
    {
      "@type": "Question",
      name: "Why lifetime pricing instead of a subscription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A sitemap builder is a tool, not a service. You shouldn't pay monthly for something you use per project. Buy once, use forever. AI credit packs are sold separately.",
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingClient />
    </>
  )
}
