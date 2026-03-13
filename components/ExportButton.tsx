"use client";

import { useState, useCallback } from "react";
import { FileDown, Loader2, Check } from "lucide-react";
import type { Project } from "@/lib/types";

interface ExportButtonProps {
  project: Project;
}

type ExportState = "idle" | "capturing" | "rendering" | "done" | "error";

const STATE_LABEL: Record<ExportState, string> = {
  idle: "PDF",
  capturing: "Capture…",
  rendering: "Génération…",
  done: "Téléchargé",
  error: "Erreur",
};

export default function ExportButton({ project }: ExportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");

  const handleExport = useCallback(async () => {
    if (state !== "idle") return;

    try {
      // Step 1 — fit view (zoom ≤ 1) then capture the tree with html2canvas
      setState("capturing");

      // Ask Canvas to fit+reset zoom, wait for confirmation
      await new Promise<void>((resolve) => {
        const onReady = () => {
          window.removeEventListener("arbo:export-ready", onReady);
          resolve();
        };
        window.addEventListener("arbo:export-ready", onReady);
        window.dispatchEvent(new CustomEvent("arbo:prepare-export"));
        // Safety fallback — resolve after 1.5s even if event never fires
        setTimeout(resolve, 1500);
      });

      const { toPng } = await import("html-to-image");

      const rfContainer = document.querySelector(".react-flow") as HTMLElement;
      if (!rfContainer) {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        return;
      }

      // Inline computed styles on SVG edges so they survive serialization
      const cleanups: (() => void)[] = [];
      rfContainer.querySelectorAll(".react-flow__edge path, .react-flow__edge line, .react-flow__edge polyline, .react-flow__edge circle").forEach((el) => {
        const computed = window.getComputedStyle(el);
        const prev = (el as HTMLElement).getAttribute("style") || "";
        const inlined = `stroke: ${computed.stroke}; stroke-width: ${computed.strokeWidth}; fill: ${computed.fill}; opacity: ${computed.opacity};`;
        (el as HTMLElement).setAttribute("style", prev + ";" + inlined);
        cleanups.push(() => (el as HTMLElement).setAttribute("style", prev));
      });

      const treeImageDataUrl = await toPng(rfContainer, {
        backgroundColor: "#f5f5f7",
        pixelRatio: 3,
        filter: (el: HTMLElement) => {
          if (!(el instanceof HTMLElement)) return true;
          return (
            !el.classList.contains("react-flow__controls") &&
            !el.classList.contains("react-flow__minimap") &&
            !el.classList.contains("react-flow__panel")
          );
        },
      });

      cleanups.forEach((fn) => fn());

      // Step 2 — build PDF document
      setState("rendering");

      const { PDFDocumentComponent } = await import("@/components/PDF/PDFDocument");
      const { pdf } = await import("@react-pdf/renderer");
      const React = (await import("react")).default;

      const doc = React.createElement(PDFDocumentComponent, {
        project,
        treeImageDataUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

      const blob = await pdf(doc).toBlob();

      // Step 3 — trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.id}-${project.version}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      console.error("PDF export failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }, [state, project]);

  const isLoading = state === "capturing" || state === "rendering";
  const isDone = state === "done";
  const isError = state === "error";

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-2xs font-medium transition-all duration-150 disabled:cursor-wait active:scale-95"
      style={{
        color: isDone
          ? "var(--success-text)"
          : isError
          ? "var(--error-text)"
          : "var(--text-muted)",
        background: isDone
          ? "var(--success-bg)"
          : isError
          ? "var(--error-glow)"
          : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !isDone && !isError) {
          e.currentTarget.style.background = "var(--surface-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading && !isDone && !isError) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-muted)";
        }
      }}
      data-tooltip="Exporter en PDF (cover + arbre + pages)"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : isDone ? (
        <Check className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <FileDown className="w-3.5 h-3.5 shrink-0" />
      )}
      <span>{STATE_LABEL[state]}</span>
    </button>
  );
}
