import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { z } from "zod"
import { db, getActiveNodes } from "@/lib/db"
import type { DbProject, DbNode } from "@/lib/db"
import { nanoid } from "nanoid"

// ─── Auth helper ────────────────────────────────────────────────────────────

function authenticateToken(req: Request): { valid: boolean; tokenName?: string; projectIds?: string[] } {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return { valid: false }

  const rawToken = auth.slice(7)
  const crypto = require("crypto")
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex")

  const row = db.prepare(
    "SELECT id, name, project_id, scope FROM ai_tokens WHERE token_hash = ? AND revoked_at IS NULL"
  ).get(hash) as { id: string; name: string; project_id: string; scope: string } | undefined

  if (!row) return { valid: false }

  // Update last_used_at
  db.prepare("UPDATE ai_tokens SET last_used_at = ? WHERE id = ?").run(Date.now(), row.id)

  return { valid: true, tokenName: row.name, projectIds: [row.project_id] }
}

// ─── Build MCP Server ───────────────────────────────────────────────────────

function createMcpServer() {
  const server = new McpServer({
    name: "arbo",
    version: "1.0.0",
  })

  // ── Tool: list_projects ──────────────────────────────────────────────────

  server.tool(
    "list_projects",
    "List all projects accessible with this token",
    {},
    async () => {
      const projects = db
        .prepare("SELECT id, slug, name, client, accent, version, created_at FROM projects WHERE archived = 0 ORDER BY created_at DESC")
        .all() as DbProject[]

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(projects.map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            client: p.client,
            accent: p.accent,
            version: p.version,
          })), null, 2)
        }]
      }
    }
  )

  // ── Tool: get_project ────────────────────────────────────────────────────

  server.tool(
    "get_project",
    "Get a project with its full sitemap tree",
    { project_id: z.string().describe("The project ID") },
    async ({ project_id }) => {
      const project = db
        .prepare("SELECT * FROM projects WHERE id = ? AND archived = 0")
        .get(project_id) as DbProject | undefined

      if (!project) {
        return { content: [{ type: "text" as const, text: "Project not found" }], isError: true }
      }

      const nodes = getActiveNodes(project_id)
      const parsed = nodes.map(n => {
        const data = JSON.parse(n.data)
        return {
          id: n.id,
          parentId: n.parent_id,
          position: n.position,
          ...data,
        }
      })

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id: project.id,
            name: project.name,
            client: project.client,
            accent: project.accent,
            version: project.version,
            nodes: parsed,
          }, null, 2)
        }]
      }
    }
  )

  // ── Tool: create_project ─────────────────────────────────────────────────

  server.tool(
    "create_project",
    "Create a new project. Returns the project ID. Add nodes with create_node after.",
    {
      name: z.string().describe("Project name"),
      client: z.string().optional().describe("Client name"),
      accent: z.string().optional().describe("Accent color hex (e.g. #2563EB)"),
    },
    async ({ name, client, accent }) => {
      const projectId = nanoid()
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6)}`
      const now = Date.now()

      db.prepare(
        `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'v1', 'ai', 0, ?, ?)`
      ).run(projectId, slug, name, client || null, accent || "#5E6AD2", now, now)

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ id: projectId, slug, name }, null, 2)
        }]
      }
    }
  )

  // ── Tool: create_node ────────────────────────────────────────────────────

  server.tool(
    "create_node",
    "Add a page to a project's sitemap. Use parent_id to create hierarchy. Supports rich data: zoning blocks (wireframe layout), entry points (traffic sources), CTAs, and tags.",
    {
      project_id: z.string().describe("The project ID"),
      label: z.string().describe("Page name (e.g. 'Accueil', 'Contact')"),
      type: z.string().optional().describe("Page type: home, listing, detail, form, landing, quiz, search, hub, error, legal"),
      priority: z.enum(["primary", "secondary", "utility"]).optional().describe("Page importance"),
      description: z.string().optional().describe("Short page description"),
      parent_id: z.string().optional().nullable().describe("Parent node ID. Null = root page."),
      rationale: z.string().optional().describe("Why this page exists (UX insight)"),
      notes: z.string().optional().describe("Additional notes"),
      cta: z.array(z.string()).optional().describe("Call-to-action button labels (e.g. ['Acheter', 'En savoir plus'])"),
      tags: z.array(z.string()).optional().describe("Tags for categorization (e.g. ['SEO', 'conversion'])"),
      entry_points: z.array(z.object({
        type: z.enum(["google", "direct", "nav", "social", "email", "ads", "qrcode"]),
        label: z.string(),
      })).optional().describe("Traffic entry points for this page"),
      zoning_blocks: z.array(z.object({
        id: z.string().describe("Unique block ID (e.g. 'z1')"),
        label: z.string().describe("Block label (e.g. 'Hero', 'Navigation')"),
        skin: z.string().describe("Block skin: nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots"),
        height: z.number().describe("Visual height in px (e.g. 18 for nav, 64 for hero, 60 for contenu)"),
      })).optional().describe("Wireframe zoning blocks (page layout structure)"),
      zoning_expanded: z.boolean().optional().describe("If true, zoning is shown expanded by default on the canvas"),
    },
    async ({ project_id, label, type, priority, description, parent_id, rationale, notes, cta, tags, entry_points, zoning_blocks, zoning_expanded }) => {
      const nodeId = nanoid()
      const now = Date.now()

      const posRow = db.prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
      ).get(project_id, parent_id || null) as { next_pos: number }

      const nodeData: Record<string, unknown> = {
        label,
        type: type || "detail",
        priority: priority || "secondary",
        description: description || "",
        rationale: rationale || undefined,
        notes: notes || undefined,
      }
      if (cta) nodeData.cta = cta
      if (tags) nodeData.tags = tags
      if (entry_points) nodeData.entryPoints = entry_points
      if (zoning_blocks) {
        nodeData.zoningBlocks = zoning_blocks
        nodeData.zoningExpanded = zoning_expanded ?? false
      }

      db.prepare(
        `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
      ).run(nodeId, project_id, parent_id || null, posRow.next_pos, JSON.stringify(nodeData), now, now)

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ id: nodeId, label, parent_id: parent_id || null }, null, 2)
        }]
      }
    }
  )

  // ── Tool: update_node ────────────────────────────────────────────────────

  server.tool(
    "update_node",
    "Update a page's properties",
    {
      project_id: z.string().describe("The project ID"),
      node_id: z.string().describe("The node ID to update"),
      label: z.string().optional().describe("New page name"),
      type: z.string().optional().describe("New page type"),
      priority: z.enum(["primary", "secondary", "utility"]).optional(),
      description: z.string().optional(),
      rationale: z.string().optional(),
      notes: z.string().optional(),
      parent_id: z.string().optional().nullable().describe("Move to new parent"),
    },
    async ({ project_id, node_id, label, type, priority, description, rationale, notes, parent_id }) => {
      const existing = db.prepare(
        "SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0"
      ).get(node_id, project_id) as DbNode | undefined

      if (!existing) {
        return { content: [{ type: "text" as const, text: "Node not found" }], isError: true }
      }

      const data = JSON.parse(existing.data)
      if (label !== undefined) data.label = label
      if (type !== undefined) data.type = type
      if (priority !== undefined) data.priority = priority
      if (description !== undefined) data.description = description
      if (rationale !== undefined) data.rationale = rationale
      if (notes !== undefined) data.notes = notes

      const now = Date.now()
      const newParent = parent_id !== undefined ? parent_id : existing.parent_id

      db.prepare(
        "UPDATE nodes SET data = ?, parent_id = ?, updated_at = ? WHERE id = ? AND project_id = ?"
      ).run(JSON.stringify(data), newParent, now, node_id, project_id)

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ id: node_id, ...data }, null, 2) }]
      }
    }
  )

  // ── Tool: delete_node ────────────────────────────────────────────────────

  server.tool(
    "delete_node",
    "Remove a page from the sitemap (soft delete, can be restored via version history)",
    {
      project_id: z.string().describe("The project ID"),
      node_id: z.string().describe("The node ID to delete"),
      cascade: z.boolean().optional().describe("If true, also deletes all children. Default: false (children are reparented to grandparent)"),
    },
    async ({ project_id, node_id, cascade }) => {
      const node = db.prepare(
        "SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0"
      ).get(node_id, project_id) as DbNode | undefined

      if (!node) {
        return { content: [{ type: "text" as const, text: "Node not found" }], isError: true }
      }

      const now = Date.now()

      if (cascade) {
        // Archive all descendants recursively
        const archiveDescendants = (parentId: string) => {
          const children = db.prepare(
            "SELECT id FROM nodes WHERE parent_id = ? AND project_id = ? AND archived = 0"
          ).all(parentId, project_id) as { id: string }[]
          for (const child of children) {
            archiveDescendants(child.id)
            db.prepare("UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?").run(now, child.id)
          }
        }
        archiveDescendants(node_id)
      } else {
        // Reparent children to grandparent
        db.prepare(
          "UPDATE nodes SET parent_id = ?, updated_at = ? WHERE parent_id = ? AND project_id = ? AND archived = 0"
        ).run(node.parent_id, now, node_id, project_id)
      }

      db.prepare("UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?").run(now, node_id)

      return {
        content: [{ type: "text" as const, text: `Deleted node ${node_id}${cascade ? " and all children" : ""}` }]
      }
    }
  )

  // ── Tool: bulk_create_nodes ──────────────────────────────────────────────

  server.tool(
    "bulk_create_nodes",
    "Create multiple pages at once from a tree structure. Ideal for generating a full sitemap with zoning, entry points, CTAs and tags.",
    {
      project_id: z.string().describe("The project ID"),
      nodes: z.array(z.object({
        temp_id: z.string().describe("Temporary ID for referencing as parent (e.g. 'home', 'about')"),
        parent_temp_id: z.string().nullable().describe("Temp ID of the parent node. Null = root."),
        label: z.string(),
        type: z.string().optional(),
        priority: z.enum(["primary", "secondary", "utility"]).optional(),
        description: z.string().optional(),
        rationale: z.string().optional(),
        notes: z.string().optional(),
        cta: z.array(z.string()).optional().describe("Call-to-action labels"),
        tags: z.array(z.string()).optional().describe("Tags"),
        entry_points: z.array(z.object({
          type: z.enum(["google", "direct", "nav", "social", "email", "ads", "qrcode"]),
          label: z.string(),
        })).optional().describe("Traffic sources"),
        zoning_blocks: z.array(z.object({
          id: z.string(),
          label: z.string(),
          skin: z.string().describe("nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots"),
          height: z.number(),
        })).optional().describe("Wireframe zoning blocks"),
        zoning_expanded: z.boolean().optional(),
      })).describe("Flat list of nodes with temp_id references for parent-child relationships"),
    },
    async ({ project_id, nodes }) => {
      const project = db.prepare(
        "SELECT id FROM projects WHERE id = ? AND archived = 0"
      ).get(project_id)

      if (!project) {
        return { content: [{ type: "text" as const, text: "Project not found" }], isError: true }
      }

      const now = Date.now()
      const tempToReal = new Map<string, string>()
      const created: { tempId: string; realId: string; label: string }[] = []

      const insertStmt = db.prepare(
        `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
      )

      db.transaction(() => {
        for (const node of nodes) {
          const realId = nanoid()
          tempToReal.set(node.temp_id, realId)

          const parentId = node.parent_temp_id ? (tempToReal.get(node.parent_temp_id) || null) : null

          const posRow = db.prepare(
            "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
          ).get(project_id, parentId) as { next_pos: number }

          const nodeData: Record<string, unknown> = {
            label: node.label,
            type: node.type || "detail",
            priority: node.priority || "secondary",
            description: node.description || "",
            rationale: node.rationale || undefined,
            notes: node.notes || undefined,
          }
          if (node.cta) nodeData.cta = node.cta
          if (node.tags) nodeData.tags = node.tags
          if (node.entry_points) nodeData.entryPoints = node.entry_points
          if (node.zoning_blocks) {
            nodeData.zoningBlocks = node.zoning_blocks
            nodeData.zoningExpanded = node.zoning_expanded ?? false
          }

          insertStmt.run(realId, project_id, parentId, posRow.next_pos, JSON.stringify(nodeData), now, now)
          created.push({ tempId: node.temp_id, realId, label: node.label })
        }
      })()

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            created: created.length,
            nodes: created,
          }, null, 2)
        }]
      }
    }
  )

  return server
}

// ─── Stateless transport per request ────────────────────────────────────────

async function handleMcpRequest(req: Request): Promise<Response> {
  // Auth check
  const auth = authenticateToken(req)
  if (!auth.valid) {
    return new Response(JSON.stringify({ error: "Invalid or missing API token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const server = createMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    return await transport.handleRequest(req)
  } finally {
    await transport.close()
    await server.close()
  }
}

export async function POST(req: Request) {
  return handleMcpRequest(req)
}

export async function GET(req: Request) {
  return handleMcpRequest(req)
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req)
}
