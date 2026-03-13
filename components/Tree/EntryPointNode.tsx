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
      className="flex items-center gap-[7px] h-[28px] px-[10px] rounded-full"
      style={{
        background: "var(--ep-bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--card-ring)",
        width: 196,
      }}
    >
      {/* Google "G" logo */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span className="text-[10.5px] truncate flex-1" style={{ color: "var(--text-secondary)" }}>{query}</span>
    </div>
  );
}

/* ─── Other entry point types ─── */
function EntryBadge({ type, label }: { type: string; label: string }) {
  const configs: Record<string, { icon: string; color: string }> = {
    social:  { icon: "IG", color: "#E1306C" },
    ads:     { icon: "Ad", color: "#FBBC04" },
    direct:  { icon: "→",  color: "#34A853" },
    nav:     { icon: "↳",  color: "#8B8B93" },
    email:   { icon: "@",  color: "#8B8B93" },
    qrcode:  { icon: "QR", color: "#5B8AF0" },
  };

  const cfg = configs[type] || configs.nav;

  return (
    <div
      className="flex items-center gap-[7px] h-[22px] px-[10px] rounded-full leading-none"
      style={{
        background: "var(--ep-bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1px solid ${cfg.color}30`,
        width: 196,
      }}
    >
      <span className="font-bold shrink-0" style={{ fontSize: "10px", color: cfg.color }}>{cfg.icon}</span>
      <span className="truncate flex-1" style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}

function EntryPointNodeComponent({ data }: NodeProps<EntryPointGroupData>) {
  return (
    <>
      <div className="flex flex-col items-center gap-[5px]">
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
