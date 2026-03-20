"use client";

import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  ClipboardPaste,
  X,
  Code,
  ClipboardCheck,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import type { NodeData, ZoningBlock } from "@/lib/types";
import { SKIN_CATALOG, generateBlockId } from "@/lib/types";
import {
  SKIN_MAP,
  SECTION_COLORS,
  SECTION_BORDER_COLORS,
} from "@/components/Tree/SiteNode";

/* ─── Prompt builder ─── */

function buildPrompt(pageType: string, pageLabel: string, blocks: ZoningBlock[]): string {
  const blockList = blocks.length > 0
    ? `\nBlocs actuels (reproduis cette structure) :\n${blocks.map((b, i) => `${i + 1}. ${b.label} (type: ${b.skin}, hauteur indicative: ${b.height}px)`).join("\n")}`
    : "";
  return `Tu es un expert UX/UI. Génère le zoning (wireframe haute-fidélité) en HTML/CSS inline pour :

Page : "${pageLabel}"
Type : ${pageType}${blockList}

## Règles
- Wireframe en tons gris uniquement (pas de vraies images, pas de vraies couleurs)
- Blocs gris arrondis pour simuler le texte, rectangles gris pour les images, boutons stylisés
- Navbar en haut, sections empilées verticalement, footer en bas
- Pas de JavaScript, pas de polices externes, uniquement HTML + CSS inline
- Largeur : 100%, responsive
- Le HTML doit être prêt à coller directement dans un iframe

## Exemple d'un bloc Hero en wireframe

\`\`\`html
<div style="background:#f4f4f5;padding:48px 24px;text-align:center;">
  <div style="width:60%;height:14px;background:#d1d5db;border-radius:6px;margin:0 auto 12px;"></div>
  <div style="width:40%;height:10px;background:#e5e7eb;border-radius:4px;margin:0 auto 20px;"></div>
  <div style="display:inline-flex;gap:8px;">
    <div style="padding:8px 20px;background:#9ca3af;border-radius:6px;"></div>
    <div style="padding:8px 20px;border:1px solid #d1d5db;border-radius:6px;"></div>
  </div>
</div>
\`\`\`

Reproduis ce style pour chaque section de la page. Renvoie uniquement le HTML complet, sans explication.`;
}

/* ─── Block skin preview (same rendering as canvas) ─── */

function BlockPreview({ skin, height }: { skin: string; height: number }) {
  const Skin = SKIN_MAP[skin];
  const bg = SECTION_COLORS[skin] || "var(--wireframe-faint)";
  const border = SECTION_BORDER_COLORS[skin] || "var(--wireframe-strong)";

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ background: bg, borderLeft: `3px solid ${border}` }}
    >
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

