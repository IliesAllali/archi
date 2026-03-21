import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const keys = db.prepare(
    "SELECT id, provider, key_hint, label, created_at FROM user_api_keys WHERE user_id = ? ORDER BY created_at DESC"
  ).all(session.sub)

  return NextResponse.json(keys)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { provider, key, label } = await req.json()
  if (!provider || !key) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const validProviders = ["openai", "anthropic", "mistral"]
  if (!validProviders.includes(provider)) return NextResponse.json({ error: "Invalid provider" }, { status: 400 })

  const keyHash = crypto.createHash("sha256").update(key).digest("hex")
  const keyHint = "..." + key.slice(-4)
  const id = nanoid()

  db.prepare(
    "INSERT INTO user_api_keys (id, user_id, provider, key_hash, key_hint, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, session.sub, provider, keyHash, keyHint, label || null, Date.now())

  return NextResponse.json({ id, provider, key_hint: keyHint, label })
}
