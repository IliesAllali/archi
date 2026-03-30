import { NextRequest, NextResponse } from 'next/server'
import { hashSync } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { setAuthCookies, createAuthToken } from '@/lib/auth'
import { checkAuthLimit } from '@/lib/rate-limiter'
import { sanitizeText } from '@/lib/sanitize'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = "force-dynamic"

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
  const email = sanitizeText(body.email).toLowerCase()
  const name  = sanitizeText(body.name)
  const password: string = body.password || ''

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum).' }, { status: 400 })
  }

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  // Anti-enumeration: return same message whether email exists or not
  if (existing) {
    return NextResponse.json({
      message: 'Si cette adresse est disponible, vous recevrez un email de confirmation.'
    })
  }

  const userId       = nanoid()
  const passwordHash = hashSync(password, 12)
  const now          = Date.now()

  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  const isFirstUser = userCount === 0
  const role = isFirstUser ? 'admin' : 'user'

  db.prepare(
    `INSERT INTO users (id, email, email_verified, password_hash, name, color, role_global, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '#F76B15', ?, ?, ?)`
  ).run(userId, email, isFirstUser ? 1 : 0, passwordHash, name, role, now, now)

  // Give new user free AI credits (discovery quota)
  db.prepare(
    `INSERT INTO ai_credits (user_id, credits_total, credits_used, created_at) VALUES (?, 20, 0, ?)`
  ).run(userId, now)

  // First user (admin) — auto-verified, log in directly
  if (isFirstUser) {
    const res = NextResponse.json({
      user: { id: userId, email, name, role },
      redirect: '/',
    })
    await setAuthCookies(res, userId, { sub: userId, email, name, role })
    return res
  }

  // Normal users — send verification email
  const token = createAuthToken(userId, 'verify_email')
  await sendVerificationEmail(email, name, token).catch(console.error)

  return NextResponse.json({
    message: 'Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.'
  })
}
