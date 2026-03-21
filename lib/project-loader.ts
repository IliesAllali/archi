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
  return {
    id:      proj.id,
    slug:    proj.slug,
    name:    proj.name,
    client:  proj.client ?? '',
    version: proj.version,
    date:    new Date(proj.created_at).toISOString().split('T')[0],
    accent:  proj.accent,
    nodes:   nodes.map((n) => dbNodeToSiteNode(n, childrenMap)),
    ownerId: proj.owner_id,
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
    db.prepare(
      `UPDATE projects SET name = ?, client = ?, accent = ?, version = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      project.name ?? '',
      project.client ?? null,
      project.accent ?? '#F76B15',
      project.version ?? 'v1',
      now,
      project.id
    )
  }
  // Note: full node sync not implemented here — use the nodes API for that
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
