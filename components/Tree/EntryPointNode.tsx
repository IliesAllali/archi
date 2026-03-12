"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { EntryPoint } from "@/lib/types";

interface EntryPointGroupData {
  entryPoints: EntryPoint[];
  targetId: string;
}

/* ─── Google search bar ─── */
function GoogleSearchEntry({ query }: { query: string }) {
  return (
    <div
      className="flex items-center gap-[5px] h-[18px] px-[6px] rounded-full"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Google "G" logo */}
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span className="text-[7px] text-white/40 truncate max-w-[100px]">{query}</span>
    </div>
  );
}

/* ─── Other entry point types ─── */
function EntryBadge({ type, label }: { type: string; label: string }) {
  const configs: Record<string, { icon: string; color: string; bg: string }> = {
    social: { icon: "in", color: "#E1306C", bg: "rgba(225,48,108,0.1)" },
    ads: { icon: "Ad", color: "#FBBC04", bg: "rgba(251,188,4,0.1)" },
    direct: { icon: "→", color: "#34A853", bg: "rgba(52,168,83,0.1)" },
    nav: { icon: "↳", color: "#8B8B93", bg: "rgba(139,139,147,0.08)" },
    email: { icon: "@", color: "#8B8B93", bg: "rgba(139,139,147,0.08)" },
    qrcode: { icon: "QR", color: "#8B8B93", bg: "rgba(139,139,147,0.08)" },
  };

  const cfg = configs[type] || configs.nav;

  return (
    <div
      className="flex items-center gap-[4px] h-[14px] px-[5px] rounded-full text-[7px] leading-none"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}20`, color: cfg.color }}
    >
      <span className="font-semibold">{cfg.icon}</span>
      <span className="text-white/35 truncate max-w-[80px]">{label}</span>
    </div>
  );
}

function EntryPointNodeComponent({ data }: NodeProps<EntryPointGroupData>) {
  return (
    <>
      <div className="flex flex-col items-center gap-[3px]">
        {data.entryPoints.map((ep, i) => (
          <div key={i}>
            {ep.type === "google" ? (
              <GoogleSearchEntry query={ep.label} />
            ) : (
              <EntryBadge type={ep.type} label={ep.label} />
            )}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
    </>
  );
}

export default memo(EntryPointNodeComponent);
