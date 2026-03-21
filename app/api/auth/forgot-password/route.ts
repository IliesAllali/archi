import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuthToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkAuthLimit } from '@/lib/rate-limiter'
import { sanitizeText } from '@/lib/sanitize'
import type { DbUser } from '@/lib/db'

export const dynamic = "force-dynamic"

const GENERIC_MSG = 'Si cet email existe, vous recevrez un lien de réinitialisation.'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkAuthLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json({ message: GENERIC_MSG }) // Don't reveal rate limit on this endpoint
  }

  const body  = await req.json().catch(() => ({}))
  const email = sanitizeText(body.email).toLowerCase()

  if (!email) return NextResponse.json({ message: GENERIC_MSG })

  // Always return the same message — anti-enumeration
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined
  if (user) {
    const token = createAuthToken(user.id, 'reset_password')
    await sendPasswordResetEmail(user.email, user.name, token).catch(console.error)
  }

  return NextResponse.json({ message: GENERIC_MSG })
}
