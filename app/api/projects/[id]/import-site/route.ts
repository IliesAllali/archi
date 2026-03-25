import { NextRequest, NextResponse } from "next/server"
import { db, getNextPosition, saveSnapshot } from "@/lib/db"
import { sanitizeText } from "@/lib/sanitize"
import { emitToProject } from "@/lib/socket"
import { requireProjectWrite } from "@/lib/project-access"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

// ─── URL → tree conversion ───────────────────────────────────────────────────

interface TreeNode {
  label: string
  slug: string
  path: string
  children: TreeNode[]
}

/**
 * Convert a flat list of URL paths into a tree structure.
 * e.g. ["/", "/about", "/blog", "/blog/post-1"] → nested tree
 */
function urlsToTree(urls: string[]): TreeNode[] {
  const root: TreeNode = { label: "Home", slug: "", path: "/", children: [] }

  // Normalize and deduplicate
  const paths = [...new Set(
    urls
      .map(u => {
        try {
          const url = new URL(u, "https://placeholder.com")
          return url.pathname.replace(/\/+$/, "") || "/"
        } catch {
          return null
        }
      })
      .filter(Boolean) as string[]
  )].sort()

  for (const p of paths) {
    if (p === "/") continue
    const segments = p.split("/").filter(Boolean)
    let current = root

    for (let i = 0; i < segments.length; i++) {
      const slug = segments[i]
      let child = current.children.find(c => c.slug === slug)
      if (!child) {
        child = {
          label: slugToLabel(slug),
          slug,
          path: "/" + segments.slice(0, i + 1).join("/"),
          children: [],
        }
        current.children.push(child)
      }
      current = child
    }
  }

  return [root]
}

function slugToLabel(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\.[^.]+$/, "") // remove file extension
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || "Page"
}

// ─── XML Sitemap parser ──────────────────────────────────────────────────────

function parseSitemapXml(xml: string): string[] {
  const urls: string[] = []
  // Match <loc>...</loc> tags — works for both urlset and sitemapindex
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi
  let match
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1])
  }
  return urls
}

// ─── Cheerio crawler ─────────────────────────────────────────────────────────

async function crawlSite(startUrl: string, maxPages = 200, maxDepth = 5): Promise<string[]> {
  const { load } = await import("cheerio")
  const origin = new URL(startUrl).origin
  const visited = new Set<string>()
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }]
  const found: string[] = []

  while (queue.length > 0 && found.length < maxPages) {
    const batch = queue.splice(0, 3) // concurrency of 3

    const results = await Promise.allSettled(
      batch.map(async ({ url, depth }) => {
        const normalized = normalizeUrl(url, origin)
        if (!normalized || visited.has(normalized)) return []
        visited.add(normalized)
        found.push(normalized)

        if (depth >= maxDepth) return []

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 8000)
          const res = await fetch(normalized, {
            signal: controller.signal,
            headers: { "User-Agent": "ArboBot/1.0 (sitemap-builder)" },
            redirect: "follow",
          })
          clearTimeout(timeout)

          const contentType = res.headers.get("content-type") || ""
          if (!contentType.includes("text/html")) return []

          const html = await res.text()
          const $ = load(html)
          const links: { url: string; depth: number }[] = []

          $("a[href]").each((_, el) => {
            const href = $(el).attr("href")
            if (!href) return
            const abs = normalizeUrl(href, origin)
            if (abs && !visited.has(abs) && abs.startsWith(origin)) {
              links.push({ url: abs, depth: depth + 1 })
            }
          })

          return links
        } catch {
          return []
        }
      })
    )

    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const link of r.value) {
          if (!visited.has(normalizeUrl(link.url, origin)!) && queue.length + found.length < maxPages) {
            queue.push(link)
          }
        }
      }
    }

    // Rate limit: 100ms between batches
    if (queue.length > 0) await new Promise(r => setTimeout(r, 100))
  }

  return found
}

function normalizeUrl(href: string, origin: string): string | null {
  try {
    const url = new URL(href, origin)
    // Same origin only
    if (url.origin !== origin) return null
    // Skip non-page resources
    if (/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|zip|xml|json|woff2?|ttf|eot)$/i.test(url.pathname)) return null
    // Skip fragments, mailto, tel
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null
    // Remove hash, keep search params
    url.hash = ""
    return url.toString().replace(/\/+$/, "") || url.origin
  } catch {
    return null
  }
}

// ─── Detect if body is mostly empty (SPA) ─────────────────────────────────

async function detectSpa(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ArboBot/1.0 (sitemap-builder)" },
    })
    clearTimeout(timeout)
    const html = await res.text()
    const { load } = await import("cheerio")
    const $ = load(html)
    // SPA indicators: very few links, or body text is very short, or has <div id="root/app">
    const links = $("a[href]").length
    const bodyText = $("body").text().replace(/\s+/g, " ").trim()
    const hasAppRoot = $("#root, #app, #__next").length > 0
    return links < 3 && bodyText.length < 200 && hasAppRoot
  } catch {
    return false
  }
}

