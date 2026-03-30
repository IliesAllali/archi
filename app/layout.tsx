import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/lib/theme";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arbo.patchou.cloud"),
  title: {
    default: "Arbo — AI-powered visual sitemap builder",
    template: "%s | Arbo",
  },
  description:
    "Describe your website in plain text. Get a complete sitemap in seconds. Edit with AI, collaborate in real-time, export to PDF.",
  openGraph: {
    type: "website",
    siteName: "Arbo",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        style={{ background: "var(--canvas-bg)", color: "var(--text-primary)" }}
      >
        <ThemeProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
