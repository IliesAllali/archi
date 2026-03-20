import { NextRequest, NextResponse } from 'next/server'
import { compareSync } from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, COOKIE_NAME } from '@/lib/auth'

interface ShareLink {
  id: string
  project_id: string
  token: string
  password_hash: string | null
  permissions: string
  expires_at: number | null
  visit_count: number
}

/**
 * POST /api/projects/[id]/share/verify
 * Verify a share link token + optional password, set a guest session cookie.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { token, password } = await req.json().catch(() => ({ token: '', password: '' }))

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  }

  const link = db
    .prepare('SELECT * FROM project_share_links WHERE project_id = ? AND token = ?')
    .get(params.id, token) as ShareLink | undefined

  if (!link) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
  }

  // Check expiration
  if (link.expires_at && link.expires_at < Date.now()) {
    return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 })
  }

  // Check password if set
  if (link.password_hash) {
    if (!password || !compareSync(password, link.password_hash)) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
    }
  }

  // Increment visit count
  db.prepare('UPDATE project_share_links SET visit_count = visit_count + 1 WHERE id = ?')
    .run(link.id)

  // Create guest session cookie for this project
  const sessionToken = await createSession({
    role: link.permissions === 'comment' ? 'viewer' : 'viewer',
    project: params.id,
  })

  const res = NextResponse.json({ ok: true, permissions: link.permissions })
  const cookieName = `arbo_project_${params.id}`
  res.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return res
}
