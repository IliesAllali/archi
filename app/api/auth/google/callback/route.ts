import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { setAuthCookies } from '@/lib/auth'
import type { DbUser } from '@/lib/db'

export const dynamic = 'force-dynamic'

const RANDOM_COLORS = ['#F76B15', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state') || ''
  const storedState = req.cookies.get('google_oauth_state')?.value
  const error = req.nextUrl.searchParams.get('error')

  // Parse state: "csrfToken:redirectPath"
  const [csrfState, redirectTo = '/'] = stateParam.split(':')

  const baseUrl = process.env.BASE_URL || 'https://arbo.patchou.cloud'

  // Error from Google (user denied, etc.)
  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_denied`)
  }

  // Validate CSRF state
  if (!code || !storedState || csrfState !== storedState) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${baseUrl}/login?error=google_token_failed`)
    }

    const tokens = await tokenRes.json()

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_userinfo_failed`)
    }

    const googleUser = await userInfoRes.json() as {
      id: string
      email: string
      name: string
      picture: string
      verified_email: boolean
    }

    // Find existing user by google_id or email
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleUser.id) as DbUser | undefined

    if (!user) {
      // Check if there's an existing account with this email (link accounts)
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(googleUser.email) as DbUser | undefined

      if (user) {
        // Link Google account to existing user
        db.prepare('UPDATE users SET google_id = ?, email_verified = 1, avatar = COALESCE(avatar, ?), updated_at = ? WHERE id = ?')
          .run(googleUser.id, googleUser.picture, Date.now(), user.id)
      } else {
        // Create new user
        const userId = nanoid()
        const color = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
        const now = Date.now()

        db.prepare(
          'INSERT INTO users (id, email, email_verified, password_hash, name, color, role_global, google_id, avatar, created_at, updated_at) VALUES (?, ?, 1, NULL, ?, ?, ?, ?, ?, ?, ?)'
        ).run(userId, googleUser.email, googleUser.name, color, 'user', googleUser.id, googleUser.picture, now, now)

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUser
      }
    }

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_create_failed`)
    }

    // Set auth cookies (same as regular login)
    const res = NextResponse.redirect(`${baseUrl}${redirectTo}`)

    // Clear the OAuth state cookie
    res.cookies.delete('google_oauth_state')

    await setAuthCookies(res, user.id, {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role_global,
    })

    return res
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${baseUrl}/login?error=google_unknown`)
  }
}
