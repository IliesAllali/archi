import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'arbo.db')

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Singleton — reuse the same connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _db: Database.Database | undefined
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH)
  // WAL mode — better concurrent read performance, safer writes
  db.pragma('journal_mode = WAL')

  // Run migrations with FK disabled (parent tables may not exist yet)
  db.pragma('foreign_keys = OFF')

  try {
    // Ensure user_api_keys table exists (auto-migration)
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider   TEXT NOT NULL,
        key_hash   TEXT NOT NULL,
        key_hint   TEXT NOT NULL,
        label      TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
    `)

    // Add avatar column if missing (auto-migration)
    const usersExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()
    if (usersExist) {
      const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
      if (!cols.some(c => c.name === "avatar")) {
        db.exec("ALTER TABLE users ADD COLUMN avatar TEXT")
      }
    }

    // Ensure comments table exists (auto-migration)
    db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id          TEXT PRIMARY KEY,
        project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        node_id     TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_id   TEXT,
        content     TEXT NOT NULL,
        resolved    INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        offset_x    REAL DEFAULT 0,
        offset_y    REAL DEFAULT 0,
        parent_id   TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
      CREATE INDEX IF NOT EXISTS idx_comments_node    ON comments(node_id);
    `)

    // Add spatial comment fields if missing (auto-migration for existing DBs)
    const commentCols = db.prepare("PRAGMA table_info(comments)").all() as { name: string }[]
    if (!commentCols.some(c => c.name === "offset_x")) {
      db.exec("ALTER TABLE comments ADD COLUMN offset_x REAL DEFAULT 0")
      db.exec("ALTER TABLE comments ADD COLUMN offset_y REAL DEFAULT 0")
      db.exec("ALTER TABLE comments ADD COLUMN parent_id TEXT")
    }
  } catch {
    // Migrations may fail at build time (no full schema) — that's OK
  }

  // Enable FK enforcement for runtime queries
  db.pragma('foreign_keys = ON')

  return db
}

export const db: Database.Database = global._db ?? (global._db = createDb())

// ─── Type-safe query helpers ──────────────────────────────────────────────────

/** Get all active (non-archived) nodes for a project, ordered by position */
export function getActiveNodes(projectId: string) {
  return db
    .prepare('SELECT * FROM nodes WHERE project_id = ? AND archived = 0 ORDER BY position ASC')
    .all(projectId) as DbNode[]
}

/** Get a single active node */
export function getActiveNode(projectId: string, nodeId: string) {
  return db
    .prepare('SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0')
    .get(nodeId, projectId) as DbNode | undefined
}

/** Get next position for a new sibling */
export function getNextPosition(projectId: string, parentId: string | null): number {
  const row = db
    .prepare(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0'
    )
    .get(projectId, parentId) as { next_pos: number }
  return row.next_pos
}

/** Reorder siblings after a drag — pass the full ordered array of node IDs */
export function reorderSiblings(projectId: string, orderedNodeIds: string[]): void {
  const stmt = db.prepare('UPDATE nodes SET position = ? WHERE id = ? AND project_id = ?')
  const update = db.transaction((ids: string[]) => {
    ids.forEach((id, index) => stmt.run(index, id, projectId))
  })
  update(orderedNodeIds)
}

/** Trim version history to keep only the N most recent snapshots */
export function trimVersionHistory(projectId: string, maxSnapshots = 10): void {
  const count = (
    db
      .prepare('SELECT COUNT(*) as c FROM version_snapshots WHERE project_id = ?')
      .get(projectId) as { c: number }
  ).c

  if (count >= maxSnapshots) {
    db
      .prepare(
        `DELETE FROM version_snapshots WHERE project_id = ? AND id IN (
          SELECT id FROM version_snapshots WHERE project_id = ?
          ORDER BY created_at ASC LIMIT ?
        )`
      )
      .run(projectId, projectId, count - maxSnapshots + 1)
  }
}

/** Save a version snapshot (auto-trims to 10) */
export function saveSnapshot(
  projectId: string,
  trigger: string,
  triggeredBy: string,
  triggeredByType: 'human' | 'ai'
): void {
  const { nanoid } = require('nanoid')
  const nodes = getActiveNodes(projectId)
  trimVersionHistory(projectId)
  db.prepare(
    `INSERT INTO version_snapshots (id, project_id, trigger, triggered_by, triggered_by_type, snapshot, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(nanoid(), projectId, trigger, triggeredBy, triggeredByType, JSON.stringify(nodes), Date.now())
}

/** List version snapshots for a project (newest first) */
export function getSnapshots(projectId: string): DbSnapshot[] {
  return db
    .prepare(
      'SELECT id, project_id, trigger, triggered_by, triggered_by_type, created_at FROM version_snapshots WHERE project_id = ? ORDER BY created_at DESC'
    )
    .all(projectId) as DbSnapshot[]
}

/** Get a single snapshot by ID (includes the full node data) */
export function getSnapshotById(projectId: string, snapshotId: string): DbSnapshotFull | undefined {
  return db
    .prepare('SELECT * FROM version_snapshots WHERE id = ? AND project_id = ?')
    .get(snapshotId, projectId) as DbSnapshotFull | undefined
}

/** Restore a snapshot: archive all current nodes, re-insert snapshot nodes */
export function restoreSnapshot(projectId: string, snapshotId: string, restoredBy: string): void {
  const snap = getSnapshotById(projectId, snapshotId)
  if (!snap) throw new Error('Snapshot not found')

  const now = Date.now()
  const restoredNodes: DbNode[] = JSON.parse(snap.snapshot)

  db.transaction(() => {
    db.prepare('UPDATE nodes SET archived = 1 WHERE project_id = ? AND archived = 0').run(projectId)

    const upsert = db.prepare(`
      INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        parent_id = excluded.parent_id,
        position = excluded.position,
        archived = 0,
        data = excluded.data,
        updated_at = excluded.updated_at
    `)

    for (const node of restoredNodes) {
      upsert.run(node.id, projectId, node.parent_id, node.position, node.data, node.created_at, now)
    }

    saveSnapshot(projectId, 'restore', restoredBy, 'human')
  })()
}

// ─── DB row types (raw from SQLite) ──────────────────────────────────────────

export interface DbNode {
  id: string
  project_id: string
  parent_id: string | null
  position: number
  archived: number
  data: string // JSON string → NodeData
  created_at: number
  updated_at: number
}

export interface DbProject {
  id: string
  slug: string
  name: string
  client: string | null
  accent: string
  version: string
  owner_id: string
  archived: number
  created_at: number
  updated_at: number
}

export interface DbUser {
  id: string
  email: string
  email_verified: number
  password_hash: string
  name: string
  color: string
  role_global: string
  created_at: number
  updated_at: number
}

export interface DbSnapshot {
  id: string
  project_id: string
  trigger: string
  triggered_by: string
  triggered_by_type: string
  created_at: number
}

export interface DbSnapshotFull extends DbSnapshot {
  snapshot: string
}
