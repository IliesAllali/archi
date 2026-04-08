/**
 * Wireframe composition — assembles global sections (header/footer) with page-specific content.
 */

import type { GlobalSection, WireframeSettings } from "./types"

/**
 * Find a top-level HTML element block starting from a regex match.
 * Counts opening/closing tags of the matched element type to handle nesting.
 * Returns the full block including the comment marker if present.
 */
function extractBlock(html: string, startIdx: number, tag: string): string | null {
  // Find the opening tag from startIdx
  const openPattern = new RegExp(`<${tag}[\\s>]`, "i")
  const openMatch = openPattern.exec(html.slice(startIdx))
  if (!openMatch) return null

  const tagStart = startIdx + openMatch.index
  const closeTag = `</${tag}>`
  let depth = 0
  let i = tagStart

  // Walk through counting open/close of this tag type
  const scanner = new RegExp(`</?${tag}[\\s>/]`, "gi")
  scanner.lastIndex = tagStart

  let match
  while ((match = scanner.exec(html)) !== null) {
    if (match[0].startsWith("</")) {
      depth--
      if (depth === 0) {
        const endIdx = html.indexOf(">", match.index) + 1
        return html.slice(startIdx, endIdx).trim()
      }
    } else {
      depth++
    }
  }
  return null
}

/** Header: look for <!-- Navigation --> or <nav> or <header> or <div class="NavBar|Navigation|Header"> */
export function extractHeader(html: string): string | null {
  const body = extractBodyContent(html)

  // 1. Comment marker → next element (any tag)
  const commentMatch = body.match(/<!--\s*(?:Nav(?:igation|Bar)?|Header)\s*-->\s*/)
  if (commentMatch) {
    const afterComment = body.slice(commentMatch.index! + commentMatch[0].length)
    const tagMatch = afterComment.match(/^<(\w+)[\s>]/)
    if (tagMatch) {
      const block = extractBlock(body, commentMatch.index!, tagMatch[1])
      if (block) return block
    }
  }

  // 2. <nav ...> element
  const navIdx = body.search(/<nav[\s>]/i)
  if (navIdx !== -1) {
    const block = extractBlock(body, navIdx, "nav")
    if (block) return block
  }

  // 3. <header ...> element
  const headerIdx = body.search(/<header[\s>]/i)
  if (headerIdx !== -1) {
    const block = extractBlock(body, headerIdx, "header")
    if (block) return block
  }

  // 4. <div class="NavBar|Navigation|Header|TopBar|SiteHeader">
  const divMatch = body.match(/<div[^>]*class="[^"]*(?:NavBar|Navigation|Header|TopBar|SiteHeader)[^"]*"/i)
  if (divMatch) {
    const block = extractBlock(body, divMatch.index!, "div")
    if (block) return block
  }

  return null
}

/** Footer: look for <!-- Footer --> or <footer> or <div class="Footer"> */
export function extractFooter(html: string): string | null {
  const body = extractBodyContent(html)

  // 1. Comment marker
  const commentMatch = body.match(/<!--\s*Footer\s*-->\s*/)
  if (commentMatch) {
    const afterComment = body.slice(commentMatch.index! + commentMatch[0].length)
    const tagMatch = afterComment.match(/^<(\w+)[\s>]/)
    if (tagMatch) {
      const block = extractBlock(body, commentMatch.index!, tagMatch[1])
      if (block) return block
    }
  }

  // 2. <footer ...> element
  const footerIdx = body.search(/<footer[\s>]/i)
  if (footerIdx !== -1) {
    const block = extractBlock(body, footerIdx, "footer")
    if (block) return block
  }

  // 3. <div class="Footer|SiteFooter">
  const divMatch = body.match(/<div[^>]*class="[^"]*(?:Footer|SiteFooter)[^"]*"/i)
  if (divMatch) {
    const block = extractBlock(body, divMatch.index!, "div")
    if (block) return block
  }

  return null
}

/**
 * Extract all <style> blocks and <link rel="stylesheet"> from HTML.
 */
export function extractStyles(html: string): string {
  const styles: string[] = []
  let m
  const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi
  while ((m = styleRegex.exec(html)) !== null) styles.push(m[0])
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*\/?>/gi
  while ((m = linkRegex.exec(html)) !== null) styles.push(m[0])
  return styles.join("\n")
}

/**
 * Extract the content between <body> and </body>, or return as-is.
 */
function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (bodyMatch) return bodyMatch[1].trim()

  if (html.match(/^<!DOCTYPE|^<html/i)) {
    const mainMatch = html.match(/<div[^>]*max-width[^>]*>([\s\S]*)<\/div>\s*<\/body>/i)
    if (mainMatch) return mainMatch[1].trim()
  }

  return html
}

/**
 * Compose a full wireframe page from global sections + page content.
 * The page HTML should NOT contain header/footer (they are removed at extraction time).
 */
/**
 * Build a Google Fonts <link> tag for the given font family.
 */
function googleFontLink(font: string): string {
  const family = font.replace(/\s+/g, "+")
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
}

/**
 * Inject wireframe settings (font override) into any wireframe HTML.
 * Works for both composed (with globals) and raw page HTML.
 */
export function injectWireframeFont(html: string, font: string | undefined): string {
  if (!font || font === "Inter") return html // Inter is the default in most wireframes

  const fontLink = googleFontLink(font)
  const fontOverride = `<style>*, *::before, *::after { font-family: "${font}", sans-serif !important; }</style>`

  // Inject into <head> if present
  if (html.includes("</head>")) {
    return html.replace("</head>", `${fontLink}\n${fontOverride}\n</head>`)
  }
  // Otherwise prepend
  return fontLink + "\n" + fontOverride + "\n" + html
}

export function composeWireframe(
  pageHtml: string,
  globalSections: GlobalSection[] | undefined,
  wireframeSettings?: WireframeSettings,
): string {
  const font = wireframeSettings?.font

  if (!globalSections || globalSections.length === 0) {
    return injectWireframeFont(pageHtml, font)
  }

  const header = globalSections.find(s => s.slot === "header")
  const footer = globalSections.find(s => s.slot === "footer")

  if (!header && !footer) {
    return injectWireframeFont(pageHtml, font)
  }

  const originalStyles = extractStyles(pageHtml)
  const bodyContent = extractBodyContent(pageHtml)

  const fontLink = font && font !== "Inter" ? googleFontLink(font) : ""
  const fontOverride = font && font !== "Inter"
    ? `<style>*, *::before, *::after { font-family: "${font}", sans-serif !important; }</style>`
    : ""

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wireframe</title>
${fontLink}
${originalStyles}
${fontOverride}
</head>
<body>
<div style="max-width:1440px;margin:0 auto;">

${header?.html || ""}

<div data-arbo-page-content>${bodyContent}</div>

${footer?.html || ""}

</div>
</body>
</html>`
}
