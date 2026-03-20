"use client";

import { useCanvasStore } from "@/store/canvas-store";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";

export default function SaveStatusBadge() {
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const saveError = useCanvasStore((s) => s.saveError);

  if (saveStatus === "saved") {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs"
        style={{ color: "var(--text-faint)" }}
      >
        <Cloud className="w-3 h-3" />
        <span>Sauvegardé</span>
      </div>
    );
  }

  if (saveStatus === "saving") {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs"
        style={{ color: "var(--text-muted)" }}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Sauvegarde...</span>
      </div>
    );
  }

  if (saveStatus === "error") {
    return (
      <button
        onClick={() => useCanvasStore.setState({ saveStatus: "unsaved", pendingSave: true })}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs transition-colors hover:bg-red-500/10"
        style={{ color: "#EF4444" }}
        title={saveError || "Erreur de sauvegarde — cliquer pour réessayer"}
      >
        <AlertCircle className="w-3 h-3" />
        <span className="hidden sm:inline">Non sauvegardé</span>
      </button>
    );
  }

  // unsaved
  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs"
      style={{ color: "var(--text-muted)" }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      <span>Modifié</span>
    </div>
  );
}
