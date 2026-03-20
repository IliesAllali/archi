import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ShareRow {
  project_id: string
  password_hash: string | null
  permissions: string
  expires_at: number | null
}

/**
 * GET /api/share/resolve?token=xxx
 * Resolve a share token to a project ID + whether password is required.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  }

  const link = db
    .prepare('SELECT project_id, password_hash, permissions, expires_at FROM project_share_links WHERE token = ?')
    .get(token) as ShareRow | undefined

  if (!link) {
    return NextResponse.json({ error: 'Lien invalide ou expir\u00e9' }, { status: 404 })
  }

  if (link.expires_at && link.expires_at < Date.now()) {
    return NextResponse.json({ error: 'Ce lien a expir\u00e9' }, { status: 410 })
  }

  return NextResponse.json({
    projectId: link.project_id,
    requiresPassword: !!link.password_hash,
    permissions: link.permissions,
  })
}
