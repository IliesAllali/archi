import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "Arbo — AI-powered visual sitemap builder",
  description:
    "Describe your website in plain text. Get a complete sitemap in seconds. Edit with AI, collaborate in real-time, export to PDF.",
  openGraph: {
    title: "Arbo — AI-powered visual sitemap builder",
    description:
      "Plan your site structure with AI. From idea to sitemap in minutes.",
    type: "website",
    url: "https://arbo.patchou.cloud",
    siteName: "arbo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arbo — AI sitemap builder",
    description: "Plan your site structure with AI. Free during beta.",
  },
}

export default function LandingPage() {
  return <LandingClient />
}
