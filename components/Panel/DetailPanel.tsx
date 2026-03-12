"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  LayoutGrid,
  FileText,
  PenLine,
  Sparkles,
  HelpCircle,
  Search,
  AlertTriangle,
  Scale,
  Clock,
  Tag,
  MousePointerClick,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import type { SiteNode, Project, PageType, Priority } from "@/lib/types";
import ZoningPreview from "./ZoningPreview";

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

const PRIORITY_LABEL: Record<Priority, string> = {
  primary: "Principale",
  secondary: "Secondaire",
  utility: "Utilitaire",
};

interface DetailPanelProps {
  node: SiteNode | null;
  project: Project;
  onClose: () => void;
}

export default function DetailPanel({ node, project, onClose }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const Icon = node ? ICON_MAP[node.type] : FileText;

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          ref={panelRef}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 350 }}
          className="absolute top-0 right-0 h-full w-[380px] bg-bg-elevated border-l border-line z-50 flex flex-col"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-line shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-accent-muted flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-label-primary truncate">
                    {node.label}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xs text-label-muted">{TYPE_LABEL[node.type]}</span>
                    <span className="text-label-faint">·</span>
                    <span className="text-2xs text-label-muted">{PRIORITY_LABEL[node.priority]}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-bg-hover transition-colors"
              >
                <X className="w-4 h-4 text-label-muted" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Description */}
            <Section title="Description">
              <p className="text-sm text-label-secondary leading-relaxed">
                {node.description}
              </p>
            </Section>

            {/* Zoning */}
            <Section title="Zoning">
              <div className="rounded-lg border border-line overflow-hidden bg-bg-base">
                <ZoningPreview type={node.zoning} accent={project.accent} />
              </div>
            </Section>

            {/* Rationale */}
            {node.rationale && (
              <Section title="Rationale" icon={Lightbulb}>
                <p className="text-sm text-label-secondary leading-relaxed">
                  {node.rationale}
                </p>
              </Section>
            )}

            {/* Notes */}
            {node.notes && (
              <Section title="Notes" icon={MessageSquare}>
                <p className="text-sm text-label-secondary leading-relaxed">
                  {node.notes}
                </p>
              </Section>
            )}

            {/* CTAs */}
            {node.cta && node.cta.length > 0 && (
              <Section title="CTAs" icon={MousePointerClick}>
                <div className="flex flex-col gap-1.5">
                  {node.cta.map((cta, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-accent-muted border border-accent/10"
                    >
                      <MousePointerClick className="w-3 h-3 text-accent shrink-0" />
                      <span className="text-sm text-accent">{cta}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Tags */}
            {node.tags && node.tags.length > 0 && (
              <Section title="Tags" icon={Tag}>
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-2xs font-mono px-2 py-1 rounded bg-bg-hover border border-line text-label-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Estimate */}
            {node.estimate && (
              <Section title="Estimation" icon={Clock}>
                <span className="text-sm text-label-secondary">
                  {node.estimate}h
                </span>
              </Section>
            )}

            {/* Spacer */}
            <div className="h-8" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  icon: SectionIcon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-line/50">
      <div className="flex items-center gap-1.5 mb-2.5">
        {SectionIcon && <SectionIcon className="w-3 h-3 text-label-faint" />}
        <h3 className="text-2xs font-medium text-label-muted uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
