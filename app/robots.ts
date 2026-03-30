import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/landing", "/share/"],
        disallow: ["/api/", "/admin", "/account", "/login", "/signup"],
      },
    ],
    sitemap: "https://arbo.patchou.cloud/sitemap.xml",
  }
}
