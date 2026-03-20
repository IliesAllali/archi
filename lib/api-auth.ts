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
  projectId: string
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
    'SELECT id, name, project_id, scope FROM ai_tokens WHERE token_hash = ? AND revoked_at IS NULL'
  ).get(hash) as { id: string; name: string; project_id: string; scope: string } | undefined

  if (!row) return null

  // Update last_used_at
  db.prepare('UPDATE ai_tokens SET last_used_at = ? WHERE id = ?').run(Date.now(), row.id)

  return {
    tokenId: row.id,
    tokenName: row.name,
    projectId: row.project_id,
    scope: row.scope,
  }
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

  // Project isolation — token is scoped to a single project
  if (projectId && token.projectId !== projectId) {
    return apiError('FORBIDDEN', 'Token does not have access to this project', 403)
  }

  return token
}
