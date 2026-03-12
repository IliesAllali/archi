"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Home,
  LayoutGrid,
  FileText,
  PenLine,
  Sparkles,
  HelpCircle,
  Search,
  AlertTriangle,
  Scale,
  ChevronDown,
} from "lucide-react";
import type { SiteNode, PageType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<PageType, React.ElementType> = {
  home: Home,
  listing: LayoutGrid,
  detail: FileText,
  form: PenLine,
  landing: Sparkles,
  quiz: HelpCircle,
  search: Search,
  error: AlertTriangle,
  legal: Scale,
};

const TYPE_LABEL: Record<PageType, string> = {
  home: "Accueil",
  listing: "Listing",
  detail: "Détail",
  form: "Formulaire",
  landing: "Landing",
  quiz: "Quiz",
  search: "Recherche",
  error: "Erreur",
  legal: "Légal",
};

function SiteNodeComponent({ data, selected }: NodeProps<SiteNode>) {
  const Icon = ICON_MAP[data.type] || FileText;
  const childCount = data.children?.length || 0;
  const hasEntryPoints = data.entryPoints && data.entryPoints.length > 0;

  const priorityStyles = useMemo(() => {
    switch (data.priority) {
      case "primary":
        return {
          border: selected ? "border-accent" : "border-line-strong",
          bg: selected ? "bg-accent-muted" : "bg-bg-surface",
          badge: "bg-accent-muted text-accent",
        };
      case "secondary":
        return {
          border: selected ? "border-accent" : "border-line",
          bg: selected ? "bg-accent-muted" : "bg-bg-surface",
          badge: "bg-bg-hover text-label-secondary",
        };
      case "utility":
        return {
          border: selected ? "border-accent" : "border-line border-dashed",
          bg: selected ? "bg-accent-muted" : "bg-bg-base",
          badge: "bg-bg-elevated text-label-muted",
        };
    }
  }, [data.priority, selected]);

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className={cn(
          "w-[220px] rounded-node border cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:translate-y-[-1px]",
          "active:translate-y-[0px] active:shadow-none",
          priorityStyles.border,
          priorityStyles.bg,
          selected && "ring-1 ring-accent/30 shadow-[0_0_24px_rgba(94,106,210,0.1)]",
          !selected && "hover:border-line-strong"
        )}
      >
        {/* Entry points indicator */}
        {hasEntryPoints && (
          <div className="flex items-center gap-1 px-3 pt-2">
            {data.entryPoints!.slice(0, 3).map((ep, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{
                  backgroundColor:
                    ep.type === "google" ? "#4285F4" :
                    ep.type === "social" ? "#E1306C" :
                    ep.type === "ads" ? "#FBBC04" :
                    ep.type === "nav" ? "var(--accent, #5E6AD2)" :
                    "#8B8B93",
                }}
              />
            ))}
            {data.entryPoints!.length > 3 && (
              <span className="text-[8px] text-label-faint ml-0.5">+{data.entryPoints!.length - 3}</span>
            )}
          </div>
        )}

        {/* Header */}
        <div className={cn("px-3 pb-1.5 flex items-start justify-between gap-2", hasEntryPoints ? "pt-1" : "pt-2.5")}>
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={cn(
              "w-3.5 h-3.5 shrink-0 transition-colors duration-150",
              selected ? "text-accent" : "text-label-muted"
            )} />
            <span className="text-sm font-medium text-label-primary truncate leading-tight">
              {data.label}
            </span>
          </div>
          <span
            className={cn(
              "text-2xs font-medium px-1.5 py-0.5 rounded shrink-0 leading-none",
              priorityStyles.badge
            )}
          >
            {TYPE_LABEL[data.type]}
          </span>
        </div>

        {/* Description */}
        <div className="px-3 pb-2">
          <p className="text-2xs text-label-muted leading-relaxed line-clamp-2">
            {data.description}
          </p>
        </div>

        {/* Footer — child count */}
        {childCount > 0 && (
          <div className="px-3 pb-2 flex items-center gap-1">
            <ChevronDown className="w-3 h-3 text-label-faint" />
            <span className="text-2xs text-label-faint">
              {childCount} {childCount === 1 ? "page" : "pages"}
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(SiteNodeComponent);
