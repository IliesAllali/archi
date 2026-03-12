import { NextRequest, NextResponse } from "next/server"
import { getAllProjects, saveProject } from "@/lib/project-loader"
import type { Project } from "@/lib/types"

function checkApiKey(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const key = process.env.API_KEY
  return auth === `Bearer ${key}`
}

export async function GET() {
  const projects = getAllProjects()
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = (await req.json()) as Project
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 })
  }
  saveProject(body)
  return NextResponse.json(body, { status: 201 })
}
