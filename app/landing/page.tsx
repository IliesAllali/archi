import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "Arbo — Free AI Visual Sitemap Builder | Generate Sitemaps from Text",
  description:
    "Free AI sitemap generator. Describe your website in one sentence, get a complete visual sitemap in 30 seconds. Edit with AI, collaborate in real-time, export to PDF. Octopus.do & FlowMapp alternative.",
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
  ],
  alternates: {
    canonical: "https://arbo.patchou.cloud/landing",
  },
  openGraph: {
    title: "Arbo — Free AI Sitemap Builder",
    description:
      "Generate a complete visual sitemap from a text prompt in 30 seconds. Free to start, no credit card required.",
    type: "website",
    url: "https://arbo.patchou.cloud/landing",
    siteName: "Arbo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arbo — Free AI Sitemap Builder",
    description:
      "Describe your website. Get a visual sitemap in 30 seconds. Free, AI-powered, collaborative.",
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
    "Free AI visual sitemap builder. Generate a complete website sitemap from a text prompt in 30 seconds. Edit with AI or drag-and-drop, collaborate in real-time, share with clients, and export to PDF.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Free tier: 3 projects, 20 AI credits, all features included",
  },
  featureList: [
    "AI sitemap generation from text prompt",
    "Visual drag-and-drop sitemap editor",
    "Real-time collaboration with live presence",
    "PDF export for client presentations",
    "Share links without account required",
    "SEO metadata per page node",
    "Version history with restore",
    "Bring your own API key (OpenAI, Anthropic, Mistral)",
  ],
  aggregateRating: undefined,
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
        text: "Yes. Arbo's free tier includes 3 projects, 20 AI credits, PDF export, share links, collaboration, and version history. No credit card required. Pro plans are coming soon, but the free tier will always exist.",
      },
    },
    {
      "@type": "Question",
      name: "How is Arbo different from Octopus.do or FlowMapp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Arbo is AI-native: you generate your entire sitemap from a text prompt instead of dragging boxes manually. It also offers real-time collaboration, version history, and a generous free tier. Octopus.do starts at $16/mo, FlowMapp at $15/mo. Arbo's Pro will be 12 EUR/mo.",
      },
    },
    {
      "@type": "Question",
      name: "Can clients view a sitemap without creating an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Arbo share links are public and interactive. Your client can view and navigate the full sitemap without signing up or installing anything.",
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
