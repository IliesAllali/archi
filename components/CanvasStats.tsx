"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project, PageType } from "@/lib/types";

interface CanvasStatsProps {
  project: Project;
  visible: boolean;
}

const TYPE_ICON: Partial<Record<PageType, string>> = {
  home: "⌂",
  listing: "☰",
  detail: "□",
  form: "✎",
  landing: "★",
  quiz: "?",
};

export default function CanvasStats({ project, visible }: CanvasStatsProps) {
  const stats = useMemo(() => {
    const nodes = project.nodes;
    const primary = nodes.filter((n) => n.priority === "primary").length;
    const secondary = nodes.filter((n) => n.priority === "secondary").length;
    const totalEstimate = nodes.reduce((sum, n) => sum + (n.estimate ?? 0), 0);

    // Type breakdown — only types with >1 occurrence
    const typeCounts: Partial<Record<PageType, number>> = {};
    for (const n of nodes) {
      typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1;
    }

    return { total: nodes.length, primary, secondary, totalEstimate, typeCounts };
  }, [project.nodes]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div
            className="flex items-center gap-0 rounded-full overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* Total */}
            <Pill accent>
              <span style={{ color: "var(--accent)" }}>{stats.total}</span>
              <span style={{ color: "var(--text-faint)" }}>pages</span>
            </Pill>

            <Divider />

            {/* Priority split */}
            <Pill>
              <Dot color="var(--accent)" />
              <span style={{ color: "var(--text-muted)" }}>{stats.primary}</span>
            </Pill>
            <Pill>
              <Dot color="var(--text-faint)" />
              <span style={{ color: "var(--text-muted)" }}>{stats.secondary}</span>
            </Pill>

            {/* Estimate if any */}
            {stats.totalEstimate > 0 && (
              <>
                <Divider />
                <Pill>
                  <span style={{ color: "var(--text-faint)" }}>⏱</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {stats.totalEstimate}h
                  </span>
                </Pill>
              </>
            )}

            <Divider />

            {/* Type chips */}
            <div className="flex items-center">
              {(Object.entries(stats.typeCounts) as [PageType, number][])
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([type, count]) => (
                  <Pill key={type}>
                    <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                      {TYPE_ICON[type] ?? "·"}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>{count}</span>
                  </Pill>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1.5"
      style={{
        background: accent ? "var(--accent-muted)" : "transparent",
      }}
    >
      <span className="text-2xs font-mono flex items-center gap-1">{children}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 self-center" style={{ background: "var(--line)" }} />;
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
