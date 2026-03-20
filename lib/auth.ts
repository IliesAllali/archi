import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { db } from './db'

// ─── Secrets ──────────────────────────────────────────────────────────────────

let _accessSecret: Uint8Array | null = null
let _refreshSecret: Uint8Array | null = null

function getSecret(envVar: string, name: string): Uint8Array {
  const value = process.env[envVar]
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`CRITICAL: ${envVar} must be set in production. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
  }
  return new TextEncoder().encode(value || `dev-${name}-not-for-prod`)
}

function getAccessSecret(): Uint8Array {
  if (!_accessSecret) _accessSecret = getSecret('JWT_ACCESS_SECRET', 'access')
  return _accessSecret
}

function getRefreshSecret(): Uint8Array {
  if (!_refreshSecret) _refreshSecret = getSecret('JWT_REFRESH_SECRET', 'refresh')
  return _refreshSecret
}


// ─── Cookie names ─────────────────────────────────────────────────────────────

export const ACCESS_COOKIE  = 'arbo_access'
export const REFRESH_COOKIE = 'arbo_refresh'
export const CSRF_COOKIE    = 'arbo_csrf'

// Legacy cookie — kept for backwards compat during transition
export const COOKIE_NAME = 'arbo_session'

// ─── Access token (15 min) ───────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string         // user id
  email: string
  name: string
  role: string        // global role
  type: 'access'
}

export async function createAccessToken(payload: Omit<AccessTokenPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getAccessSecret())
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret())
    if (payload.type !== 'access') return null
    return payload as unknown as AccessTokenPayload
  } catch {
    return null
  }
}

// ─── Refresh token (30 days) ─────────────────────────────────────────────────

export async function createRefreshToken(userId: string): Promise<string> {
  const tokenId = nanoid(32)
  const tokenHash = hashToken(tokenId)
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(nanoid(), userId, tokenHash, expiresAt, Date.now())

  return tokenId
}

export function validateRefreshToken(token: string): { userId: string } | null {
  const tokenHash = hashToken(token)
  const row = db
    .prepare('SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = ?')
    .get(tokenHash) as { user_id: string; expires_at: number } | undefined

  if (!row) return null
  if (row.expires_at < Date.now()) {
    // Expired — clean up
    db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash)
    return null
  }
  return { userId: row.user_id }
}

export function revokeRefreshToken(token: string): void {
  db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hashToken(token))
}

export function revokeAllRefreshTokens(userId: string): void {
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId)
}

// ─── CSRF token ──────────────────────────────────────────────────────────────

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function verifyCsrfToken(cookieValue: string | undefined, headerValue: string | undefined): boolean {
  if (!cookieValue || !headerValue) return false
  return crypto.timingSafeEqual(Buffer.from(cookieValue), Buffer.from(headerValue))
}

// ─── Auth token (email verify / password reset) ───────────────────────────────

export function createAuthToken(userId: string, type: 'verify_email' | 'reset_password'): string {
  const token = nanoid(32)
  const expiresAt = type === 'verify_email'
    ? Date.now() + 24 * 60 * 60 * 1000   // 24h
    : Date.now() + 60 * 60 * 1000         // 1h

  db.prepare(
    'INSERT INTO auth_tokens (id, user_id, type, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(nanoid(), userId, type, token, expiresAt, Date.now())

  return token
}

export function validateAuthToken(token: string, type: string): { userId: string } | null {
  const row = db
    .prepare('SELECT user_id, expires_at, used_at FROM auth_tokens WHERE token = ? AND type = ?')
    .get(token, type) as { user_id: string; expires_at: number; used_at: number | null } | undefined

  if (!row) return null
  if (row.used_at) return null              // Already used
  if (row.expires_at < Date.now()) return null

  return { userId: row.user_id }
}

export function consumeAuthToken(token: string): void {
  db.prepare('UPDATE auth_tokens SET used_at = ? WHERE token = ?').run(Date.now(), token)
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export async function setAuthCookies(
  res: { cookies: { set: Function } },
  userId: string,
  payload: Omit<AccessTokenPayload, 'type'>
): Promise<void> {
  const accessToken  = await createAccessToken(payload)
  const refreshToken = await createRefreshToken(userId)
  const csrfToken    = generateCsrfToken()

  const secure = process.env.NODE_ENV === 'production'

  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  // CSRF — NOT httpOnly so JS can read it
  res.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

export function clearAuthCookies(res: { cookies: { set: Function } }): void {
  res.cookies.set(ACCESS_COOKIE,  '', { maxAge: 0, path: '/' })
  res.cookies.set(REFRESH_COOKIE, '', { maxAge: 0, path: '/' })
  res.cookies.set(CSRF_COOKIE,    '', { maxAge: 0, path: '/' })
  // Also clear legacy cookie
  res.cookies.set(COOKIE_NAME,    '', { maxAge: 0, path: '/' })
}

// ─── Server-side session read ─────────────────────────────────────────────────

export async function getSession(): Promise<AccessTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value
    || cookieStore.get(COOKIE_NAME)?.value  // legacy fallback
  if (!token) return null
  return verifyAccessToken(token)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Legacy compat — used by old per-project share links
export async function createSession(payload: Record<string, string>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getAccessSecret())
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret())
    return payload
  } catch {
    return null
  }
}
