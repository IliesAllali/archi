import { NextRequest, NextResponse } from "next/server";
import { getSnapshots } from "@/lib/db";
import { getProject } from "@/lib/project-loader";

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const snapshots = getSnapshots(project.id);

  return NextResponse.json({
    success: true,
    snapshots: snapshots.map((s) => ({
      id: s.id,
      trigger: s.trigger,
      triggeredBy: s.triggered_by,
      triggeredByType: s.triggered_by_type,
      createdAt: s.created_at,
    })),
  });
}
