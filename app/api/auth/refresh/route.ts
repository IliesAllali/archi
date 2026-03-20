import { NextRequest, NextResponse } from 'next/server'
import {
  validateRefreshToken,
  revokeRefreshToken,
  createAccessToken,
  createRefreshToken,
  generateCsrfToken,
  REFRESH_COOKIE,
  ACCESS_COOKIE,
  CSRF_COOKIE,
} from '@/lib/auth'
import { db } from '@/lib/db'
import type { DbUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  const result = validateRefreshToken(refreshToken)
  if (!result) {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.userId) as DbUser | undefined
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Rotate: revoke old, issue new
  revokeRefreshToken(refreshToken)
  const newRefreshToken = await createRefreshToken(user.id)
  const newAccessToken  = await createAccessToken({
    sub:   user.id,
    email: user.email,
    name:  user.name,
    role:  user.role_global,
  })
  const newCsrfToken = generateCsrfToken()

  const secure = process.env.NODE_ENV === 'production'
  const res = NextResponse.json({ ok: true })

  res.cookies.set(ACCESS_COOKIE, newAccessToken, {
    httpOnly: true, secure, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
  })
  res.cookies.set(REFRESH_COOKIE, newRefreshToken, {
    httpOnly: true, secure, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/',
  })
  res.cookies.set(CSRF_COOKIE, newCsrfToken, {
    httpOnly: false, secure, sameSite: 'strict', maxAge: 30 * 24 * 60 * 60, path: '/',
  })

  return res
}
