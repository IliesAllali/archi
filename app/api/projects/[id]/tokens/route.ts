import { NextRequest, NextResponse } from "next/server"
import { getSession, hashToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import type { DbProject } from "@/lib/db"

interface TokenRow {
  id: string
  project_id: string
  name: string
  token_hash: string
  scope: string
  last_used_at: number | null
  created_at: number
  revoked_at: number | null
}

function isProjectOwner(projectId: string, userId: string): boolean {
  const project = db
    .prepare("SELECT owner_id FROM projects WHERE id = ? AND archived = 0")
    .get(projectId) as DbProject | undefined
  if (!project) return false
  if (project.owner_id === userId) return true

  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId) as { role: string } | undefined
  return member?.role === "owner"
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tokens = db
    .prepare(
      "SELECT id, name, scope, last_used_at, created_at, revoked_at FROM ai_tokens WHERE project_id = ? ORDER BY created_at DESC"
    )
    .all(params.id) as TokenRow[]

  return NextResponse.json(tokens)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isProjectOwner(params.id, session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { name?: string; scope?: string }
  if (!body.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 })
  }

  const id = nanoid()
  const rawToken = `arbo_${nanoid(32)}`
  const tokenHash = hashToken(rawToken)
  const scope = body.scope || "write:nodes"
  const now = Date.now()

  db.prepare(
    "INSERT INTO ai_tokens (id, project_id, name, token_hash, scope, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, params.id, body.name, tokenHash, scope, now)

  // Return the raw token ONCE — it won't be shown again
  return NextResponse.json({
    id,
    name: body.name,
    token: rawToken,
    scope,
    createdAt: now,
  }, { status: 201 })
}
