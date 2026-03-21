import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
import type { DbProject } from "@/lib/db"

export const dynamic = "force-dynamic"

interface ShareLinkRow {
  id: string
  project_id: string
  token: string
  password_hash: string | null
  permissions: string
  expires_at: number | null
  visit_count: number
  created_at: number
}

function isProjectOwnerOrEditor(projectId: string, userId: string): boolean {
  const project = db
    .prepare("SELECT owner_id FROM projects WHERE id = ? AND archived = 0")
    .get(projectId) as DbProject | undefined
  if (!project) return false
  if (project.owner_id === userId) return true

  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId) as { role: string } | undefined
  return member?.role === "owner" || member?.role === "editor"
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const links = db
    .prepare(
      "SELECT id, token, password_hash, permissions, expires_at, visit_count, created_at FROM project_share_links WHERE project_id = ? ORDER BY created_at DESC"
    )
    .all(params.id) as ShareLinkRow[]

  // Don't expose password hash, just whether it has one
  const sanitized = links.map((link) => ({
    id: link.id,
    token: link.token,
    hasPassword: !!link.password_hash,
    permissions: link.permissions,
    expiresAt: link.expires_at,
    visitCount: link.visit_count,
    createdAt: link.created_at,
  }))

  return NextResponse.json(sanitized)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwnerOrEditor(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as {
    password?: string
    permissions?: string
    expiresInDays?: number
  }

  const id = nanoid()
  const token = nanoid(16)
  const permissions = body.permissions === "comment" ? "comment" : "view"
  const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null
  const expiresAt = body.expiresInDays
    ? Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000
    : null
  const now = Date.now()

  db.prepare(
    "INSERT INTO project_share_links (id, project_id, token, password_hash, permissions, expires_at, visit_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)"
  ).run(id, params.id, token, passwordHash, permissions, expiresAt, now)

  return NextResponse.json({
    id,
    token,
    hasPassword: !!passwordHash,
    permissions,
    expiresAt,
    visitCount: 0,
    createdAt: now,
  }, { status: 201 })
}
