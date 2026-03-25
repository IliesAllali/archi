import { NextRequest, NextResponse } from "next/server"
import { getProject } from "@/lib/project-loader"
import { requireProjectRead } from "@/lib/project-access"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireProjectRead(req, params.id)
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(JSON.stringify(project, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${project.id}.json"`,
    },
  })
}
