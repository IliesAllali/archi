import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "Arbo — AI-powered visual sitemap builder",
  description:
    "Describe your website in plain text. Get a complete sitemap in seconds. Edit with AI, collaborate in real-time, export to PDF.",
  alternates: {
    canonical: "https://arbo.patchou.cloud/landing",
  },
  openGraph: {
    title: "Arbo — AI-powered visual sitemap builder",
    description:
      "Plan your site structure with AI. From idea to sitemap in minutes.",
    type: "website",
    url: "https://arbo.patchou.cloud/landing",
    siteName: "Arbo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arbo — AI sitemap builder",
    description: "Plan your site structure with AI. Free during beta.",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Arbo",
  url: "https://arbo.patchou.cloud",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  description:
    "AI-powered visual sitemap builder. Describe your website in plain text, get a complete sitemap in seconds.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Free during beta",
  },
  featureList: [
    "AI sitemap generation from text prompt",
    "Real-time collaboration",
    "PDF export",
    "Share links with password protection",
    "SEO metadata per page",
    "Drag and drop editor",
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  )
}
