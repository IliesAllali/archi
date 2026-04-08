/**
 * Edge-compatible auth utilities.
 * This module contains ONLY functions that work in Next.js Edge Runtime
 * (no Node.js native modules like fs, better-sqlite3, crypto).
 * Used by middleware.ts.
 *
 * The full auth module (lib/auth.ts) extends these with DB-backed operations
 * for use in API routes and Server Components.
 */

import { SignJWT, jwtVerify } from 'jose'

// ─── Secrets ──────────────────────────────────────────────────────────────────

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_ACCESS_SECRET must be set in production')
  }
  return new TextEncoder().encode(secret || 'dev-access-not-for-prod')
}

const ACCESS_SECRET = getAccessSecret()

// ─── Cookie names ─────────────────────────────────────────────────────────────

export const ACCESS_COOKIE  = 'arbo_access'
export const REFRESH_COOKIE = 'arbo_refresh'
export const CSRF_COOKIE    = 'arbo_csrf'
export const COOKIE_NAME    = 'arbo_session' // legacy

// ─── Access token verification ────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string
  email: string
  name: string
  role: string
  type: 'access'
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET)
    if (payload.type !== 'access') return null
    return payload as unknown as AccessTokenPayload
  } catch {
    return null
  }
}

// ─── Legacy session verification ──────────────────────────────────────────────

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET)
    return payload
  } catch {
    return null
  }
}

// ─── CSRF verification (Edge-safe, no Node crypto) ───────────────────────────

export function verifyCsrfToken(
  cookieValue: string | undefined,
  headerValue: string | undefined
): boolean {
  if (!cookieValue || !headerValue) return false
  if (cookieValue.length !== headerValue.length) return false
  // Constant-time comparison without Node.js crypto
  let mismatch = 0
  for (let i = 0; i < cookieValue.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ headerValue.charCodeAt(i)
  }
  return mismatch === 0
}
