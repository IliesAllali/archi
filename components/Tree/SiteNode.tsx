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
          "w-[220px] rounded-node border transition-all duration-150",
          priorityStyles.border,
          priorityStyles.bg,
          selected && "ring-1 ring-accent/30 shadow-[0_0_20px_rgba(94,106,210,0.08)]"
        )}
      >
        {/* Header */}
        <div className="px-3 pt-2.5 pb-1.5 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-3.5 h-3.5 shrink-0 text-label-muted" />
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
