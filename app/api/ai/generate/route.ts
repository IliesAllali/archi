import { NextRequest, NextResponse } from "next/server";
import { generateSitemap, getProviderLabel } from "@/lib/ai";
import type { AiProvider, AiSpeed } from "@/lib/ai";
import { db, saveSnapshot } from "@/lib/db";
import { nanoid } from "nanoid";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";
import { sanitizeText } from "@/lib/sanitize";

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

  const { prompt, apiKey, projectName, clientName, provider: rawProvider, speed: rawSpeed } = body as {
    prompt?: string; apiKey?: string; projectName?: string; clientName?: string; provider?: string; speed?: string;
  };
  const provider: AiProvider = VALID_PROVIDERS.includes(rawProvider as AiProvider)
    ? (rawProvider as AiProvider) : "anthropic";
  const speed: AiSpeed = VALID_SPEEDS.includes(rawSpeed as AiSpeed)
    ? (rawSpeed as AiSpeed) : "fast";

  if (!prompt || !apiKey) {
    return NextResponse.json(
      { error: "prompt and apiKey are required" },
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
        const aiLabel = getProviderLabel(provider);
        send("status", { phase: "thinking", message: `${aiLabel} analyse ton brief...` });

        // Stream AI response — extract labels live from partial JSON
        let streaming = false;
        const streamedLabels = new Set<string>();
        const labelRegex = /"label"\s*:\s*"([^"]+)"/g;

        const onChunk = (chunk: string) => {
          if (!streaming) {
            streaming = true;
            send("status", { phase: "streaming", message: "G\u00e9n\u00e9ration de l'arborescence..." });
          }
          // Try to extract new labels from the accumulated text
          // We re-run regex on the chunk for speed but it's fine for label extraction
          let match;
          const testStr = chunk;
          while ((match = labelRegex.exec(testStr)) !== null) {
            const label = match[1];
            if (!streamedLabels.has(label)) {
              streamedLabels.add(label);
              send("stream_node", { label, count: streamedLabels.size });
            }
          }
          labelRegex.lastIndex = 0;
        };

        const result = await generateSitemap(apiKey, prompt, provider, speed, onChunk);

        // Phase 2: creating project
        send("status", { phase: "creating", message: `${result.nodes.length} pages g\u00e9n\u00e9r\u00e9es, cr\u00e9ation du projet...` });

        const projectId = nanoid();
        const slug = `${(projectName || "projet")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}-${nanoid(6)}`;
        const now = Date.now();

        const safeName = sanitizeText(projectName) || "Nouveau projet";
        const safeClient = sanitizeText(clientName) || null;

        db.prepare(
          `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
           VALUES (?, ?, ?, ?, '#F76B15', 'v1', ?, 0, ?, ?)`
        ).run(projectId, slug, safeName, safeClient, payload.sub, now, now);

        // Add user as project member (owner)
        db.prepare(
          `INSERT OR IGNORE INTO project_members (project_id, user_id, role, added_at)
           VALUES (?, ?, 'owner', ?)`
        ).run(projectId, payload.sub, now);

        // Phase 3: inserting nodes one by one
        const tempToReal = new Map<string, string>();
        const insertStmt = db.prepare(
          `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
        );

        let nodeIndex = 0;
        db.transaction(() => {
          for (const node of result.nodes) {
            nodeIndex++;
            const realId = nanoid();
            tempToReal.set(node.temp_id, realId);

            const parentId = node.parent_temp_id
              ? tempToReal.get(node.parent_temp_id) || null
              : null;

            const posRow = db
              .prepare(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
              )
              .get(projectId, parentId) as { next_pos: number };

            const nodeData: Record<string, unknown> = {
              label: node.label,
              type: node.type || "detail",
              priority: node.priority || "secondary",
              description: node.description || "",
              rationale: node.rationale || undefined,
              lastModifiedBy: "ai",
              lastModifiedByName: aiLabel,
            };
            const raw = node as unknown as Record<string, unknown>;
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
            const data = JSON.stringify(nodeData);

            insertStmt.run(realId, projectId, parentId, posRow.next_pos, data, now, now);
          }
        })();

        // Send node actions after transaction (can't stream inside SQLite transaction)
        nodeIndex = 0;
        for (const node of result.nodes) {
          nodeIndex++;
          send("action", {
            index: nodeIndex,
            total: result.nodes.length,
            type: "add",
            label: node.label,
          });
        }

        // Save version snapshot
        saveSnapshot(projectId, "ai_generate", aiLabel, "ai");

        // Phase 4: done
        send("done", { projectId, slug, nodeCount: result.nodes.length });

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("AI generate error:", message);

        let errorMsg: string;
        if (message.includes("401") || message.includes("authentication") || message.includes("Incorrect API key")) {
          errorMsg = "Cl\u00e9 API invalide ou expir\u00e9e. V\u00e9rifie ta cl\u00e9 dans les param\u00e8tres du fournisseur.";
        } else if (message.includes("429") || message.includes("rate")) {
          errorMsg = "Limite du fournisseur IA atteinte. R\u00e9essaie dans 30 secondes.";
        } else if (message.includes("credit") || message.includes("balance") || message.includes("billing")) {
          errorMsg = "Cr\u00e9dits API \u00e9puis\u00e9s. Recharge ton compte sur le site du fournisseur IA.";
        } else if (message.includes("timeout") || message.includes("ETIMEDOUT") || message.includes("ECONNRESET") || message.includes("socket hang up")) {
          errorMsg = "Le fournisseur IA n'a pas r\u00e9pondu \u00e0 temps. R\u00e9essaie ou essaie un autre fournisseur.";
        } else if (message.includes("Invalid AI response") || message.includes("JSON")) {
          errorMsg = "L'IA a renvoy\u00e9 une r\u00e9ponse invalide. R\u00e9essaie avec un prompt plus simple.";
        } else if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
          errorMsg = "Impossible de contacter le fournisseur IA. V\u00e9rifie ta connexion internet.";
        } else {
          errorMsg = `Erreur inattendue : ${message.slice(0, 120)}`;
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
