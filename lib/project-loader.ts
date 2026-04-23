/**
 * Project loader — SQLite implementation.
 * Replaces the old JSON file-based loader.
 * API is backwards-compatible with existing callers.
 */

import { db, getActiveNodes } from './db'
import type { DbProject, DbNode } from './db'
import type { Project, SiteNode } from './types'

// ─── Converters ───────────────────────────────────────────────────────────────

function dbNodeToSiteNode(row: DbNode, childrenMap: Map<string, string[]>): SiteNode {
  const data = JSON.parse(row.data)
  return {
    ...data,
    id:       row.id,
    children: childrenMap.get(row.id) ?? [],
    position: row.position,
  }
}

function buildChildrenMap(rows: DbNode[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const row of rows) {
    if (row.parent_id) {
      if (!map.has(row.parent_id)) map.set(row.parent_id, [])
      map.get(row.parent_id)!.push(row.id)
    }
  }
  return map
}

function dbProjectToProject(proj: DbProject, nodes: DbNode[]): Project {
  const childrenMap = buildChildrenMap(nodes)
  let globalSections: import("@/lib/types").GlobalSection[] | undefined
  try {
    if (proj.global_sections) globalSections = JSON.parse(proj.global_sections)
  } catch { /* invalid JSON, ignore */ }
  let wireframeSettings: import("@/lib/types").WireframeSettings | undefined
  try {
    if (proj.wireframe_settings) wireframeSettings = JSON.parse(proj.wireframe_settings)
  } catch { /* invalid JSON, ignore */ }
  const mode = (proj.mode === 'app' ? 'app' : 'website') as import("@/lib/types").ProjectMode
  return {
    id:          proj.id,
    slug:        proj.slug,
    name:        proj.name,
    client:      proj.client ?? '',
    version:     proj.version,
    date:        new Date(proj.created_at).toISOString().split('T')[0],
    accent:      proj.accent,
    nodes:       nodes.map((n) => dbNodeToSiteNode(n, childrenMap)),
    ownerId:     proj.owner_id,
    workspaceId: proj.workspace_id ?? null,
    updatedAt:   proj.updated_at,
    globalSections,
    wireframeSettings,
    mode,
    context:     proj.context ?? '',
  }
}

// ─── Public API (backwards compatible) ───────────────────────────────────────

export function getAllProjects(): Project[] {
  const rows = db
    .prepare('SELECT * FROM projects WHERE archived = 0 ORDER BY created_at DESC')
    .all() as DbProject[]

  return rows.map((proj) => {
    const nodes = getActiveNodes(proj.id)
    return dbProjectToProject(proj, nodes)
  })
}

export function getProjectsForUser(userId: string): Project[] {
  // Include projects where the user is:
  // - the owner
  // - a direct project member (invited to a single project)
  // - a workspace member (invited to a workspace → sees all its projects)
  const rows = db.prepare(`
    SELECT DISTINCT p.* FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    LEFT JOIN workspace_members wm ON wm.workspace_id = p.workspace_id AND wm.user_id = ?
    WHERE p.archived = 0
      AND (p.owner_id = ? OR pm.user_id IS NOT NULL OR wm.user_id IS NOT NULL)
    ORDER BY p.updated_at DESC
  `).all(userId, userId, userId) as DbProject[]

  return rows.map((proj) => {
    const nodes = getActiveNodes(proj.id)
    return dbProjectToProject(proj, nodes)
  })
}

export function getProject(idOrSlug: string): Project | null {
  const proj = db
    .prepare('SELECT * FROM projects WHERE (id = ? OR slug = ?) AND archived = 0')
    .get(idOrSlug, idOrSlug) as DbProject | undefined

  if (!proj) return null
  const nodes = getActiveNodes(proj.id)
  return dbProjectToProject(proj, nodes)
}

export function getDemoProject(): Project | null {
  return getProjectBySlug('demo-ecommerce')
}

export function getProjectBySlug(slug: string): Project | null {
  const proj = db
    .prepare('SELECT * FROM projects WHERE slug = ? AND archived = 0')
    .get(slug) as DbProject | undefined

  if (!proj) return null
  const nodes = getActiveNodes(proj.id)
  return dbProjectToProject(proj, nodes)
}

export function saveProject(project: Partial<Project> & { id: string }): void {
  const now = Date.now()
  const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(project.id)

  if (existing) {
    const mode = project.mode === 'app' ? 'app' : (project.mode === 'website' ? 'website' : null)
    db.prepare(
      `UPDATE projects SET name = ?, client = ?, accent = ?, version = ?, global_sections = ?, wireframe_settings = ?, mode = COALESCE(?, mode), context = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      project.name ?? '',
      project.client ?? null,
      project.accent ?? '#F76B15',
      project.version ?? 'v1',
      project.globalSections ? JSON.stringify(project.globalSections) : null,
      project.wireframeSettings ? JSON.stringify(project.wireframeSettings) : null,
      mode,
      typeof project.context === 'string' ? project.context : null,
      now,
      project.id
    )
  }
  // Note: full node sync not implemented here — use the nodes API for that
}

/**
 * Append AI-learned memory items to the project context.
 * Keeps the total under 8000 chars by dropping oldest lines when the cap is exceeded.
 */
export function appendProjectContext(projectId: string, items: string[]): void {
  if (!items.length) return
  const row = db.prepare('SELECT context FROM projects WHERE id = ?').get(projectId) as { context: string | null } | undefined
  if (!row) return

  const existing = (row.context || '').trim()
  const additions = items
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.startsWith('- ') ? s : `- ${s}`)
    .join('\n')
  if (!additions) return

  let combined = existing ? `${existing}\n${additions}` : additions

  // Cap at 8000 chars; drop oldest lines if too long
  while (combined.length > 8000) {
    const nl = combined.indexOf('\n')
    if (nl === -1) { combined = combined.slice(-8000); break }
    combined = combined.slice(nl + 1)
  }

  db.prepare('UPDATE projects SET context = ?, updated_at = ? WHERE id = ?')
    .run(combined, Date.now(), projectId)
}

export function deleteProject(id: string): boolean {
  const result = db
    .prepare('UPDATE projects SET archived = 1, updated_at = ? WHERE id = ?')
    .run(Date.now(), id)
  return result.changes > 0
}

// ─── Node helpers ─────────────────────────────────────────────────────────────

export function getNode(projectId: string, nodeId: string): SiteNode | null {
  const row = db
    .prepare('SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0')
    .get(nodeId, projectId) as DbNode | undefined

  if (!row) return null
  const allNodes = getActiveNodes(projectId)
  const childrenMap = buildChildrenMap(allNodes)
  return dbNodeToSiteNode(row, childrenMap)
}

export function getProjectNodes(projectId: string): SiteNode[] {
  const nodes = getActiveNodes(projectId)
  const childrenMap = buildChildrenMap(nodes)
  return nodes.map((n) => dbNodeToSiteNode(n, childrenMap))
}
