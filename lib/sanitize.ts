import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize plain-text fields (label, description, notes...).
 * Strips all HTML — we want plain text, not rich text in these fields.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return ''
  // Strip all tags, decode entities, trim
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

/**
 * Sanitize an array of strings (cta, tags).
 */
export function sanitizeTextArray(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.map(sanitizeText).filter(Boolean)
}

/**
 * Sanitize custom zoning HTML.
 * Allows safe HTML/CSS subset — strips scripts, event handlers, external resources.
 * The output is STILL rendered inside a sandboxed iframe, so this is defense-in-depth.
 */
export function sanitizeZoningHtml(html: unknown): string {
  if (typeof html !== 'string') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'section', 'header', 'footer', 'main', 'nav', 'aside',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'a', 'ul', 'ol', 'li',
      'img', 'figure', 'figcaption',
      'button', 'input', 'label', 'form',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'strong', 'em', 'small', 'br', 'hr',
      'style',  // allow <style> blocks for CSS
    ],
    ALLOWED_ATTR: ['class', 'id', 'style', 'href', 'src', 'alt', 'type', 'placeholder'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    FORCE_BODY: false,
  })
}

export function sanitizeZoningCss(css: unknown): string {
  if (typeof css !== 'string') return ''
  // Remove any @import, url() with external domains, and expression()
  return css
    .replace(/@import\s+[^;]+;/gi, '')
    .replace(/url\s*\(\s*['"]?https?:\/\/[^)]+\)/gi, '')
    .replace(/expression\s*\(/gi, '')
    .slice(0, 10_000) // hard cap 10KB
}
