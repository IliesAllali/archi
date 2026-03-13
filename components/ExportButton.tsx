"use client";

import { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import type { Project } from "@/lib/types";

interface ExportButtonProps {
  project: Project;
}

export default function ExportButton({ project }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;

      // Target the ReactFlow viewport
      const target =
        document.querySelector(".react-flow__viewport") as HTMLElement ||
        document.querySelector(".react-flow") as HTMLElement;

      if (!target) {
        console.warn("Canvas element not found");
        setLoading(false);
        return;
      }

      const canvas = await html2canvas(target, {
        backgroundColor: "#09090b",
        scale: 2,
        useCORS: true,
        logging: false,
        width: target.scrollWidth,
        height: target.scrollHeight,
      });

      // Download as PNG
      const link = document.createElement("a");
      link.download = `${project.id}-${project.version}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, project.id, project.version]);

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-2xs font-medium text-label-muted hover:text-label-primary hover:bg-bg-hover active:bg-bg-active transition-all duration-100 disabled:opacity-50 disabled:cursor-wait"
      title="Exporter en PNG"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>Export</span>
    </button>
  );
}
