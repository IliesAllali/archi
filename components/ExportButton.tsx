"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FileDown, Loader2, Check, Layout } from "lucide-react";
import type { Project } from "@/lib/types";
import { Events } from "@/lib/posthog";
import { composeWireframe } from "@/lib/wireframe-compose";
import { DEFAULT_WIREFRAME_SETTINGS } from "@/lib/types";

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

/** Render wireframe HTML in a hidden iframe and capture as PNG data URL */
async function captureWireframe(html: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1440px;height:900px;border:none;";
    document.body.appendChild(iframe);

    const cleanup = () => { try { document.body.removeChild(iframe); } catch { /* already removed */ } };

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 600)); // let fonts + layout settle
        const { toPng } = await import("html-to-image");
        const doc = iframe.contentDocument;
        if (!doc?.body) { cleanup(); reject(new Error("No iframe body")); return; }
        const dataUrl = await toPng(doc.body as HTMLElement, {
          backgroundColor: "#ffffff",
          pixelRatio: 1.5,
          width: 1440,
        });
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = () => { cleanup(); reject(new Error("iframe load error")); };
    iframe.srcdoc = html;
  });
}

export default function ExportButton({ project }: ExportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [includeWireframes, setIncludeWireframes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [planTier, setPlanTier] = useState<string>("free");
  const [branding, setBranding] = useState<{ logoUrl?: string | null; companyName?: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch plan tier + branding on mount
  useEffect(() => {
    fetch("/api/me/plan")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.tier) setPlanTier(data.tier) })
      .catch(() => {})
    fetch("/api/me/branding")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.enabled) setBranding(data) })
      .catch(() => {})
  }, []);

  const nodesWithWireframe = project.nodes.filter(n => !!n.zoningHtml);
  const hasWireframes = nodesWithWireframe.length > 0;

  const handleExport = useCallback(async () => {
    if (state !== "idle") return;
    setShowMenu(false);

    try {
      // Step 1 — fit view then capture the tree
      setState("capturing");

      // Ensure the sitemap canvas is visible even if we're on the wireframe tab
      const sitemapContainer = document.querySelector(".react-flow")?.closest("[style]") as HTMLElement | null;
      const wasHidden = sitemapContainer && sitemapContainer.style.display === "none";
      if (wasHidden && sitemapContainer) {
        sitemapContainer.style.display = "flex";
        sitemapContainer.style.position = "absolute";
        sitemapContainer.style.left = "-9999px";
        sitemapContainer.style.width = "100vw";
        sitemapContainer.style.height = "100vh";
      }

      await new Promise<void>((resolve) => {
        const onReady = () => {
          window.removeEventListener("arbo:export-ready", onReady);
          resolve();
        };
        window.addEventListener("arbo:export-ready", onReady);
        window.dispatchEvent(new CustomEvent("arbo:prepare-export"));
        setTimeout(resolve, 1500);
      });

      const { toPng } = await import("html-to-image");

      const rfContainer = document.querySelector(".react-flow") as HTMLElement;
      if (!rfContainer) {
        if (wasHidden && sitemapContainer) {
          sitemapContainer.style.display = "none";
          sitemapContainer.style.position = "";
          sitemapContainer.style.left = "";
          sitemapContainer.style.width = "";
          sitemapContainer.style.height = "";
        }
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        return;
      }

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

      // Restore sitemap visibility
      if (wasHidden && sitemapContainer) {
        sitemapContainer.style.display = "none";
        sitemapContainer.style.position = "";
        sitemapContainer.style.left = "";
        sitemapContainer.style.width = "";
        sitemapContainer.style.height = "";
      }

      // Step 2 — capture wireframes (if requested)
      setState("rendering");

      const wireframeImages: Record<string, string> = {};
      if (includeWireframes && hasWireframes) {
        const wfSettings = project.wireframeSettings
          ? { ...DEFAULT_WIREFRAME_SETTINGS, ...project.wireframeSettings }
          : DEFAULT_WIREFRAME_SETTINGS;

        for (const node of nodesWithWireframe) {
          try {
            const composed = composeWireframe(node.zoningHtml!, project.globalSections, wfSettings);
            wireframeImages[node.id] = await captureWireframe(composed);
          } catch {
            // skip failed captures silently
          }
        }
      }

      // Step 3 — build PDF document
      const { PDFDocumentComponent } = await import("@/components/PDF/PDFDocument");
      const { pdf } = await import("@react-pdf/renderer");
      const React = (await import("react")).default;

      const doc = React.createElement(PDFDocumentComponent, {
        project,
        treeImageDataUrl,
        wireframeImages: Object.keys(wireframeImages).length > 0 ? wireframeImages : undefined,
        planTier,
        branding,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

      const blob = await pdf(doc).toBlob();

      // Step 4 — trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.id}-${project.version}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setState("done");
      Events.pdfExported(project.nodes.length);
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      console.error("PDF export failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }, [state, project, includeWireframes, hasWireframes, nodesWithWireframe]);

  const isLoading = state === "capturing" || state === "rendering";
  const isDone = state === "done";
  const isError = state === "error";

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center">
        {/* Main export button */}
        <button
          onClick={hasWireframes ? () => setShowMenu(v => !v) : handleExport}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-2xs font-medium transition-[transform,color,background-color] duration-150 ease-out disabled:cursor-wait active:scale-[0.97]"
          style={{
            color: isDone ? "var(--success-text)" : isError ? "var(--error-text)" : "var(--text-muted)",
            background: isDone ? "var(--success-bg)" : isError ? "var(--error-glow)" : "transparent",
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
          data-tooltip={hasWireframes ? "Options d'export PDF" : "Exporter en PDF"}
        >
          <span className="relative w-3.5 h-3.5 shrink-0">
            <FileDown className="w-3.5 h-3.5 absolute inset-0 transition-opacity duration-200" style={{ opacity: !isLoading && !isDone ? 1 : 0 }} />
            <Loader2 className="w-3.5 h-3.5 absolute inset-0 animate-spin transition-opacity duration-200" style={{ opacity: isLoading ? 1 : 0 }} />
            <Check className="w-3.5 h-3.5 absolute inset-0 transition-[opacity,transform] duration-300" style={{ opacity: isDone ? 1 : 0, transform: isDone ? "scale(1)" : "scale(0.9)" }} />
          </span>
          <span className="transition-opacity duration-200">{STATE_LABEL[state]}</span>
        </button>
      </div>

      {/* Dropdown menu — only shown when wireframes exist */}
      {showMenu && !isLoading && hasWireframes && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--elevated)", border: "1px solid var(--line)", minWidth: 220 }}
        >
          {/* Wireframe toggle */}
          <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--line)" }}>
            <button
              onClick={() => setIncludeWireframes(v => !v)}
              className="flex items-center gap-2.5 w-full text-left"
            >
              <div
                className="w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0"
                style={{ background: includeWireframes ? "var(--accent)" : "var(--line-strong)" }}
              >
                <div
                  className="w-3 h-3 rounded-full absolute top-0.5 transition-all duration-200"
                  style={{ background: "#fff", left: includeWireframes ? 17 : 2, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <Layout className="w-3 h-3" style={{ color: includeWireframes ? "var(--accent)" : "var(--text-muted)" }} />
                  <span className="text-2xs font-medium" style={{ color: "var(--text-primary)" }}>
                    Inclure les wireframes
                  </span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {nodesWithWireframe.length} page{nodesWithWireframe.length > 1 ? "s" : ""} avec wireframe
                </p>
              </div>
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-2xs font-medium transition-colors"
            style={{ color: "var(--accent)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--accent-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <FileDown className="w-3.5 h-3.5" />
            Exporter le PDF
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
