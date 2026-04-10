import { NextRequest, NextResponse } from "next/server";
import { editSitemap, getProviderLabel } from "@/lib/ai";
import type { AiProvider, AiSpeed } from "@/lib/ai";
import { db, getActiveNodes, saveSnapshot } from "@/lib/db";
import type { DbNode } from "@/lib/db";
import { nanoid } from "nanoid";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";
import { checkCredits, deductCredits, getServerAiKey } from "@/lib/ai-credits";

export const dynamic = "force-dynamic"

const VALID_PROVIDERS: AiProvider[] = ["anthropic", "openai", "mistral"];
const VALID_SPEEDS: AiSpeed[] = ["fast", "quality"];

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

  const { prompt, apiKey, projectId, provider: rawProvider, speed: rawSpeed, history: rawHistory, propose: rawPropose, attachments } = body as {
    prompt?: string; apiKey?: string; projectId?: string; provider?: string; speed?: string;
    history?: { role: string; content: string }[];
    propose?: boolean;
    attachments?: { name: string; type: string; base64: string }[];
  };
  const proposeOnly = rawPropose === true;
  const conversationHistory = Array.isArray(rawHistory)
    ? rawHistory.filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-10) as { role: "user" | "assistant"; content: string }[]
    : undefined;
  const provider: AiProvider = VALID_PROVIDERS.includes(rawProvider as AiProvider)
    ? (rawProvider as AiProvider) : "anthropic";
  const speed: AiSpeed = VALID_SPEEDS.includes(rawSpeed as AiSpeed)
    ? (rawSpeed as AiSpeed) : "fast";

  if (!prompt || !projectId) {
    return NextResponse.json(
      { error: "prompt and projectId are required" },
      { status: 400 }
    );
  }

  // Determine which API key to use
  const useCredits = apiKey === "arbo_credits"
  let resolvedApiKey = apiKey || ""

  if (useCredits) {
    const serverKey = getServerAiKey()
    if (!serverKey) {
      return NextResponse.json(
        { error: "Les cr\u00e9dits IA ne sont pas disponibles sur cette instance." },
        { status: 503 }
      );
    }
    resolvedApiKey = serverKey
  }

  if (!resolvedApiKey) {
    return NextResponse.json(
      { error: "apiKey is required" },
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

  // Check AI credits if using server key
  if (useCredits) {
    const credits = checkCredits(payload.sub, speed);
    if (!credits.canUse) {
      return NextResponse.json(
        { error: `Cr\u00e9dits IA \u00e9puis\u00e9s (${credits.remaining} restants). Ajoute ta propre cl\u00e9 API dans les param\u00e8tres.` },
        { status: 402 }
      );
    }
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
        send("status", { phase: "thinking", message: "L'IA analyse l'arborescence..." });

        let streaming = false;
        const onChunk = (_chunk: string) => {
          if (!streaming) {
            streaming = true;
            send("status", { phase: "streaming", message: "R\u00e9daction de la r\u00e9ponse..." });
          }
        };

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
          if (data.zoningBlocks?.length) {
            node.zoningBlocks = data.zoningBlocks;
            node.zoningExpanded = !!data.zoningExpanded;
          }
          return node;
        });

        // Call AI
        const result = await editSitemap(
          resolvedApiKey, prompt,
          currentTree as { id: string; label: string; type: string; parent_id: string | null; children: string[] }[],
          useCredits ? "anthropic" : provider,
          speed,
          conversationHistory,
          onChunk,
          attachments
        );
        const aiLabel = getProviderLabel(useCredits ? "anthropic" : provider);

        // Chat mode: AI answered a question instead of making modifications
        if (result.type === "chat") {
          if (useCredits) deductCredits(payload.sub, speed);
          send("done", { summary: result.summary, total: 0, type: "chat" });
          controller.close();
          return;
        }

        // Propose mode: return actions without applying them (still costs credits — the AI call happened)
        if (proposeOnly) {
          if (useCredits) deductCredits(payload.sub, speed);
          send("done", {
            summary: result.summary,
            total: result.actions.length,
            type: "propose",
            actions: result.actions,
          });
          controller.close();
          return;
        }

        // Phase 2: applying actions one by one
        send("status", { phase: "applying", message: `${result.actions.length} modification(s) trouv\u00e9es`, total: result.actions.length });

        const now = Date.now();
        const tempToReal = new Map<string, string>();
        const pendingEvents: { index: number; type: string; label?: string; id?: string }[] = [];
        let actionIndex = 0;

        db.transaction(() => {
          for (const action of result.actions) {
            actionIndex++;

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
              if (raw.cta) nodeData.cta = raw.cta;
              if (raw.tags) nodeData.tags = raw.tags;
              if (raw.entryPoints) nodeData.entryPoints = raw.entryPoints;
              if (raw.zoningBlocks) {
                nodeData.zoningBlocks = raw.zoningBlocks;
                nodeData.zoningExpanded = raw.zoningExpanded ?? true;
              }
              if (raw.zoningExpanded !== undefined && !raw.zoningBlocks) {
                nodeData.zoningExpanded = raw.zoningExpanded;
              }

              db.prepare(
                `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
              ).run(realId, projectId, parentId, posRow.next_pos, JSON.stringify(nodeData), now, now);

              pendingEvents.push({ index: actionIndex, type: "add", label: action.label, id: realId });
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
                  data.zoningExpanded = raw.zoningExpanded ?? data.zoningExpanded ?? true;
                }
                if (raw.zoningExpanded !== undefined && raw.zoningBlocks === undefined) {
                  data.zoningExpanded = raw.zoningExpanded;
                }
                data.lastModifiedBy = "ai";
                data.lastModifiedByName = aiLabel;

                db.prepare("UPDATE nodes SET data = ?, updated_at = ? WHERE id = ?")
                  .run(JSON.stringify(data), now, action.node_id);

                pendingEvents.push({ index: actionIndex, type: "update", label: data.label, id: action.node_id });
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

              pendingEvents.push({ index: actionIndex, type: "delete", id: action.node_id });
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

              pendingEvents.push({ index: actionIndex, type: "move", id: action.node_id });
            }
          }
        })();

        // Send action events after transaction commits successfully
        for (const evt of pendingEvents) {
          send("action", evt);
        }

        // Save version snapshot
        saveSnapshot(projectId as string, "ai_edit", aiLabel, "ai");

        // Deduct AI credits if using server key
        if (useCredits) {
          deductCredits(payload.sub, speed);
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
