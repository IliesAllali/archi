import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAiRateLimit } from "@/lib/ai-rate-limit"
import { checkCredits, deductCredits, getServerAiKey } from "@/lib/ai-credits"
import type { AiSpeed } from "@/lib/ai"
import { buildUserContent } from "@/lib/ai"

export const dynamic = "force-dynamic"

const SYSTEM_PROMPT = `Tu es un expert UX/UI wireframe. Tu g\u00e9n\u00e8res des wireframes RESPONSIFS lo-fi en HTML + CSS.

L'utilisateur peut joindre des fichiers (PDF brief, screenshots, maquettes de r\u00e9f\u00e9rence). Utilise-les comme contexte visuel mais r\u00e9ponds TOUJOURS en HTML valide. Ne d\u00e9cris jamais les fichiers joints.

## R\u00e8gles
- HTML + un bloc <style> dans le <head>. Pas de JavaScript.
- Wireframe lo-fi : gris uniquement (#F4F4F5 #E5E7EB #D1D5DB #9CA3AF #6B7280 #374151)
- Texte = vrais mots r\u00e9alistes (PAS de lorem ipsum)
- Layout : flexbox uniquement
- Chaque section = un <div> avec commentaire <!-- Nom-Section -->
- Classes PascalCase pour nommage Figma (class="HeroSection")
- Le HTML doit \u00eatre complet (<!DOCTYPE html>)

## Ic\u00f4nes — Bootstrap Icons (CSS uniquement, pas de JS)
NE G\u00c9N\u00c8RE JAMAIS de SVG inline. Utilise Bootstrap Icons via CDN CSS.
Ajoute ce link dans le <head> :
\`\`\`html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
\`\`\`

Syntaxe : \`<i class="bi bi-nom"></i>\`
Ic\u00f4nes courantes :
- Menu : bi-list | Fermer : bi-x-lg | Recherche : bi-search
- Fl\u00e8ches : bi-arrow-right, bi-arrow-left, bi-chevron-down
- Utilisateur : bi-person | Coeur : bi-heart | \u00c9toile : bi-star-fill
- Check : bi-check-lg | Panier : bi-cart | Email : bi-envelope
- T\u00e9l\u00e9phone : bi-telephone | Play : bi-play-fill | Image : bi-image
- Plus : bi-plus-lg | Settings : bi-gear | Globe : bi-globe
- R\u00e9seaux : bi-twitter, bi-linkedin, bi-instagram, bi-facebook
- Localisation : bi-geo-alt | Horloge : bi-clock | T\u00e9l\u00e9charger : bi-download

Style : \`.bi { font-size:20px; color:#6B7280 }\`
Image placeholder : div gris #E5E7EB avec \`<i class="bi bi-image" style="font-size:32px"></i>\` centr\u00e9

## CSS — Classes r\u00e9utilisables
D\u00e9finis des classes utilitaires dans le <style> au lieu de r\u00e9p\u00e9ter des styles inline.
Le HTML doit \u00eatre l\u00e9ger : utilise les classes, \u00e9vite les attributs style= r\u00e9p\u00e9titifs.

Exemple de classes \u00e0 d\u00e9finir :
\`\`\`css
.Wrap { max-width:1440px; margin:0 auto }
.Section { padding:60px 80px }
.Row { display:flex; gap:24px; align-items:center }
.Col { display:flex; flex-direction:column; gap:16px }
.Grid2 { display:flex; gap:24px; flex-wrap:wrap }
.Grid2 > * { flex:1; min-width:280px }
.Grid3 { display:flex; gap:24px; flex-wrap:wrap }
.Grid3 > * { flex:1; min-width:200px }
.Btn { display:inline-flex; align-items:center; gap:8px; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; border:none }
.BtnPrimary { background:#9CA3AF; color:#fff }
.BtnOutline { background:transparent; border:1px solid #D1D5DB; color:#374151 }
.ImgPlaceholder { background:#E5E7EB; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:32px }
.TextMuted { color:#9CA3AF }
.TextSmall { font-size:14px }
.HideOnMobile { } /* masqu\u00e9 en mobile */
.ShowOnMobile { display:none } /* affich\u00e9 en mobile */
\`\`\`

## Responsive — media queries
\`\`\`css
@media (max-width:768px) {
  .Section { padding:32px 24px }
  .Grid3 > * { min-width:45% }
  .HideOnMobile { display:none }
  .ShowOnMobile { display:flex }
}
@media (max-width:480px) {
  .Section { padding:24px 16px }
  .Grid2 > *, .Grid3 > * { min-width:100% }
  .Btn { width:100%; justify-content:center; min-height:44px }
  .Row { flex-direction:column }
}
\`\`\`

Nav desktop = liens texte. Nav tablette/mobile = logo + \u2630. Utilise .HideOnMobile/.ShowOnMobile pour switcher.

## Qualit\u00e9
- Proportions r\u00e9alistes (hero 400-600px, nav 64-80px, footer 200-300px)
- Hi\u00e9rarchie visuelle claire
- Le responsive doit r\u00e9organiser le layout, pas juste r\u00e9tr\u00e9cir

Renvoie UNIQUEMENT le HTML complet, sans explication, sans markdown, sans \`\`\`.`

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const {
    apiKey,
    pageLabel,
    pageType,
    projectName,
    projectClient,
    description,
    siteContext,
    blocks,
    currentHtml,
    editPrompt,
  } = body as {
    apiKey?: string
    pageLabel?: string
    pageType?: string
    projectName?: string
    projectClient?: string
    description?: string
    siteContext?: string
    blocks?: { label: string; skin: string; height: number }[]
    currentHtml?: string
    editPrompt?: string
    fidelity?: string
    font?: string
  }

  const fidelity = (body as { fidelity?: string }).fidelity || "lo-fi"
  const font = (body as { font?: string }).font || "Inter"
  const attachments = (body as { attachments?: { name: string; type: string; base64: string }[] }).attachments

  const hasGlobalHeader = body.hasGlobalHeader === true
  const hasGlobalFooter = body.hasGlobalFooter === true

  if (!pageLabel) {
    return NextResponse.json(
      { error: "pageLabel is required" },
      { status: 400 }
    )
  }

  // Auth
  const { verifyAccessToken } = await import("@/lib/auth")
  const token =
    req.cookies.get("arbo_access")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const payload = await verifyAccessToken(token)
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Determine API key
  const useCredits = apiKey === "arbo_credits"
  let resolvedApiKey = apiKey || ""
  const speed: AiSpeed = "fast"

  if (useCredits) {
    const serverKey = getServerAiKey()
    if (!serverKey) {
      return NextResponse.json(
        { error: "Cr\u00e9dits IA non disponibles." },
        { status: 503 }
      )
    }
    resolvedApiKey = serverKey
  }

  if (!resolvedApiKey) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 })
  }

  // Credits
  if (useCredits) {
    const credits = checkCredits(payload.sub, speed)
    if (!credits.canUse) {
      return NextResponse.json(
        { error: `Cr\u00e9dits \u00e9puis\u00e9s (${credits.remaining} restants).` },
        { status: 402 }
      )
    }
  }

  // Rate limit
  const limit = checkAiRateLimit(payload.sub)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Limite atteinte. R\u00e9essaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} min.` },
      { status: 429 }
    )
  }

  // Build user prompt
  const hasBlocks = blocks && blocks.length > 0
  const blockList = hasBlocks
    ? blocks.map((b: { label: string; skin: string }, i: number) => `${i + 1}. ${b.label} (type: ${b.skin})`).join("\n")
    : ""

  const isEdit = !!currentHtml && !!editPrompt

  const editSystemAddendum = `

