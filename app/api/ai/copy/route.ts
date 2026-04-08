import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAiRateLimit } from "@/lib/ai-rate-limit"
import { checkCredits, deductCredits, getServerAiKey } from "@/lib/ai-credits"
import type { AiSpeed } from "@/lib/ai"

export const dynamic = "force-dynamic"

const SYSTEM_PROMPT = `Tu es un copywriter UX expert. On te donne le contexte d'un projet web et une section sp\u00e9cifique de page.
G\u00e9n\u00e8re le contenu texte r\u00e9aliste pour cette section.

R\u00e8gles :
- Ton : professionnel, direct, adapt\u00e9 au secteur du projet
- Pas de lorem ipsum, pas de texte g\u00e9n\u00e9rique
- Adapte la longueur au type de section (hero = court et percutant, contenu = d\u00e9velopp\u00e9, cta = une phrase)
- Renvoie UNIQUEMENT le texte, pas de markdown, pas de balises HTML
- S\u00e9pare les \u00e9l\u00e9ments par des sauts de ligne (titre, sous-titre, paragraphe, bouton)
- Pour les sections avec plusieurs items (cards, arguments, t\u00e9moignages), s\u00e9pare chaque item par "---"`

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const {
    apiKey,
    blockLabel,
    blockSkin,
    pageLabel,
    projectName,
    projectDescription,
  } = body as {
    apiKey?: string
    blockLabel?: string
    blockSkin?: string
    pageLabel?: string
    projectName?: string
    projectDescription?: string
  }

  if (!blockLabel || !blockSkin) {
    return NextResponse.json(
      { error: "blockLabel and blockSkin are required" },
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
        { error: "Cr\u00e9dits IA non disponibles sur cette instance." },
        { status: 503 }
      )
    }
    resolvedApiKey = serverKey
  }

  if (!resolvedApiKey) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 })
  }

  // Credits check
  if (useCredits) {
    const credits = checkCredits(payload.sub, speed)
    if (!credits.canUse) {
      return NextResponse.json(
        {
          error: `Cr\u00e9dits IA \u00e9puis\u00e9s (${credits.remaining} restants).`,
        },
        { status: 402 }
      )
    }
  }

  // Rate limit
  const limit = checkAiRateLimit(payload.sub)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Limite atteinte. R\u00e9essaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
      },
      { status: 429 }
    )
  }

  try {
    const client = new Anthropic({ apiKey: resolvedApiKey })

    const userPrompt = `Projet : ${projectName || "Site web"}
${projectDescription ? `Description : ${projectDescription}` : ""}
Page : ${pageLabel || "Page"}
Section : ${blockLabel} (type : ${blockSkin})

G\u00e9n\u00e8re le contenu texte pour cette section.`

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })

    const text =
      response.content[0].type === "text" ? response.content[0].text : ""

    if (useCredits) {
      deductCredits(payload.sub, speed)
    }

    return NextResponse.json({ copy: text.trim() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("AI copy error:", message)

    if (message.includes("401") || message.includes("authentication")) {
      return NextResponse.json(
        { error: "Cl\u00e9 API invalide." },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: `Erreur IA : ${message.slice(0, 120)}` },
      { status: 500 }
    )
  }
}
