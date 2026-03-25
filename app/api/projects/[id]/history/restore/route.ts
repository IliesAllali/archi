import { NextRequest, NextResponse } from "next/server";
import { restoreSnapshot, getSnapshotById } from "@/lib/db";
import { getProject } from "@/lib/project-loader";
import { emitToProject } from "@/lib/socket";
import { requireProjectWrite } from "@/lib/project-access";

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireProjectWrite(req, params.id);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const { snapshotId } = body;

  if (!snapshotId || typeof snapshotId !== "string") {
    return NextResponse.json({ error: "snapshotId is required" }, { status: 400 });
  }

  const snapshot = getSnapshotById(project.id, snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  try {
    restoreSnapshot(project.id, snapshotId, "user");

    emitToProject(project.id, "nodes-updated", {
      projectId: project.id,
      timestamp: Date.now(),
      restored: true,
    });

    return NextResponse.json({ success: true, restored: snapshotId });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
