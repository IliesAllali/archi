"use client";

import { useState, useCallback, useEffect } from "react";
import {
  EyeOff, Plus, GripVertical, ChevronUp, ChevronDown, Trash2,
  Sparkles, Loader2, Layout, Layers, X,
} from "lucide-react";
import type { NodeData, ZoningBlock, WireframeAnnotation } from "@/lib/types";
import { isByokEnabled, getStoredApiKey, getStoredProvider } from "@/lib/ai-providers";
import { SKIN_CATALOG, generateBlockId } from "@/lib/types";
import {
  SKIN_MAP,
  SECTION_COLORS,
  SECTION_BORDER_COLORS,
} from "@/components/Tree/SiteNode";
import ErrorBoundary from "@/components/ErrorBoundary";

/* ─── Block skin preview (same rendering as canvas) ─── */

function BlockPreview({ skin, height }: { skin: string; height: number }) {
  const Skin = SKIN_MAP[skin];
  const bg = SECTION_COLORS[skin] || "var(--wireframe-faint)";
  const border = SECTION_BORDER_COLORS[skin] || "var(--wireframe-strong)";

  return (
    <div className="rounded-sm overflow-hidden" style={{ background: bg, borderLeft: `3px solid ${border}` }}>
      <div style={{ height: Math.min(height, 48) }}>
        {Skin ? <Skin /> : (
          <div className="flex items-center justify-center h-full">
            <div className="w-[35%] h-[2px] rounded-sm" style={{ background: "var(--wireframe-strong)" }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Catalog picker item ─── */

function CatalogItem({ skin, label, height, onAdd }: { skin: string; label: string; height: number; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex flex-col rounded-md border border-line hover:border-accent/50 bg-bg-surface hover:bg-bg-hover transition-all overflow-hidden group"
    >
      <div className="w-full" style={{ minHeight: 28 }}>
        <BlockPreview skin={skin} height={height} />
      </div>
      <div className="px-1.5 py-1 w-full">
        <span className="text-2xs font-medium truncate block group-hover:text-accent transition-colors" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
      </div>
    </button>
  );
}

/* ─── Single block row ─── */

function BlockRow({
  block, index, total, onRemove, onMoveUp, onMoveDown, onGenerateCopy, isGenerating,
}: {
  block: ZoningBlock; index: number; total: number;
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
  onGenerateCopy?: () => void; isGenerating?: boolean;
}) {
  return (
    <div className="group/row flex gap-2 items-stretch rounded-md border border-line bg-bg-surface hover:border-line-strong transition-colors overflow-hidden">
      <div className="flex flex-col items-center justify-center w-5 shrink-0 bg-bg-elevated/50 border-r border-line">
        <button onClick={onMoveUp} disabled={index === 0} className="p-0.5 disabled:opacity-20 hover:text-accent transition-colors" style={{ color: "var(--text-faint)" }}>
          <ChevronUp className="w-2.5 h-2.5" />
        </button>
        <GripVertical className="w-2.5 h-2.5 my-0.5" style={{ color: "var(--text-faint)", opacity: 0.4 }} />
        <button onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 disabled:opacity-20 hover:text-accent transition-colors" style={{ color: "var(--text-faint)" }}>
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>
      <div className="flex-1 py-1.5 pr-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xs font-semibold" style={{ color: "var(--text-secondary)" }}>{block.label}</span>
        </div>
        <BlockPreview skin={block.skin} height={block.height} />
      </div>
      <div className="self-center mr-1.5 flex flex-col gap-0.5">
        {onGenerateCopy && (
          <button onClick={onGenerateCopy} disabled={isGenerating} className="p-1 rounded opacity-0 group-hover/row:opacity-100 hover:bg-accent-muted transition-all disabled:opacity-50" title="Contenu IA">
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} /> : <Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />}
          </button>
        )}
        <button onClick={onRemove} className="p-1 rounded opacity-0 group-hover/row:opacity-100 hover:bg-red-500/10 transition-all" title="Supprimer">
          <Trash2 className="w-3 h-3" style={{ color: "var(--error-text)" }} />
        </button>
      </div>
    </div>
  );
}

/* ─── Wireframe scaled preview (same technique as canvas node) ─── */

/** Injects a tiny script that reports the real content height to the parent */
function withHeightReporter(html: string, id: string): string {
  // Debounced so rapidly-mutating AI HTML doesn't spam the parent
  const script = `<script>
(function(){
  var pending = null;
  function report() {
    if (pending) clearTimeout(pending);
    pending = setTimeout(function(){
      try {
        var h = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
        if (h > 20000) h = 20000;
        window.parent.postMessage({type:'arbo-iframe-height',id:'${id}',height:h},'*');
      } catch (e) {}
    }, 80);
  }
  if (document.readyState === 'complete') report();
  else window.addEventListener('load', report);
  try { new MutationObserver(report).observe(document.body, {childList:true,subtree:true}); }
  catch (e) {}
})();
<\/script>`;
  if (html.includes('</body>')) return html.replace('</body>', script + '</body>');
  return html + script;
}

function WireframeThumb({ html }: { html: string }) {
  const SCALE = 0.24;
  const SRC_WIDTH = 1440;
  const iframeId = "panel-wf-thumb";
  const [realH, setRealH] = useState(2400);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "arbo-iframe-height" && e.data.id === iframeId) {
        const h = Number(e.data.height);
        if (Number.isFinite(h) && h > 0) setRealH(Math.min(h, 20000));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const scaledH = Math.round(realH * SCALE);

  return (
    <div
      className="rounded-lg border border-line overflow-y-auto"
      style={{ maxHeight: 500, background: "#fff" }}
    >
      {/* Wrapper at scaled dimensions so scrolling works naturally */}
      <div style={{ width: Math.round(SRC_WIDTH * SCALE), height: scaledH, position: "relative", overflow: "hidden" }}>
        <iframe
          srcDoc={withHeightReporter(html, iframeId)}
          sandbox="allow-scripts"
          className="border-0 pointer-events-none absolute top-0 left-0"
          style={{
            width: SRC_WIDTH,
            height: realH,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
          title="Wireframe preview"
        />
      </div>
    </div>
  );
}

/* ─── Main editor ─── */

interface ZoningEditorProps {
  pageType: string;
  pageLabel: string;
  blocks: ZoningBlock[];
  expanded: boolean;
  html: string | undefined;
  accent: string;
  projectName: string;
  description: string;
  annotations: WireframeAnnotation[];
  canvasMode: string | undefined;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function ZoningEditor({
  pageType, pageLabel, blocks, html, projectName, description, canvasMode, onChange,
}: ZoningEditorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [generatingBlockId, setGeneratingBlockId] = useState<string | null>(null);

  const handleSetCanvasMode = (mode: string | undefined) => {
    onChange("zoningCanvasMode", mode);
    onChange("zoningExpanded", mode === "zoning" || mode === "wireframe");
  };

  const updateBlocks = useCallback(
    (newBlocks: ZoningBlock[]) => onChange("zoningBlocks", newBlocks),
    [onChange],
  );

  const handleAddBlock = (catalogItem: typeof SKIN_CATALOG[number]) => {
    const newBlock: ZoningBlock = {
      id: generateBlockId(),
      label: catalogItem.label,
      skin: catalogItem.skin,
      height: catalogItem.height,
    };
    updateBlocks([...blocks, newBlock]);
    setShowPicker(false);
  };

  const handleRemoveBlock = (index: number) => {
    updateBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...blocks];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    updateBlocks(arr);
  };

  const handleMoveDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    const arr = [...blocks];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    updateBlocks(arr);
  };

  const handleGenerateCopy = useCallback(async (block: ZoningBlock) => {
    setGeneratingBlockId(block.id);
    try {
      const provider = getStoredProvider();
      const byokKey = isByokEnabled() ? getStoredApiKey(provider) : "";
      const apiKey = byokKey || "arbo_credits";

      const csrfMatch = typeof document !== "undefined" ? document.cookie.match(/arbo_csrf=([^;]+)/) : null;
      const zHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfMatch) zHeaders["x-csrf-token"] = csrfMatch[1];
      const res = await fetch("/api/ai/copy", {
        method: "POST",
        headers: zHeaders,
        body: JSON.stringify({
          apiKey,
          blockLabel: block.label,
          blockSkin: block.skin,
          pageLabel,
          projectName,
          projectDescription: description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la g\u00e9n\u00e9ration du contenu.");
        return;
      }

      const { copy } = await res.json();
      const header = `\n\n## ${block.label}\n`;
      const newDesc = description
        ? description.trimEnd() + header + copy
        : `## ${block.label}\n` + copy;
      onChange("description", newDesc);
    } catch {
      alert("Erreur r\u00e9seau.");
    } finally {
      setGeneratingBlockId(null);
    }
  }, [pageLabel, projectName, description, onChange]);

  // Determine which canvas mode options are available
  const hasBlocks = blocks.length > 0;
  const hasWireframe = !!html;

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Canvas display mode toggle ─── */}
      <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--bg-hover)" }}>
        <button
          onClick={() => handleSetCanvasMode(undefined)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-all flex-1 justify-center"
          style={{
            background: !canvasMode ? "var(--elevated)" : "transparent",
            color: !canvasMode ? "var(--text-primary)" : "var(--text-faint)",
            boxShadow: !canvasMode ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <EyeOff className="w-3 h-3" />
          {`Masqu\u00e9`}
        </button>
        {hasBlocks && (
          <button
            onClick={() => handleSetCanvasMode("zoning")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-all flex-1 justify-center"
            style={{
              background: canvasMode === "zoning" ? "var(--elevated)" : "transparent",
              color: canvasMode === "zoning" ? "var(--accent)" : "var(--text-faint)",
              boxShadow: canvasMode === "zoning" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Layers className="w-3 h-3" />
            Zoning
          </button>
        )}
        {hasWireframe && (
          <button
            onClick={() => handleSetCanvasMode("wireframe")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-all flex-1 justify-center"
            style={{
              background: canvasMode === "wireframe" ? "var(--elevated)" : "transparent",
              color: canvasMode === "wireframe" ? "var(--accent)" : "var(--text-faint)",
              boxShadow: canvasMode === "wireframe" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Layout className="w-3 h-3" />
            Wireframe
          </button>
        )}
      </div>

      {/* ─── Wireframe preview ─── */}
      {hasWireframe && (
        <ErrorBoundary
          resetKey={(html || "").length}
          label="Aperçu wireframe indisponible"
          fallback={
            <div
              className="rounded-md px-3 py-2 text-2xs"
              style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--text-muted)" }}
            >
              Le rendu a échoué — le HTML est peut-être invalide.
            </div>
          }
        >
          <WireframeThumb html={html!} />
        </ErrorBoundary>
      )}

      {/* ─── Zoning blocks (hidden when wireframe exists) ─── */}
      {hasBlocks && !hasWireframe && (
        <div className="flex flex-col gap-1.5">
          {blocks.map((block, i) => (
            <BlockRow
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
              onRemove={() => handleRemoveBlock(i)}
              onMoveUp={() => handleMoveUp(i)}
              onMoveDown={() => handleMoveDown(i)}
              onGenerateCopy={() => handleGenerateCopy(block)}
              isGenerating={generatingBlockId === block.id}
            />
          ))}
        </div>
      )}

      {/* ─── Add block (hidden when wireframe exists) ─── */}
      {!hasWireframe && showPicker ? (
        <div className="rounded-lg border border-accent/30 bg-bg-surface p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-medium" style={{ color: "var(--text-secondary)" }}>Choisir un bloc</span>
            <button onClick={() => setShowPicker(false)} className="p-0.5 rounded hover:bg-bg-hover transition-colors">
              <X className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {SKIN_CATALOG.map((item) => (
              <CatalogItem key={item.skin} skin={item.skin} label={item.label} height={item.height} onAdd={() => handleAddBlock(item)} />
            ))}
          </div>
        </div>
      ) : !hasWireframe ? (
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-line hover:border-accent/40 hover:bg-accent-muted/10 transition-all group"
        >
          <Plus className="w-3.5 h-3.5 text-label-faint group-hover:text-accent transition-colors" />
          <span className="text-xs text-label-faint group-hover:text-accent transition-colors font-medium">
            Ajouter un bloc
          </span>
        </button>
      ) : null}
    </div>
  );
}
