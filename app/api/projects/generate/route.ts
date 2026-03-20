import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface GeneratedNode {
  id: string
  label: string
  type: string
  priority: "primary" | "secondary" | "utility"
  description: string
  children: GeneratedNode[]
}

interface GeneratedProject {
  name: string
  client: string
  accent: string
  nodes: GeneratedNode[]
}

const SYSTEM_PROMPT = `Tu es un expert en architecture de sites web et UX design.

L'utilisateur te donne un brief pour un site web. Tu dois g\u00e9n\u00e9rer une arborescence compl\u00e8te du site.

R\u00e8gles :
- R\u00e9ponds UNIQUEMENT en JSON valide, sans commentaires, sans markdown
- Chaque page a : id (slug), label (nom affich\u00e9), type, priority, description (1 phrase), children (sous-pages)
- Types disponibles : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priorities : primary (pages cl\u00e9s), secondary (pages support), utility (CGU, 404...)
- L'arbre doit avoir UNE racine (la homepage)
- G\u00e9n\u00e8re entre 8 et 25 pages selon la complexit\u00e9 du projet
- Choisis un accent color hex qui correspond \u00e0 l'univers du projet
- Le champ "client" = le nom du client ou de l'entreprise

Format de sortie :
{
  "name": "Nom du projet",
  "client": "Nom du client",
  "accent": "#hex",
  "nodes": [
    {
      "id": "home",
      "label": "Accueil",
      "type": "home",
      "priority": "primary",
      "description": "...",
      "children": [
        { "id": "...", "label": "...", ... , "children": [] }
      ]
    }
  ]
}`

/**
 * POST /api/projects/generate
 * Takes a brief, calls Claude to generate a sitemap, creates the project in DB.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI non configur\u00e9e (cl\u00e9 API manquante)" }, { status: 503 })
  }

  const { brief } = await req.json().catch(() => ({ brief: "" }))
  if (!brief || brief.length < 10) {
    return NextResponse.json({ error: "Brief trop court (10 caract\u00e8res minimum)" }, { status: 400 })
  }

  // Call Claude API
  let generated: GeneratedProject
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: brief }
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Claude API error:", err)
      return NextResponse.json({ error: "Erreur lors de la g\u00e9n\u00e9ration IA" }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ""

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("No JSON in Claude response:", text)
      return NextResponse.json({ error: "R\u00e9ponse IA invalide" }, { status: 502 })
    }

    generated = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error("AI generation failed:", err)
    return NextResponse.json({ error: "Erreur lors de la g\u00e9n\u00e9ration IA" }, { status: 502 })
  }

  // Create project in DB
  const projectId = nanoid()
  const slug = `${generated.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6)}`
  const now = Date.now()
  const ownerId = session.sub

  db.prepare(
    `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'v1', ?, 0, ?, ?)`
  ).run(projectId, slug, generated.name, generated.client || "", generated.accent || "#5E6AD2", ownerId, now, now)

  // Add owner as member
  db.prepare(
    "INSERT INTO project_members (project_id, user_id, role, added_at) VALUES (?, ?, 'owner', ?)"
  ).run(projectId, ownerId, now)

  // Flatten nodes tree and insert into DB
  const insertNode = db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  )

  function insertNodesRecursive(nodes: GeneratedNode[], parentId: string | null) {
    nodes.forEach((node, index) => {
      const nodeId = nanoid()
      const data = JSON.stringify({
        label: node.label,
        type: node.type || "detail",
        priority: node.priority || "secondary",
        description: node.description || "",
      })
      insertNode.run(nodeId, projectId, parentId, index, data, now, now)

      if (node.children && node.children.length > 0) {
        insertNodesRecursive(node.children, nodeId)
      }
    })
  }

  db.transaction(() => {
    insertNodesRecursive(generated.nodes, null)
  })()

  return NextResponse.json({
    id: projectId,
    slug,
    name: generated.name,
    client: generated.client,
    accent: generated.accent,
    nodeCount: countNodes(generated.nodes),
  }, { status: 201 })
}

function countNodes(nodes: GeneratedNode[]): number {
  let count = 0
  for (const n of nodes) {
    count += 1
    if (n.children) count += countNodes(n.children)
  }
  return count
}
