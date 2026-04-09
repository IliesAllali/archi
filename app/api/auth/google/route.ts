import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  const baseUrl = process.env.BASE_URL || 'https://arbo.patchou.cloud'
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  // CSRF state token
  const state = crypto.randomBytes(16).toString('hex')

  // Store redirect path from query
  const redirectTo = req.nextUrl.searchParams.get('redirect') || '/'

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state: `${state}:${redirectTo}`,
    prompt: 'select_account',
  })

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)

  // Store state in cookie for verification
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 min
    path: '/',
  })

  return res
}
