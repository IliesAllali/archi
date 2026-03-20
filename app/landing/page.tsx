import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Arbo - Visual Sitemap Builder",
  description:
    "Construisez vos arborescences de sites visuellement. Collaborez en temps réel, connectez votre IA, partagez en un clic.",
  openGraph: {
    title: "Arbo - Visual Sitemap Builder",
    description: "Construisez vos arborescences de sites visuellement.",
    type: "website",
    url: "https://arbo.patchou.cloud",
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
