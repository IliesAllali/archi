import { NextRequest, NextResponse } from "next/server"
import { getSession, hashToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

interface TokenRow {
  id: string
  name: string
  scope: string
  last_used_at: number | null
  created_at: number
  revoked_at: number | null
}

/** GET /api/me/mcp-tokens — list account-level MCP tokens */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tokens = db
    .prepare("SELECT id, name, scope, last_used_at, created_at, revoked_at FROM ai_tokens WHERE user_id = ? AND project_id IS NULL ORDER BY created_at DESC")
    .all(session.sub) as TokenRow[]

  return NextResponse.json(tokens)
}

/** POST /api/me/mcp-tokens — create an account-level MCP token */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { name?: string }
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })

  const id = nanoid()
  const rawToken = `arbo_${nanoid(32)}`
  const tokenHash = hashToken(rawToken)
  const now = Date.now()

  db.prepare(
    "INSERT INTO ai_tokens (id, user_id, project_id, name, token_hash, scope, created_at) VALUES (?, ?, NULL, ?, ?, 'write:nodes', ?)"
  ).run(id, session.sub, name, tokenHash, now)

  return NextResponse.json({ id, name, token: rawToken, createdAt: now }, { status: 201 })
}

/** DELETE /api/me/mcp-tokens — revoke by token id (passed as query param) */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tokenId = req.nextUrl.searchParams.get("id")
  if (!tokenId) return NextResponse.json({ error: "id required" }, { status: 400 })

  db.prepare("UPDATE ai_tokens SET revoked_at = ? WHERE id = ? AND user_id = ?").run(Date.now(), tokenId, session.sub)
  return NextResponse.json({ ok: true })
}
