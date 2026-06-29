/**
 * API v1 authentication — Bearer token from ai_tokens table.
 * Shared between REST API v1 routes.
 */

import crypto from 'crypto'
import { db } from './db'
import { checkAiTokenLimit } from './rate-limiter'

export interface ApiTokenInfo {
  tokenId: string
  tokenName: string
  /** Project-scoped token → the single project it is bound to. Null for account-level (MCP) tokens. */
  projectId: string | null
  /** Account-level (MCP) token → the owning user. Null for project-scoped tokens. */
  userId: string | null
  scope: string
}

const SCOPE_HIERARCHY: Record<string, string[]> = {
  'read':          ['read'],
  'write:nodes':   ['read', 'write:nodes'],
  'write:project': ['read', 'write:nodes', 'write:project'],
  'admin':         ['read', 'write:nodes', 'write:project', 'admin'],
}

/**
 * Authenticate a Bearer token from the Authorization header.
 * Returns token info or null if invalid.
 */
export function authenticateApiToken(req: Request): ApiTokenInfo | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const rawToken = auth.slice(7)
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const row = db.prepare(
    'SELECT id, name, user_id, project_id, scope FROM ai_tokens WHERE token_hash = ? AND revoked_at IS NULL'
  ).get(hash) as { id: string; name: string; user_id: string | null; project_id: string | null; scope: string } | undefined

  if (!row) return null

  // Update last_used_at
  db.prepare('UPDATE ai_tokens SET last_used_at = ? WHERE id = ?').run(Date.now(), row.id)

  return {
    tokenId: row.id,
    tokenName: row.name,
    projectId: row.project_id ?? null,
    userId: row.user_id ?? null,
    scope: row.scope,
  }
}

/**
 * Does this token grant access to the given project?
 *
 * Two kinds of token (mirrors the MCP server's access model):
 * - Project-scoped token (`projectId` set): access only to that single project.
 * - Account-level token (`userId` set, `projectId` null): access to every project
 *   the user owns, is a direct member of, or reaches through a workspace.
 *
 * Returns:
 *   true        → authorized
 *   false       → exists but the token has no access (→ 403)
 *   'not_found' → project does not exist (→ caller decides; routes return 404)
 */
export function tokenCanAccessProject(token: ApiTokenInfo, projectId: string): boolean | 'not_found' {
  const project = db
    .prepare('SELECT id, owner_id FROM projects WHERE id = ? AND archived = 0')
    .get(projectId) as { id: string; owner_id: string } | undefined

  if (!project) return 'not_found'

  // Project-scoped token → must match exactly.
  if (token.projectId) return token.projectId === projectId

  // Account-level token → user must own / belong to the project.
  if (token.userId) {
    if (project.owner_id === token.userId) return true

    const member = db
      .prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(projectId, token.userId)
    if (member) return true

    const wsMember = db.prepare(`
      SELECT 1 FROM workspace_members wm
      JOIN projects p ON p.workspace_id = wm.workspace_id
      WHERE p.id = ? AND wm.user_id = ? AND wm.joined_at IS NOT NULL
    `).get(projectId, token.userId)
    if (wsMember) return true

    return false
  }

  // Legacy token with neither binding → deny.
  return false
}

/**
 * Check if a token has the required scope.
 */
export function hasScope(tokenScope: string, requiredScope: string): boolean {
  const allowed = SCOPE_HIERARCHY[tokenScope]
  if (!allowed) return false
  return allowed.includes(requiredScope)
}

/**
 * Standard JSON error response.
 */
export function apiError(code: string, message: string, status: number) {
  return Response.json(
    { success: false, error: { code, message } },
    { status }
  )
}

/**
 * Standard JSON success response.
 */
export function apiSuccess(data: unknown, meta?: Record<string, unknown>, status = 200) {
  return Response.json(
    { success: true, data, meta: { timestamp: new Date().toISOString(), ...meta } },
    { status }
  )
}

/**
 * Full auth + rate limit + scope check. Returns token info or a Response (error).
 */
export function authorizeRequest(
  req: Request,
  requiredScope: string,
  projectId?: string
): ApiTokenInfo | Response {
  const token = authenticateApiToken(req)
  if (!token) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API token', 401)
  }

  // Rate limit
  const rl = checkAiTokenLimit(token.tokenId)
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter), 'Content-Type': 'application/json' } }
    )
  }

  // Scope check
  if (!hasScope(token.scope, requiredScope)) {
    return apiError(
      'INSUFFICIENT_SCOPE',
      `This token requires scope '${requiredScope}' to perform this action. Current scope: '${token.scope}'.`,
      403
    )
  }

  // Project access — works for both project-scoped and account-level (MCP) tokens.
  if (projectId) {
    const access = tokenCanAccessProject(token, projectId)
    if (access === 'not_found') {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }
    if (!access) {
      return apiError('FORBIDDEN', 'Token does not have access to this project', 403)
    }
  }

  return token
}
