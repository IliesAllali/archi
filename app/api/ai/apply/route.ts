import { NextRequest, NextResponse } from "next/server";
import { getProviderLabel } from "@/lib/ai";
import type { AiProvider, AiEditAction } from "@/lib/ai";
import { db, getActiveNodes, saveSnapshot } from "@/lib/db";
import type { DbNode } from "@/lib/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, actions: rawActions, provider: rawProvider } = body as {
    projectId?: string;
    actions?: AiEditAction[];
    provider?: string;
  };

  if (!projectId || !rawActions || !Array.isArray(rawActions) || rawActions.length === 0) {
    return NextResponse.json(
      { error: "projectId and actions are required" },
      { status: 400 }
    );
  }

  // Auth check
  const { verifyAccessToken } = await import("@/lib/auth");
  const token =
    req.cookies.get("arbo_access")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Project membership check
  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, payload.sub) as { role: string } | undefined;
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const aiLabel = getProviderLabel((rawProvider as AiProvider) || "anthropic");

  try {
    const now = Date.now();
    const tempToReal = new Map<string, string>();
    const applied: { type: string; label?: string; id?: string }[] = [];

    db.transaction(() => {
      for (const action of rawActions) {
        if (action.action === "add") {
          const realId = nanoid();
          if (action.temp_id) tempToReal.set(action.temp_id, realId);

          let parentId = action.parent_id || null;
          if (action.parent_temp_id) {
            parentId = tempToReal.get(action.parent_temp_id) || null;
          }

          // Validate parent exists (avoid FK constraint)
          if (parentId && !tempToReal.has(action.parent_temp_id || "")) {
            const parentExists = db.prepare("SELECT 1 FROM nodes WHERE id = ? AND project_id = ? AND archived = 0").get(parentId, projectId);
            if (!parentExists) parentId = null;
          }

          const posRow = db
            .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0")
            .get(projectId, parentId) as { next_pos: number };

          const nodeData: Record<string, unknown> = {
            label: action.label || "Nouvelle page",
            type: action.type || "detail",
            priority: action.priority || "secondary",
            description: action.description || "",
            rationale: action.rationale || undefined,
            lastModifiedBy: "ai",
            lastModifiedByName: aiLabel,
          };
          const raw = action as unknown as Record<string, unknown>;
          if (raw.group !== undefined) nodeData.group = raw.group;
          if (raw.cta) nodeData.cta = raw.cta;
          if (raw.tags) nodeData.tags = raw.tags;
          if (raw.entryPoints) nodeData.entryPoints = raw.entryPoints;
          if (raw.zoningBlocks) {
            nodeData.zoningBlocks = raw.zoningBlocks;
            nodeData.zoningExpanded = raw.zoningExpanded ?? true;
          }

          db.prepare(
            `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
          ).run(realId, projectId, parentId, posRow.next_pos, JSON.stringify(nodeData), now, now);

          applied.push({ type: "add", label: action.label, id: realId });
        }

        if (action.action === "update" && action.node_id) {
          const existing = db
            .prepare("SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0")
            .get(action.node_id, projectId) as DbNode | undefined;

          if (existing) {
            const data = JSON.parse(existing.data);
            const raw = action as unknown as Record<string, unknown>;
            if (action.label !== undefined) data.label = action.label;
            if (action.type !== undefined) data.type = action.type;
            if (action.priority !== undefined) data.priority = action.priority;
            if (action.description !== undefined) data.description = action.description;
            if (raw.rationale !== undefined) data.rationale = raw.rationale;
            if (raw.group !== undefined) data.group = raw.group;
            if (raw.cta !== undefined) data.cta = raw.cta;
            if (raw.tags !== undefined) data.tags = raw.tags;
            if (raw.entryPoints !== undefined) data.entryPoints = raw.entryPoints;
            if (raw.zoningBlocks !== undefined) {
              data.zoningBlocks = raw.zoningBlocks;
              data.zoningExpanded = raw.zoningExpanded ?? data.zoningExpanded ?? true;
            }
            if (raw.zoningExpanded !== undefined && raw.zoningBlocks === undefined) {
              data.zoningExpanded = raw.zoningExpanded;
            }
            data.lastModifiedBy = "ai";
            data.lastModifiedByName = aiLabel;

            db.prepare("UPDATE nodes SET data = ?, updated_at = ? WHERE id = ?")
              .run(JSON.stringify(data), now, action.node_id);

            applied.push({ type: "update", label: data.label, id: action.node_id });
          }
        }

        if (action.action === "delete" && action.node_id) {
          const archiveDescendants = (parentId: string) => {
            const children = db
              .prepare("SELECT id FROM nodes WHERE parent_id = ? AND project_id = ? AND archived = 0")
              .all(parentId, projectId) as { id: string }[];
            for (const child of children) {
              archiveDescendants(child.id);
              db.prepare("UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?").run(now, child.id);
            }
          };
          archiveDescendants(action.node_id);
          db.prepare("UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?").run(now, action.node_id);

          applied.push({ type: "delete", id: action.node_id });
        }

        if (action.action === "move" && action.node_id && action.parent_id !== undefined) {
          // Validate parent exists (avoid FK constraint)
          if (action.parent_id) {
            const parentExists = db.prepare("SELECT 1 FROM nodes WHERE id = ? AND project_id = ? AND archived = 0").get(action.parent_id, projectId);
            if (!parentExists) continue;
          }

          const posRow = db
            .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0")
            .get(projectId, action.parent_id) as { next_pos: number };

          db.prepare("UPDATE nodes SET parent_id = ?, position = ?, updated_at = ? WHERE id = ? AND project_id = ?")
            .run(action.parent_id, posRow.next_pos, now, action.node_id, projectId);

          applied.push({ type: "move", id: action.node_id });
        }

        if (action.action === "link" && action.node_id && action.parent_id) {
          // Add a secondary parent link to the node's data
          const existing = db
            .prepare("SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0")
            .get(action.node_id, projectId) as DbNode | undefined;

          if (existing) {
            // Validate secondary parent exists
            const parentExists = db.prepare("SELECT 1 FROM nodes WHERE id = ? AND project_id = ? AND archived = 0").get(action.parent_id, projectId);
            if (parentExists) {
              const data = JSON.parse(existing.data);
              const secondaryParents: string[] = data.secondaryParentIds || [];
              if (!secondaryParents.includes(action.parent_id) && action.parent_id !== existing.parent_id) {
                secondaryParents.push(action.parent_id);
                data.secondaryParentIds = secondaryParents;
                data.lastModifiedBy = "ai";
                data.lastModifiedByName = aiLabel;

                db.prepare("UPDATE nodes SET data = ?, updated_at = ? WHERE id = ?")
                  .run(JSON.stringify(data), now, action.node_id);

                applied.push({ type: "link", id: action.node_id });
              }
            }
          }
        }
      }
    })();

    // Save version snapshot
    saveSnapshot(projectId, "ai_edit", aiLabel, "ai");

    return NextResponse.json({ ok: true, applied, total: applied.length });
  } catch (err: unknown) {
    console.error("AI apply error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Erreur lors de l'application" }, { status: 500 });
  }
}
