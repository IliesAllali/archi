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
    // Ensure ai_tokens exists with the latest account-level MCP schema.
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_tokens (
        id           TEXT PRIMARY KEY,
        user_id      TEXT REFERENCES users(id),
        project_id   TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name         TEXT NOT NULL,
        token_hash   TEXT UNIQUE NOT NULL,
        scope        TEXT NOT NULL DEFAULT 'write:nodes',
        last_used_at INTEGER,
        created_at   INTEGER NOT NULL,
        revoked_at   INTEGER
      );
    `)

    const aiTokenCols = db.prepare("PRAGMA table_info(ai_tokens)").all() as {
      name: string
      notnull: number
    }[]

    if (!aiTokenCols.some((c) => c.name === "user_id")) {
      db.exec("ALTER TABLE ai_tokens ADD COLUMN user_id TEXT REFERENCES users(id)")
    }

    if (aiTokenCols.some((c) => c.name === "project_id" && c.notnull === 1)) {
      db.exec(`
        CREATE TABLE ai_tokens_migrated (
          id           TEXT PRIMARY KEY,
          user_id      TEXT REFERENCES users(id),
          project_id   TEXT REFERENCES projects(id) ON DELETE CASCADE,
          name         TEXT NOT NULL,
          token_hash   TEXT UNIQUE NOT NULL,
          scope        TEXT NOT NULL DEFAULT 'write:nodes',
          last_used_at INTEGER,
          created_at   INTEGER NOT NULL,
          revoked_at   INTEGER
        );

        INSERT INTO ai_tokens_migrated (id, user_id, project_id, name, token_hash, scope, last_used_at, created_at, revoked_at)
        SELECT id, user_id, project_id, name, token_hash, scope, last_used_at, created_at, revoked_at
        FROM ai_tokens;

        DROP TABLE ai_tokens;
        ALTER TABLE ai_tokens_migrated RENAME TO ai_tokens;
      `)
    }

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_tokens_user ON ai_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_tokens_project ON ai_tokens(project_id);
    `)

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
      // Google OAuth: add google_id column if missing
      if (!cols.some(c => c.name === "google_id")) {
        db.exec("ALTER TABLE users ADD COLUMN google_id TEXT")
        db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)")
      }
      // Polar billing: add plan_tier + polar_customer_id if missing
      if (!cols.some(c => c.name === "plan_tier")) {
        db.exec("ALTER TABLE users ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'free'")
      }
      if (!cols.some(c => c.name === "polar_customer_id")) {
        db.exec("ALTER TABLE users ADD COLUMN polar_customer_id TEXT")
      }
    }

    // Purchases history (Polar orders)
    db.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        polar_order_id  TEXT UNIQUE NOT NULL,
        type            TEXT NOT NULL,
        tier            TEXT,
        credits_added   INTEGER,
        amount_cents    INTEGER NOT NULL,
        currency        TEXT NOT NULL DEFAULT 'eur',
        created_at      INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
    `)

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

    // Add annotation fields to comments (auto-migration for existing DBs)
    const commentCols = db.prepare("PRAGMA table_info(comments)").all() as { name: string }[]
    if (!commentCols.some(c => c.name === "section")) {
      db.exec(`ALTER TABLE comments ADD COLUMN section TEXT`)
    }
    if (!commentCols.some(c => c.name === "tag")) {
      db.exec(`ALTER TABLE comments ADD COLUMN tag TEXT`)
    }
    if (!commentCols.some(c => c.name === "offset_x")) {
      db.exec("ALTER TABLE comments ADD COLUMN offset_x REAL DEFAULT 0")
      db.exec("ALTER TABLE comments ADD COLUMN offset_y REAL DEFAULT 0")
      db.exec("ALTER TABLE comments ADD COLUMN parent_id TEXT")
    }

    // AI credits table (discovery quota for new users)
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_credits (
        user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        credits_total   INTEGER NOT NULL DEFAULT 20,
        credits_used    INTEGER NOT NULL DEFAULT 0,
        created_at      INTEGER NOT NULL
      );
    `)

    // Seed credits for existing users who don't have any yet
    if (usersExist) {
      const now = Date.now()
      db.exec(`
        INSERT OR IGNORE INTO ai_credits (user_id, credits_total, credits_used, created_at)
        SELECT id, 20, 0, ${now} FROM users
        WHERE id NOT IN (SELECT user_id FROM ai_credits)
      `)
    }
    // Add global_sections column to projects if missing (auto-migration)
    const projectsExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get()
    if (projectsExist) {
      const cols = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[]
      if (!cols.some(c => c.name === "global_sections")) {
        db.exec("ALTER TABLE projects ADD COLUMN global_sections TEXT")
      }
      if (!cols.some(c => c.name === "wireframe_settings")) {
        db.exec("ALTER TABLE projects ADD COLUMN wireframe_settings TEXT")
      }
    }

    // ── Workspace tables (team features for Studio/Agency) ──
    db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        owner_id        TEXT NOT NULL REFERENCES users(id),
        plan_tier       TEXT NOT NULL DEFAULT 'free',
        ai_credits      INTEGER NOT NULL DEFAULT 20,
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id              TEXT PRIMARY KEY,
        workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role            TEXT NOT NULL DEFAULT 'editor',
        invited_by      TEXT REFERENCES users(id),
        joined_at       INTEGER,
        invited_at      INTEGER NOT NULL,
        UNIQUE(workspace_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_wm_workspace ON workspace_members(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_wm_user ON workspace_members(user_id);
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS workspace_invitations (
        id              TEXT PRIMARY KEY,
        workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        email           TEXT NOT NULL,
        role            TEXT NOT NULL DEFAULT 'editor',
        invited_by      TEXT NOT NULL REFERENCES users(id),
        token           TEXT NOT NULL UNIQUE,
        expires_at      INTEGER NOT NULL,
        accepted_at     INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_wi_workspace ON workspace_invitations(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_wi_token ON workspace_invitations(token);
    `)

    // Workspace branding (white label for Studio/Agency)
    db.exec(`
      CREATE TABLE IF NOT EXISTS workspace_branding (
        workspace_id    TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
        logo_url        TEXT,
        company_name    TEXT,
        updated_at      INTEGER NOT NULL DEFAULT 0
      );
    `)

    // Add workspace_id to projects if missing
    if (projectsExist) {
      const projCols = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[]
      if (!projCols.some(c => c.name === "workspace_id")) {
        db.exec("ALTER TABLE projects ADD COLUMN workspace_id TEXT REFERENCES workspaces(id)")
      }
    }

    // Auto-create a workspace for each user who doesn't have one yet
    if (usersExist) {
      const usersWithoutWs = db.prepare(`
        SELECT id, name, plan_tier FROM users
        WHERE id NOT IN (SELECT owner_id FROM workspaces)
      `).all() as { id: string; name: string; plan_tier: string }[]

      const now = Date.now()
      const insertWs = db.prepare(`
        INSERT INTO workspaces (id, name, owner_id, plan_tier, ai_credits, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `)
      const insertMember = db.prepare(`
        INSERT OR IGNORE INTO workspace_members (id, workspace_id, user_id, role, invited_at, joined_at)
        VALUES (?, ?, ?, 'owner', ?, ?)
      `)
      const attachProjects = db.prepare(`
        UPDATE projects SET workspace_id = ? WHERE owner_id = ? AND workspace_id IS NULL
      `)

      for (const u of usersWithoutWs) {
        const wsId = `ws_${u.id}`
        const memberId = `wm_${u.id}`
        insertWs.run(wsId, `${u.name}'s workspace`, u.id, u.plan_tier || "free", now, now)
        insertMember.run(memberId, wsId, u.id, now, now)
        attachProjects.run(wsId, u.id)
      }
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

/** Save a version snapshot (auto-trims based on owner's plan) */
export function saveSnapshot(
  projectId: string,
  trigger: string,
  triggeredBy: string,
  triggeredByType: 'human' | 'ai'
): void {
  const { nanoid } = require('nanoid')
  const { PLAN_LIMITS } = require('@/lib/plans')
  const nodes = getActiveNodes(projectId)

  // Get snapshot limit from project owner's plan
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId) as { owner_id: string } | undefined
  const user = project ? db.prepare('SELECT plan_tier FROM users WHERE id = ?').get(project.owner_id) as { plan_tier: string } | undefined : undefined
  const tier = user?.plan_tier || 'free'
  const maxSnapshots = PLAN_LIMITS[tier]?.maxSnapshots ?? 10

  if (maxSnapshots !== null) {
    trimVersionHistory(projectId, maxSnapshots)
  }
  // null = unlimited, no trimming

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
  global_sections: string | null // JSON: GlobalSection[]
  wireframe_settings: string | null // JSON: WireframeSettings
  created_at: number
  updated_at: number
}

export interface DbUser {
  id: string
  email: string
  email_verified: number
  password_hash: string | null
  name: string
  color: string
  role_global: string
  google_id: string | null
  plan_tier: string
  polar_customer_id: string | null
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
