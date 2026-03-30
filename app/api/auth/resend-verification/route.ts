import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuthToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { checkAuthLimit } from '@/lib/rate-limiter'
import { sanitizeText } from '@/lib/sanitize'
import type { DbUser } from '@/lib/db'

export const dynamic = "force-dynamic"

const GENERIC_MSG = 'Si cet email existe et n\u2019est pas encore v\u00e9rifi\u00e9, vous recevrez un nouveau lien.'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkAuthLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json({ message: GENERIC_MSG })
  }

  const body = await req.json().catch(() => ({}))
  const email = sanitizeText(body.email).toLowerCase()

  if (!email) return NextResponse.json({ message: GENERIC_MSG })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined

  if (user && !user.email_verified) {
    const token = createAuthToken(user.id, 'verify_email')
    await sendVerificationEmail(user.email, user.name, token).catch(console.error)
  }

  return NextResponse.json({ message: GENERIC_MSG })
}
