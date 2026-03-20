import { NextRequest, NextResponse } from "next/server";
import { editSitemap, getProviderLabel } from "@/lib/ai";
import type { AiProvider } from "@/lib/ai";
import { db, getActiveNodes } from "@/lib/db";
import type { DbNode } from "@/lib/db";
import { nanoid } from "nanoid";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";

const VALID_PROVIDERS: AiProvider[] = ["anthropic", "openai", "mistral"];

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  // Pre-flight checks (return JSON errors before starting stream)
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, apiKey, projectId, provider: rawProvider } = body as {
    prompt?: string; apiKey?: string; projectId?: string; provider?: string;
  };
  const provider: AiProvider = VALID_PROVIDERS.includes(rawProvider as AiProvider)
    ? (rawProvider as AiProvider) : "anthropic";

  if (!prompt || !apiKey || !projectId) {
    return NextResponse.json(
      { error: "prompt, apiKey, and projectId are required" },
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

  // Rate limit
  const limit = checkAiRateLimit(payload.sub);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Limite atteinte (20/h). R\u00e9essaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // Start SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(new TextEncoder().encode(sseEvent(event, data)));
      };

      try {
        // Phase 1: thinking
        send("status", { phase: "thinking", message: "L'IA analyse l'arborescence..." });

        // Get current tree
        const dbNodes = getActiveNodes(projectId);
        const currentTree = dbNodes.map((n) => {
          const data = JSON.parse(n.data);
          const node: Record<string, unknown> = {
            id: n.id,
            label: data.label,
            type: data.type || "detail",
            priority: data.priority || "secondary",
            parent_id: n.parent_id,
            children: dbNodes
              .filter((c) => c.parent_id === n.id)
              .sort((a, b) => a.position - b.position)
              .map((c) => c.id),
          };
          if (data.description) node.description = data.description;
          if (data.cta?.length) node.cta = data.cta;
          if (data.tags?.length) node.tags = data.tags;
          return node;
        });

        // Call AI
        const result = await editSitemap(
          apiKey, prompt,
          currentTree as { id: string; label: string; type: string; parent_id: string | null; children: string[] }[],
          provider
        );
        const aiLabel = getProviderLabel(provider);

        // Phase 2: applying actions one by one
        send("status", { phase: "applying", message: `${result.actions.length} modification(s) trouv\u00e9es`, total: result.actions.length });

        const now = Date.now();
        const tempToReal = new Map<string, string>();
        let actionIndex = 0;

        for (const action of result.actions) {
          actionIndex++;

          if (action.action === "add") {
            const realId = nanoid();
            if (action.temp_id) tempToReal.set(action.temp_id, realId);

            let parentId = action.parent_id || null;
            if (action.parent_temp_id) {
              parentId = tempToReal.get(action.parent_temp_id) || null;
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
            if (raw.cta) nodeData.cta = raw.cta;
            if (raw.tags) nodeData.tags = raw.tags;
            if (raw.entryPoints) nodeData.entryPoints = raw.entryPoints;
            if (raw.zoningBlocks) {
              nodeData.zoningBlocks = raw.zoningBlocks;
              nodeData.zoningExpanded = raw.zoningExpanded ?? false;
            }

            db.prepare(
              `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
               VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
            ).run(realId, projectId, parentId, posRow.next_pos, JSON.stringify(nodeData), now, now);

            send("action", { index: actionIndex, type: "add", label: action.label, id: realId });
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
              if (raw.cta !== undefined) data.cta = raw.cta;
              if (raw.tags !== undefined) data.tags = raw.tags;
              if (raw.entryPoints !== undefined) data.entryPoints = raw.entryPoints;
              if (raw.zoningBlocks !== undefined) {
                data.zoningBlocks = raw.zoningBlocks;
                data.zoningExpanded = raw.zoningExpanded ?? data.zoningExpanded ?? false;
              }
              data.lastModifiedBy = "ai";
              data.lastModifiedByName = aiLabel;

              db.prepare("UPDATE nodes SET data = ?, updated_at = ? WHERE id = ?")
                .run(JSON.stringify(data), now, action.node_id);

              send("action", { index: actionIndex, type: "update", label: data.label, id: action.node_id });
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

            send("action", { index: actionIndex, type: "delete", id: action.node_id });
          }

          if (action.action === "move" && action.node_id && action.parent_id !== undefined) {
            const posRow = db
              .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0")
              .get(projectId, action.parent_id) as { next_pos: number };

            db.prepare("UPDATE nodes SET parent_id = ?, position = ?, updated_at = ? WHERE id = ? AND project_id = ?")
              .run(action.parent_id, posRow.next_pos, now, action.node_id, projectId);

            send("action", { index: actionIndex, type: "move", id: action.node_id });
          }
        }

        // Phase 3: done — send final tree
        const updatedNodes = getActiveNodes(projectId);
        const updatedTree = updatedNodes.map((n) => {
          const data = JSON.parse(n.data);
          const children = updatedNodes
            .filter((c) => c.parent_id === n.id)
            .sort((a, b) => a.position - b.position)
            .map((c) => c.id);
          return { id: n.id, ...data, children };
        });

        send("done", { summary: result.summary, total: result.actions.length, nodes: updatedTree });

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        console.error("AI edit error:", message);

        let errorMsg = "Erreur lors de la modification. R\u00e9essaie.";
        if (message.includes("401") || message.includes("authentication") || message.includes("Incorrect API key")) {
          errorMsg = "Cl\u00e9 API invalide ou expir\u00e9e.";
        } else if (message.includes("429") || message.includes("rate")) {
          errorMsg = "Limite du fournisseur IA atteinte. R\u00e9essaie dans quelques secondes.";
        } else if (message.includes("credit") || message.includes("balance") || message.includes("billing")) {
          errorMsg = "Cr\u00e9dits API \u00e9puis\u00e9s. Recharge ton compte sur le site du fournisseur IA ou utilise une autre cl\u00e9.";
        }

        send("error", { error: errorMsg });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
