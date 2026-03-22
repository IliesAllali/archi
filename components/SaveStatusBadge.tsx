"use client";

import { useCanvasStore } from "@/store/canvas-store";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";

const statusConfig = {
  saved: { icon: "cloud", label: "Sauvegard\u00e9", color: "var(--text-faint)" },
  saving: { icon: "loader", label: "Sauvegarde...", color: "var(--text-muted)" },
  error: { icon: "alert", label: "Non sauvegard\u00e9", color: "#EF4444" },
  unsaved: { icon: "dot", label: "Modifi\u00e9", color: "var(--text-muted)" },
} as const;

export default function SaveStatusBadge() {
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const saveError = useCanvasStore((s) => s.saveError);

  const config = statusConfig[saveStatus] || statusConfig.unsaved;
  const isError = saveStatus === "error";
  const isSaving = saveStatus === "saving";

  const inner = (
    <>
      <span className="relative w-3 h-3 shrink-0">
        <Cloud
          className="w-3 h-3 absolute inset-0 transition-opacity duration-200"
          style={{ opacity: config.icon === "cloud" ? 1 : 0 }}
        />
        <Loader2
          className="w-3 h-3 absolute inset-0 animate-spin transition-opacity duration-200"
          style={{ opacity: config.icon === "loader" ? 1 : 0 }}
        />
        <AlertCircle
          className="w-3 h-3 absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: config.icon === "alert" ? 1 : 0,
            animation: isError ? "save-pulse 1.5s ease-in-out infinite" : "none",
          }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-[3px] left-[3px] transition-opacity duration-200"
          style={{ opacity: config.icon === "dot" ? 1 : 0 }}
        />
      </span>
      <span
        className={`transition-all duration-200 ${saveStatus === "saved" || saveStatus === "unsaved" ? "hidden sm:inline" : ""}`}
      >
        {config.label}
      </span>
      <style jsx>{`
        @keyframes save-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );

  if (isError) {
    return (
      <button
        onClick={() => useCanvasStore.setState({ saveStatus: "unsaved", pendingSave: true })}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs transition-colors duration-150 hover:bg-red-500/10"
        style={{ color: config.color }}
        title={saveError || "Erreur de sauvegarde \u2014 cliquer pour r\u00e9essayer"}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs transition-colors duration-150"
      style={{ color: config.color }}
    >
      {inner}
    </div>
  );
}
