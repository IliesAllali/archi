import { NextRequest, NextResponse } from "next/server"
import { getProject, saveProject } from "@/lib/project-loader"
import type { SiteNode } from "@/lib/types"

function checkApiKey(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.API_KEY}`
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project.nodes)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const node = (await req.json()) as SiteNode
  if (!node.id || !node.label) return NextResponse.json({ error: "id and label required" }, { status: 400 })
  project.nodes.push(node)
  saveProject(project)
  return NextResponse.json(node, { status: 201 })
}
