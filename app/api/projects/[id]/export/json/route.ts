import { NextRequest, NextResponse } from "next/server"
import { getProject } from "@/lib/project-loader"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(JSON.stringify(project, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${project.id}.json"`,
    },
  })
}
