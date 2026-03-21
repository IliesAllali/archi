import { NextRequest, NextResponse } from 'next/server'
import { compareSync } from 'bcryptjs'
import { db } from '@/lib/db'
import { setAuthCookies } from '@/lib/auth'
import { checkAuthLimit } from '@/lib/rate-limiter'
import { sanitizeText } from '@/lib/sanitize'
import type { DbUser } from '@/lib/db'

export const dynamic = "force-dynamic"

const GENERIC_ERROR = 'Email ou mot de passe incorrect.'
const ARTIFICIAL_DELAY = 200 // ms — resist timing attacks

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkAuthLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques instants.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  const body = await req.json().catch(() => ({}))
  const email    = sanitizeText(body.email).toLowerCase()
  const password: string = body.password || ''

  // Artificial delay — same duration regardless of outcome
  await new Promise((r) => setTimeout(r, ARTIFICIAL_DELAY))

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined

  if (!user || !compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  if (!user.email_verified) {
    return NextResponse.json(
      { error: 'Veuillez confirmer votre adresse email avant de vous connecter.' },
      { status: 403 }
    )
  }

  const res = NextResponse.json({
    user: {
      id:    user.id,
      email: user.email,
      name:  user.name,
      color: user.color,
      role:  user.role_global,
    }
  })

  await setAuthCookies(res, user.id, {
    sub:   user.id,
    email: user.email,
    name:  user.name,
    role:  user.role_global,
  })

  return res
}
