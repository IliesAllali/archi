import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAuthToken, consumeAuthToken } from '@/lib/auth'

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url))
  }

  const result = validateAuthToken(token, 'verify_email')
  if (!result) {
    return NextResponse.redirect(new URL('/login?error=expired_token', req.url))
  }

  db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').run(
    Date.now(), result.userId
  )
  consumeAuthToken(token)

  return NextResponse.redirect(new URL('/login?verified=1', req.url))
}