// ─── Firecrawl fallback ──────────────────────────────────────────────────────

async function crawlWithFirecrawl(url: string, apiKey: string): Promise<string[]> {
  // Use Firecrawl's map endpoint to get all URLs
  const res = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      limit: 200,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Firecrawl error: ${res.status}`)
  }

  const data = await res.json()
  // map endpoint returns { success, links: string[] }
  return data.links || []
}

// ─── Insert tree into DB ─────────────────────────────────────────────────────

function insertTree(
  projectId: string,
  tree: TreeNode[],
  userId: string,
  userName: string
): number {
  const now = Date.now()
  let count = 0

  const insertStmt = db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  )

  function insertNode(node: TreeNode, parentId: string | null) {
    const nodeId = nanoid()
    const position = getNextPosition(projectId, parentId)
    const data = JSON.stringify({
      label: sanitizeText(node.label),
      type: node.path === "/" ? "home" : "detail",
      priority: node.path === "/" ? "primary" : "secondary",
      description: node.path !== "/" ? node.path : "",
      lastModifiedBy: userId,
      lastModifiedByName: userName || "Import",
    })
    insertStmt.run(nodeId, projectId, parentId, position, data, now, now)
    count++

    for (const child of node.children) {
      insertNode(child, nodeId)
    }
  }

  db.transaction(() => {
    for (const node of tree) {
      insertNode(node, null)
    }
    saveSnapshot(projectId, "site_import", userName || "Import", "human")
  })()

  return count
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireProjectWrite(req, params.id)
  if (!access)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const project = db
    .prepare("SELECT id FROM projects WHERE id = ? AND archived = 0")
    .get(params.id) as { id: string } | undefined
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 })

  const body = await req.json()
  const { mode, projectId: _pid, ...payload } = body
  // mode: "sitemap" | "crawl" | "urls"

  const userId = (access as { userId?: string }).userId || "import"
  const userName = (access as { userName?: string }).userName || "Import"

  try {
    let urls: string[] = []

    if (mode === "sitemap") {
      // payload.xml: string (raw XML content)
      if (!payload.xml || typeof payload.xml !== "string") {
        return NextResponse.json({ error: "XML content required" }, { status: 400 })
      }
      urls = parseSitemapXml(payload.xml)
      if (urls.length === 0) {
        return NextResponse.json({ error: "No URLs found in sitemap" }, { status: 400 })
      }

    } else if (mode === "crawl") {
      // payload.url: string
      if (!payload.url || typeof payload.url !== "string") {
        return NextResponse.json({ error: "URL required" }, { status: 400 })
      }

      // Try fetching sitemap.xml first
      let sitemapUrls: string[] = []
      try {
        const origin = new URL(payload.url).origin
        const sitemapRes = await fetch(`${origin}/sitemap.xml`, {
          headers: { "User-Agent": "ArboBot/1.0" },
          signal: AbortSignal.timeout(5000),
        })
        if (sitemapRes.ok) {
          const xml = await sitemapRes.text()
          sitemapUrls = parseSitemapXml(xml)
        }
      } catch { /* no sitemap, continue */ }

      if (sitemapUrls.length > 5) {
        // sitemap.xml found and has content — use it
        urls = sitemapUrls
      } else {
        // Check if SPA
        const isSpa = await detectSpa(payload.url)

        if (isSpa && payload.firecrawlKey) {
          // Fallback to Firecrawl for SPAs
          urls = await crawlWithFirecrawl(payload.url, payload.firecrawlKey)
        } else if (isSpa) {
          return NextResponse.json({
            error: "spa_detected",
            message: "This site appears to be a single-page application. A Firecrawl API key is needed to crawl it.",
          }, { status: 422 })
        } else {
          // Standard crawl with cheerio
          urls = await crawlSite(payload.url, payload.maxPages || 200)
        }
      }

    } else if (mode === "urls") {
      // payload.urls: string[] or payload.text: string (one URL per line)
      if (payload.urls && Array.isArray(payload.urls)) {
        urls = payload.urls
      } else if (payload.text && typeof payload.text === "string") {
        urls = payload.text
          .split(/[\n\r]+/)
          .map((l: string) => l.trim())
          .filter((l: string) => l && (l.startsWith("http") || l.startsWith("/")))
      } else {
        return NextResponse.json({ error: "URLs required" }, { status: 400 })
      }

    } else {
      return NextResponse.json({ error: "Invalid mode. Use: sitemap, crawl, or urls" }, { status: 400 })
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: "No pages found" }, { status: 400 })
    }

    // Cap at 500
    if (urls.length > 500) urls = urls.slice(0, 500)

    // Convert to tree and insert
    const tree = urlsToTree(urls)
    const nodesCreated = insertTree(params.id, tree, userId, userName)

    emitToProject(params.id, "nodes-updated", { source: "import" })

    return NextResponse.json({
      success: true,
      urlsFound: urls.length,
      nodesCreated,
      tree: tree.map(n => ({ label: n.label, path: n.path, childCount: countNodes(n) - 1 })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Site import error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0)
}