IMPORTANT MODE \u00c9DITION :
Tu re\u00e7ois un wireframe HTML existant et une demande de modification.
Tu dois retourner un JSON avec des op\u00e9rations search/replace CIBL\u00c9ES.
NE R\u00c9\u00c9CRIS PAS tout le HTML. Modifie uniquement ce qui est demand\u00e9.

Format de r\u00e9ponse (JSON, pas de markdown) :
{"ops":[
  {"search":"<div class=\\"HeroSection\\"","replace":"<div class=\\"HeroSection\\" style=\\"...nouveau style...\\""},
  {"search":"Texte original","replace":"Nouveau texte"},
  {"after":"<!-- Navigation -->\\n</div>","insert":"\\n\\n<!-- Testimonials -->\\n<div class=\\"TestimonialsSection\\" style=\\"...\\">..</div>"}
]}

Types d'op\u00e9rations :
- search/replace : remplace une cha\u00eene exacte par une autre
- after/insert : ins\u00e8re du HTML apr\u00e8s une cha\u00eene trouv\u00e9e (pour ajouter des sections)
- before/insert : ins\u00e8re du HTML avant une cha\u00eene trouv\u00e9e

R\u00e8gles :
- Le "search" doit \u00eatre UNIQUE dans le HTML (assez long pour \u00eatre sp\u00e9cifique)
- Garde le m\u00eame style lo-fi (gris, flexbox, inline CSS)
- Renvoie UNIQUEMENT le JSON, rien d'autre`

  const userPrompt = isEdit
    ? `Wireframe HTML actuel de la page "${pageLabel}" :

\`\`\`html
${currentHtml!.slice(0, 15000)}
\`\`\`

Demande : ${editPrompt}`
    : editPrompt && !currentHtml
    ? `G\u00e9n\u00e8re un wireframe HTML ${fidelity} complet pour cette page en suivant ces instructions :

Projet : ${projectName || "Site web"}${projectClient ? ` (client : ${projectClient})` : ""}
Page : ${pageLabel}
Type : ${pageType || "detail"}
${description ? `\nDescription :\n${description}\n` : ""}
${siteContext ? `\nAutres pages du site :\n${siteContext}\n` : ""}

Instructions : ${editPrompt}

${hasGlobalHeader ? "\u26d4 INTERDIT : pas de header/NavBar. Le header est g\u00e9r\u00e9 s\u00e9par\u00e9ment. Commence par le contenu principal." : ""}${hasGlobalFooter ? " \u26d4 INTERDIT : pas de footer. Le footer est g\u00e9r\u00e9 s\u00e9par\u00e9ment." : ""}`
    : `G\u00e9n\u00e8re un wireframe HTML ${fidelity} complet pour cette page :

Projet : ${projectName || "Site web"}${projectClient ? ` (client : ${projectClient})` : ""}
Page : ${pageLabel}
Type : ${pageType || "detail"}
${description ? `\nDescription de la page :\n${description}\n` : ""}
${siteContext ? `\nAutres pages du site (pour coh\u00e9rence) :\n${siteContext}\n` : ""}
${hasBlocks ? `Sections de la page (dans cet ordre) :\n${blockList}` : "Invente les sections adapt\u00e9es au type de page et au contexte du projet. Inclus au minimum : navigation, hero/header, contenu principal, CTA, footer."}
Le contenu texte doit \u00eatre r\u00e9aliste et coh\u00e9rent avec le projet "${projectName}". Utilise de vrais titres, descriptions et CTAs adapt\u00e9s au secteur.
${hasGlobalHeader ? "\n\u26d4 INTERDIT : Ne g\u00e9n\u00e8re AUCUNE section Navigation, NavBar, Header ou TopBar. Le header est g\u00e9r\u00e9 s\u00e9par\u00e9ment. Commence directement par le contenu principal (Hero, etc.)." : ""}${hasGlobalFooter ? "\n\u26d4 INTERDIT : Ne g\u00e9n\u00e8re AUCUNE section Footer ou SiteFooter. Le footer est g\u00e9r\u00e9 s\u00e9par\u00e9ment. Termine par la derni\u00e8re section de contenu." : ""}`

  // Fidelity-specific instructions
  const fidelityAddendum = fidelity === "mid-fi"
    ? `\n\nNIVEAU MID-FI :
- Utilise des couleurs neutres mais variees (slate, zinc, stone) au lieu du gris uniquement
- Typographie plus riche : tailles variees, line-height realiste, font-weight 300-700
- Composants plus detailles : boutons avec hover state, inputs avec placeholder, badges, pills
- Shadows subtiles (box-shadow: 0 1px 3px rgba(0,0,0,0.1))
- Bordures arrondies plus prononcees (border-radius: 12px)
- Espacement plus raffine, padding realiste
- Les images placeholder restent grises mais avec des proportions realistes`
    : fidelity === "hi-fi"
    ? `\n\nNIVEAU HI-FI :
- Utilise de VRAIES couleurs (bleu #2563EB pour les CTAs, gradients subtils, couleurs semantiques)
- Typographie complete : poids multiples, letter-spacing, text-transform
- Composants haute fidelite : boutons avec ombres et gradients, avatars, ratings (etoiles), progress bars
- Effets visuels : box-shadow prononcees, hover states, transitions CSS
- Images placeholder = div avec background gradient et icone centree (pas juste gris plat)
- Border-radius varies selon le composant (4px inputs, 12px cards, 24px modales)
- Utilise des couleurs de fond differentes par section pour creer du rythme visuel
- Badges colores, tags, statuts visuels
- RESTE un wireframe (pas de vraies images/photos), mais visuellement proche du rendu final`
    : "" // lo-fi = default prompt is already lo-fi

  const fontAddendum = font && font !== "Inter"
    ? `\n\nPOLICE : Utilise la police "${font}" via Google Fonts. Ajoute ce link dans le <head> :
<link href="https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
Et applique font-family: "${font}", sans-serif au body.`
    : ""

  // Stream response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = new Anthropic({ apiKey: resolvedApiKey })
        const systemPrompt = isEdit
          ? SYSTEM_PROMPT + fidelityAddendum + fontAddendum + editSystemAddendum
          : SYSTEM_PROMPT + fidelityAddendum + fontAddendum

        if (isEdit) {
          // ─── Edit mode: collect full response, parse ops, apply, return result ───
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "chunk", text: "" })}\n\n`
            )
          )

          const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: "user" as const, content: buildUserContent(userPrompt, attachments) }],
          })

          const rawText = response.content[0].type === "text" ? response.content[0].text : ""

          // Parse ops JSON (strip markdown fences if present)
          const jsonStr = rawText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim()
          let resultHtml = currentHtml!

          try {
            const parsed = JSON.parse(jsonStr)
            const ops = parsed.ops || parsed
            if (Array.isArray(ops)) {
              for (const op of ops) {
                if (op.search && op.replace !== undefined) {
                  resultHtml = resultHtml.replace(op.search, op.replace)
                } else if (op.after && op.insert) {
                  const idx = resultHtml.indexOf(op.after)
                  if (idx !== -1) {
                    resultHtml = resultHtml.slice(0, idx + op.after.length) + op.insert + resultHtml.slice(idx + op.after.length)
                  }
                } else if (op.before && op.insert) {
                  const idx = resultHtml.indexOf(op.before)
                  if (idx !== -1) {
                    resultHtml = resultHtml.slice(0, idx) + op.insert + resultHtml.slice(idx)
                  }
                }
              }
            }
          } catch {
            // If JSON parsing fails, the AI might have returned full HTML instead
            if (rawText.includes("<!DOCTYPE") || rawText.includes("<html") || rawText.includes("<body")) {
              resultHtml = rawText
            }
          }

          // Send the final result as a single chunk
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "chunk", text: resultHtml })}\n\n`
            )
          )
        } else {
          // ─── Generate mode: stream HTML chunks ───
          const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            system: systemPrompt,
            messages: [{ role: "user" as const, content: buildUserContent(userPrompt, attachments) }],
            stream: true,
          })

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: "chunk", text: event.delta.text })}\n\n`
                )
              )
            }
          }
        }

        if (useCredits) {
          deductCredits(payload.sub, speed)
        }

        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: "done" })}\n\n`
          )
        )
      } catch (err: unknown) {
        const raw = err instanceof Error ? err.message : String(err)
        console.error("AI wireframe error:", raw)
        let userMessage = raw.slice(0, 200)
        if (raw.includes("overloaded") || raw.includes("Overloaded") || raw.includes("529")) {
          userMessage = "L\u2019IA est temporairement surcharg\u00e9e. R\u00e9essaie dans 1-2 minutes."
        } else if (raw.includes("rate_limit") || raw.includes("429")) {
          userMessage = "Trop de requ\u00eates. Attends quelques instants avant de r\u00e9essayer."
        } else if (raw.includes("authentication") || raw.includes("401") || raw.includes("invalid_api_key")) {
          userMessage = "Cl\u00e9 API invalide. V\u00e9rifie ta cl\u00e9 dans les param\u00e8tres."
        } else if (raw.includes("insufficient") || raw.includes("billing")) {
          userMessage = "Cr\u00e9dits API \u00e9puis\u00e9s. V\u00e9rifie ton compte Anthropic."
        }
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: "error", error: userMessage })}\n\n`
          )
        )
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