function CatalogItem({
  skin,
  label,
  height,
  onAdd,
}: {
  skin: string;
  label: string;
  height: number;
  onAdd: () => void;
}) {
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

/* ─── Single block row in the editor ─── */

function BlockRow({
  block,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: ZoningBlock;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="group/row flex gap-2 items-stretch rounded-md border border-line bg-bg-surface hover:border-line-strong transition-colors overflow-hidden">
      {/* Reorder controls */}
      <div className="flex flex-col items-center justify-center w-5 shrink-0 bg-bg-elevated/50 border-r border-line">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-0.5 disabled:opacity-20 hover:text-accent transition-colors"
          style={{ color: "var(--text-faint)" }}
        >
          <ChevronUp className="w-2.5 h-2.5" />
        </button>
        <GripVertical className="w-2.5 h-2.5 my-0.5" style={{ color: "var(--text-faint)", opacity: 0.4 }} />
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-0.5 disabled:opacity-20 hover:text-accent transition-colors"
          style={{ color: "var(--text-faint)" }}
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Wireframe preview */}
      <div className="flex-1 py-1.5 pr-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            {block.label}
          </span>
        </div>
        <BlockPreview skin={block.skin} height={block.height} />
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="self-center mr-1.5 p-1 rounded opacity-0 group-hover/row:opacity-100 hover:bg-red-500/10 transition-all"
        title="Supprimer"
      >
        <Trash2 className="w-3 h-3" style={{ color: "var(--error-text)" }} />
      </button>
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
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function ZoningEditor({ pageType, pageLabel, blocks, expanded, html, accent, onChange }: ZoningEditorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showHtmlMode, setShowHtmlMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(html || "");
  const [promptCopied, setPromptCopied] = useState(false);

  const isHtmlMode = !!html;

  const handleToggleExpanded = () => onChange("zoningExpanded", !expanded);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(buildPrompt(pageType, pageLabel, blocks));
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
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

  const handlePasteHtml = () => {
    const trimmed = htmlDraft.trim();
    if (trimmed) onChange("zoningHtml", trimmed);
    setShowHtmlMode(false);
  };

  const handleClearHtml = () => {
    onChange("zoningHtml", undefined);
    setHtmlDraft("");
    setShowHtmlMode(false);
  };

  const handleCopyHtml = async () => {
    if (html) await navigator.clipboard.writeText(html);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top bar — toggle only */}
      <div className="flex items-center">
        <button
          onClick={handleToggleExpanded}
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: expanded ? "var(--accent)" : "var(--text-muted)" }}
        >
          {expanded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{expanded ? "Visible sur le canvas" : "Masqué sur le canvas"}</span>
        </button>
      </div>

      {/* ── HTML custom mode ── */}
      {isHtmlMode && (
        <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-line bg-bg-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Code className="w-3 h-3" style={{ color: "var(--accent)" }} />
              <span className="text-2xs font-medium" style={{ color: "var(--text-secondary)" }}>HTML personnalisé</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleCopyHtml} className="p-1 rounded hover:bg-bg-hover transition-colors" title="Copier">
                <Copy className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
              </button>
              <button onClick={handleClearHtml} className="p-1 rounded hover:bg-bg-hover transition-colors" title="Revenir aux blocs">
                <X className="w-3 h-3" style={{ color: "var(--error-text)" }} />
              </button>
            </div>
          </div>
          <div className="rounded border border-line overflow-hidden">
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><style>body{margin:0;font-family:sans-serif;font-size:11px;color:#444;}</style></head><body>${html}</body></html>`}
              sandbox="allow-same-origin"
              className="w-full pointer-events-none"
              style={{ height: 200, border: "none" }}
              title="HTML preview"
            />
          </div>
        </div>
      )}

      {/* ── Block builder ── */}
      {!isHtmlMode && (
        <>
          {/* Current blocks */}
          {blocks.length > 0 && (
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
                />
              ))}
            </div>
          )}

          {blocks.length === 0 && (
            <div className="rounded-lg border border-dashed border-line p-6 flex flex-col items-center justify-center gap-1.5">
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>Aucun bloc</span>
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                Ajoutez des blocs ou collez du HTML
              </span>
            </div>
          )}

          {/* Add block button / picker */}
          {showPicker ? (
            <div className="rounded-lg border border-accent/30 bg-bg-surface p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs font-medium" style={{ color: "var(--text-secondary)" }}>Choisir un bloc</span>
                <button onClick={() => setShowPicker(false)} className="p-0.5 rounded hover:bg-bg-hover transition-colors">
                  <X className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SKIN_CATALOG.map((item) => (
                  <CatalogItem
                    key={item.skin}
                    skin={item.skin}
                    label={item.label}
                    height={item.height}
                    onAdd={() => handleAddBlock(item)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-line hover:border-accent/40 hover:bg-accent-muted/10 transition-all group"
            >
              <Plus className="w-3.5 h-3.5 text-label-faint group-hover:text-accent transition-colors" />
              <span className="text-xs text-label-faint group-hover:text-accent transition-colors font-medium">
                Ajouter un bloc
              </span>
            </button>
          )}

          {/* Separator */}
          <div className="flex items-center gap-2 py-0.5">
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            <span className="text-2xs" style={{ color: "var(--text-faint)" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
          </div>

          {/* HTML paste + copy prompt row */}
          <div className="flex items-center gap-2">
            {showHtmlMode ? (
              <button
                onClick={() => { setShowHtmlMode(false); setHtmlDraft(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                <X className="w-3 h-3" />
                <span className="text-2xs">Annuler</span>
              </button>
            ) : (
              <button
                onClick={() => setShowHtmlMode(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-line hover:border-line-strong transition-colors group"
              >
                <ClipboardPaste className="w-3 h-3 text-label-faint group-hover:text-label-muted transition-colors" />
                <span className="text-2xs text-label-faint group-hover:text-label-muted transition-colors">
                  Coller du HTML
                </span>
              </button>
            )}
            <button
              onClick={handleCopyPrompt}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all group"
              style={{
                borderColor: promptCopied ? "var(--accent)" : "var(--line)",
                color: promptCopied ? "var(--accent)" : undefined,
              }}
              title="Copier un prompt LLM pour générer le HTML de ce zoning"
            >
              {promptCopied
                ? <ClipboardCheck className="w-3 h-3" style={{ color: "var(--accent)" }} />
                : <Copy className="w-3 h-3 text-label-faint group-hover:text-accent transition-colors" />}
              <span className="text-2xs text-label-faint group-hover:text-accent transition-colors">
                {promptCopied ? "Copié !" : "Copier prompt"}
              </span>
            </button>
          </div>

          {/* HTML textarea (expanded below) */}
          {showHtmlMode && (
            <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-line bg-bg-surface">
              <textarea
                value={htmlDraft}
                onChange={(e) => setHtmlDraft(e.target.value)}
                placeholder="Collez votre HTML ici..."
                rows={5}
                autoFocus
                className="w-full text-2xs font-mono bg-transparent border-none outline-none resize-none"
                style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
              />
              <button
                onClick={handlePasteHtml}
                disabled={!htmlDraft.trim()}
                className="self-end px-2.5 py-1 rounded text-2xs font-medium text-white transition-colors disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Appliquer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
