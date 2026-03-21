/**
 * Migrate existing JSON project files → SQLite database.
 * Idempotent — skips projects already in the DB.
 * Run with: npm run migrate
 *
 * What it does:
 * 1. Reads all *.json files from /data/projects/
 * 2. Creates a default admin user if none exists
 * 3. Inserts each project + its nodes into SQLite
 * 4. Verifies node count before/after
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { nanoid } from 'nanoid'

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'arbo.db')
const JSON_DIR = path.join(process.cwd(), 'data', 'projects')

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found. Run `npm run db:init` first.')
  process.exit(1)
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const adminEmail = process.env.ADMIN_EMAIL || 'admin@arbo.app'
const now = Date.now()

// ─── 1. Ensure admin user exists ─────────────────────────────────────────────

let adminUser = db.prepare('SELECT * FROM users WHERE role_global = ?').get('admin') as any

if (!adminUser) {
  // bcrypt hash of 'arbo2026' — change password after first login
  const { hashSync } = require('bcryptjs')
  const passwordHash = hashSync(process.env.ADMIN_PASSWORD || 'arbo2026', 12)
  const adminId = nanoid()
  db.prepare(
    `INSERT INTO users (id, email, email_verified, password_hash, name, color, role_global, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?, ?, 'admin', ?, ?)`
  ).run(adminId, adminEmail, passwordHash, 'Patch', '#F76B15', now, now)
  adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId) as any
  console.log(`✅ Admin user created: ${adminEmail}`)
} else {
  console.log(`→  Admin user already exists: ${adminUser.email}`)
}

// ─── 2. Migrate JSON project files ───────────────────────────────────────────

if (!fs.existsSync(JSON_DIR)) {
  console.log('→  No JSON projects directory found, nothing to migrate.')
  db.close()
  process.exit(0)
}

const jsonFiles = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'))

if (jsonFiles.length === 0) {
  console.log('→  No JSON files found, nothing to migrate.')
  db.close()
  process.exit(0)
}

for (const file of jsonFiles) {
  const filePath = path.join(JSON_DIR, file)
  const raw = fs.readFileSync(filePath, 'utf-8')
  let project: any

  try {
    project = JSON.parse(raw)
  } catch {
    console.warn(`⚠️  Skipping ${file} — invalid JSON`)
    continue
  }

  const projectSlug = project.id || path.basename(file, '.json')

  // Skip if already migrated
  const existing = db.prepare('SELECT id FROM projects WHERE slug = ?').get(projectSlug)
  if (existing) {
    console.log(`→  Project "${projectSlug}" already in DB, skipping`)
    continue
  }

  const projectId = nanoid()
  const projectCreatedAt = project.date ? new Date(project.date).getTime() : now

  console.log(`→  Migrating project: ${projectSlug} (${project.nodes?.length || 0} nodes)`)

  // ─── Insert project ──────────────────────────────────────────────────────

  db.prepare(
    `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    projectId,
    projectSlug,
    project.name || projectSlug,
    project.client || null,
    project.accent || '#F76B15',
    project.version || 'v1',
    adminUser.id,
    projectCreatedAt,
    projectCreatedAt
  )

  // Add owner to project_members
  db.prepare(
    `INSERT INTO project_members (project_id, user_id, role, added_at) VALUES (?, ?, 'owner', ?)`
  ).run(projectId, adminUser.id, now)

  // ─── Insert nodes ────────────────────────────────────────────────────────

  const nodes: any[] = project.nodes || []
  const nodeIdMap = new Map<string, string>() // old JSON id → new DB id

  // First pass: create new IDs for all nodes
  for (const node of nodes) {
    nodeIdMap.set(node.id, nanoid())
  }

  // Build parent lookup from children arrays (JSON format uses children arrays)
  const parentMap = new Map<string, string>() // nodeId → parentId
  for (const node of nodes) {
    for (const childId of node.children || []) {
      parentMap.set(childId, node.id)
    }
  }

  // Sort nodes topologically — parents before children
  function topoSort(nodeList: any[]): any[] {
    const nodeById = new Map(nodeList.map((n) => [n.id, n]))
    const sorted: any[] = []
    const visited = new Set<string>()

    function visit(nodeId: string) {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      const parentId = parentMap.get(nodeId)
      if (parentId) visit(parentId)
      const node = nodeById.get(nodeId)
      if (node) sorted.push(node)
    }

    for (const n of nodeList) visit(n.id)
    return sorted
  }

  const sortedNodes = topoSort(nodes)

  // Second pass: insert nodes with correct parent_id and position
  const insertNode = db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  )

  // Track position per parent
  const positionTracker = new Map<string | null, number>()

  const insertAll = db.transaction(() => {
    for (const node of sortedNodes) {
      const newId = nodeIdMap.get(node.id)!
      const oldParentId = parentMap.get(node.id) || null
      const newParentId = oldParentId ? (nodeIdMap.get(oldParentId) ?? null) : null

      const posKey = newParentId ?? '__root__'
      const pos = positionTracker.get(posKey) ?? 0
      positionTracker.set(posKey, pos + 1)

      // Build NodeData from the JSON node (strip children — that's now in DB structure)
      const nodeData = {
        label:       node.label,
        type:        node.type,
        priority:    node.priority,
        description: node.description,
        notes:       node.notes,
        rationale:   node.rationale,
        cta:         node.cta,
        tags:        node.tags,
        group:       node.group,
        entryPoints: node.entryPoints,
        links:       node.links?.map((lid: string) => nodeIdMap.get(lid) ?? lid),
        estimate:    node.estimate,
        zoning:      node.zoning,
      }

      insertNode.run(
        newId,
        projectId,
        newParentId,
        pos,
        JSON.stringify(nodeData),
        projectCreatedAt,
        projectCreatedAt
      )
    }
  })

  insertAll()

  // ─── Verify ──────────────────────────────────────────────────────────────

  const migratedCount = (
    db.prepare('SELECT COUNT(*) as c FROM nodes WHERE project_id = ?').get(projectId) as any
  ).c

  if (migratedCount !== nodes.length) {
    console.error(
      `❌ Node count mismatch for "${projectSlug}": expected ${nodes.length}, got ${migratedCount}`
    )
  } else {
    console.log(`✅ Project "${projectSlug}" migrated — ${migratedCount} nodes`)
  }
}

db.close()
console.log('\n✅ Migration complete')
console.log(`   Admin login: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'arbo2026'}`)
console.log('   ⚠️  Change the admin password after first login!')
