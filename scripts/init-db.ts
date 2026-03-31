/**
 * Initialize the SQLite database schema.
 * Idempotent — safe to run multiple times (uses IF NOT EXISTS).
 * Run with: npm run db:init
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'arbo.db')

const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

console.log(`→ Initializing DB at ${DB_PATH}`)

db.exec(`
  -- ─── Migration tracking ────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  );

  -- ─── Users ─────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id             TEXT PRIMARY KEY,
    email          TEXT UNIQUE NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    password_hash  TEXT NOT NULL,
    name           TEXT NOT NULL,
    color          TEXT NOT NULL DEFAULT '#F76B15',
    role_global    TEXT NOT NULL DEFAULT 'user',
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );

  -- ─── Refresh tokens ────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT UNIQUE NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

  -- ─── Email verification / password reset tokens ───────────────────────────
  CREATE TABLE IF NOT EXISTS auth_tokens (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL, -- 'verify_email' | 'reset_password'
    token      TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at    INTEGER,
    created_at INTEGER NOT NULL
  );

  -- ─── Projects ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    slug       TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    client     TEXT,
    accent     TEXT NOT NULL DEFAULT '#F76B15',
    version    TEXT NOT NULL DEFAULT 'v1',
    owner_id   TEXT NOT NULL REFERENCES users(id),
    archived   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
  CREATE INDEX IF NOT EXISTS idx_projects_slug  ON projects(slug);

  -- ─── Project members ───────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    role       TEXT NOT NULL, -- 'owner' | 'editor' | 'viewer'
    added_at   INTEGER NOT NULL,
    PRIMARY KEY (project_id, user_id)
  );

  -- ─── Project invitations ───────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS project_invitations (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email      TEXT NOT NULL,
    role       TEXT NOT NULL,
    token      TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    accepted_at INTEGER
  );

  -- ─── Share links (guest access) ────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS project_share_links (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    token       TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    permissions TEXT NOT NULL DEFAULT 'view',
    expires_at  INTEGER,
    visit_count INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
  );

  -- ─── Nodes ─────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS nodes (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id  TEXT REFERENCES nodes(id) ON DELETE SET NULL,
    position   INTEGER NOT NULL DEFAULT 0,
    archived   INTEGER NOT NULL DEFAULT 0,
    data       TEXT NOT NULL, -- JSON: NodeData
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);
  CREATE INDEX IF NOT EXISTS idx_nodes_parent  ON nodes(parent_id);

  -- ─── AI tokens ─────────────────────────────────────────────────────────────
  -- project_id NULL = account-level token (access to all user's projects)
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
  -- idx_ai_tokens_user created in migration 002

  -- ─── User API keys ────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS user_api_keys (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider   TEXT NOT NULL, -- 'openai' | 'anthropic' | 'mistral'
    key_hash   TEXT NOT NULL,
    key_hint   TEXT NOT NULL, -- last 4 chars like '...a1b2'
    label      TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);

  -- ─── AI audit log ──────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS ai_audit_log (
    id             TEXT PRIMARY KEY,
    project_id     TEXT NOT NULL,
    token_id       TEXT NOT NULL,
    token_name     TEXT NOT NULL,
    action         TEXT NOT NULL,
    node_id        TEXT,
    payload        TEXT, -- JSON of new state
    previous_state TEXT, -- JSON of previous state
    created_at     INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_audit_project ON ai_audit_log(project_id);

  -- ─── Version snapshots ─────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS version_snapshots (
    id                  TEXT PRIMARY KEY,
    project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    trigger             TEXT NOT NULL,
    triggered_by        TEXT NOT NULL,
    triggered_by_type   TEXT NOT NULL, -- 'human' | 'ai'
    snapshot            TEXT NOT NULL, -- JSON array of all active nodes
    created_at          INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_snapshots_project ON version_snapshots(project_id, created_at);

  -- ─── Comments ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS comments (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    node_id     TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_id   TEXT, -- NULL for guests
    content     TEXT NOT NULL,
    resolved    INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
  CREATE INDEX IF NOT EXISTS idx_comments_node    ON comments(node_id);

  -- ─── Async jobs (bulk imports > 45s for GPT Actions) ──────────────────────
  CREATE TABLE IF NOT EXISTS async_jobs (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL,
    type         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    payload      TEXT,
    result       TEXT,
    error        TEXT,
    created_at   INTEGER NOT NULL,
    completed_at INTEGER
  );
`)

// Record migration
const already = db.prepare("SELECT name FROM _migrations WHERE name = '001_initial_schema'").get()
if (!already) {
  db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run('001_initial_schema', Date.now())
  console.log('✅ Migration 001_initial_schema applied')
} else {
  console.log('→  Migration 001_initial_schema already applied, skipping')
}

// ─── Migration 002: Account-level MCP tokens ─────────────────────────────────
const m002 = db.prepare("SELECT name FROM _migrations WHERE name = '002_account_mcp_tokens'").get()
if (!m002) {
  // Add user_id column (nullable for backwards compat with existing project-scoped tokens)
  const cols = db.prepare("PRAGMA table_info(ai_tokens)").all() as { name: string }[]
  if (!cols.some(c => c.name === 'user_id')) {
    db.exec("ALTER TABLE ai_tokens ADD COLUMN user_id TEXT REFERENCES users(id)")
    console.log('  + Added user_id to ai_tokens')
  }
  // Make project_id nullable: SQLite can't ALTER NOT NULL, but new inserts can pass NULL
  // Existing rows keep their project_id, new account-level tokens have project_id = NULL
  db.exec("CREATE INDEX IF NOT EXISTS idx_ai_tokens_user ON ai_tokens(user_id)")
  db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run('002_account_mcp_tokens', Date.now())
  console.log('✅ Migration 002_account_mcp_tokens applied')
} else {
  console.log('→  Migration 002_account_mcp_tokens already applied, skipping')
}

// ─── Migration 003: Make ai_tokens.project_id nullable ───────────────────────
const m003 = db.prepare("SELECT name FROM _migrations WHERE name = '003_ai_tokens_nullable_project_id'").get()
if (!m003) {
  const cols = db.prepare("PRAGMA table_info(ai_tokens)").all() as { name: string; notnull: number }[]
  const projectIdCol = cols.find(c => c.name === 'project_id')

  if (projectIdCol?.notnull === 1) {
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
    console.log('  + Rebuilt ai_tokens with nullable project_id')
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_ai_tokens_user ON ai_tokens(user_id)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_ai_tokens_project ON ai_tokens(project_id)")
  db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run('003_ai_tokens_nullable_project_id', Date.now())
  console.log('✅ Migration 003_ai_tokens_nullable_project_id applied')
} else {
  console.log('→  Migration 003_ai_tokens_nullable_project_id already applied, skipping')
}

db.close()
console.log('✅ Database initialized')
