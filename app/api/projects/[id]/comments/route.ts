import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

interface CommentRow {
  id: string
  project_id: string
  node_id: string
  author_name: string
  author_id: string | null
  content: string
  resolved: number
  created_at: number
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Anyone who can access the project can read comments (no strict auth)
  const nodeId = req.nextUrl.searchParams.get("node_id")

  let rows: CommentRow[]
  if (nodeId) {
    rows = db
      .prepare("SELECT * FROM comments WHERE project_id = ? AND node_id = ? ORDER BY created_at ASC")
      .all(params.id, nodeId) as CommentRow[]
  } else {
    rows = db
      .prepare("SELECT * FROM comments WHERE project_id = ? ORDER BY created_at DESC")
      .all(params.id) as CommentRow[]
  }

  return NextResponse.json(rows.map(r => ({
    id: r.id,
    nodeId: r.node_id,
    authorName: r.author_name,
    authorId: r.author_id,
    content: r.content,
    resolved: !!r.resolved,
    createdAt: r.created_at,
  })))
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { nodeId, content, authorName } = body

  if (!nodeId || !content?.trim()) {
    return NextResponse.json({ error: "nodeId and content required" }, { status: 400 })
  }

  // Check if user is logged in
  const session = await getSession()
  const name = session?.name || authorName?.trim()

  if (!name) {
    return NextResponse.json({ error: "authorName required for guests" }, { status: 400 })
  }

  const id = nanoid()
  const now = Date.now()

  db.prepare(
    "INSERT INTO comments (id, project_id, node_id, author_name, author_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, params.id, nodeId, name, session?.sub || null, content.trim(), now)

  return NextResponse.json({
    id,
    nodeId,
    authorName: name,
    authorId: session?.sub || null,
    content: content.trim(),
    resolved: false,
    createdAt: now,
  }, { status: 201 })
}
