import { NextRequest, NextResponse } from 'next/server'
import { hashSync } from 'bcryptjs'
import { db } from '@/lib/db'
import { validateAuthToken, consumeAuthToken, revokeAllRefreshTokens } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body     = await req.json().catch(() => ({}))
  const token: string    = body.token    || ''
  const password: string = body.password || ''

  if (!token || !password) {
    return NextResponse.json({ error: 'Token et mot de passe requis.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum).' }, { status: 400 })
  }

  const result = validateAuthToken(token, 'reset_password')
  if (!result) {
    return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 })
  }

  const newHash = hashSync(password, 12)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    newHash, Date.now(), result.userId
  )

  consumeAuthToken(token)
  revokeAllRefreshTokens(result.userId) // Force re-login everywhere

  return NextResponse.json({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' })
}
