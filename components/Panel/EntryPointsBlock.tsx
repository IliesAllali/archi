"use client";

import { useState } from "react";
import {
  Search,
  Globe,
  ArrowRight,
  Share2,
  Mail,
  Megaphone,
  QrCode,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
import type { EntryPoint, EntryPointType } from "@/lib/types";

const ENTRY_TYPES: EntryPointType[] = ["google", "direct", "nav", "social", "email", "ads", "qrcode"];

const ENTRY_ICON: Record<EntryPointType, React.ElementType> = {
  google: Search,
  direct: Globe,
  nav: ArrowRight,
  social: Share2,
  email: Mail,
  ads: Megaphone,
  qrcode: QrCode,
};

const ENTRY_COLOR: Record<EntryPointType, string> = {
  google: "#4285F4",
  direct: "#8B8B93",
  nav: "#F76B15",
  social: "#E1306C",
  email: "#34A853",
  ads: "#FBBC04",
  qrcode: "#8B8B93",
};

const ENTRY_LABEL: Record<EntryPointType, string> = {
  google: "Google",
  direct: "URL directe",
  nav: "Navigation",
  social: "Social",
  email: "Email",
  ads: "Ads",
  qrcode: "QR Code",
};

interface EntryPointsBlockProps {
  entryPoints: EntryPoint[];
  onChange: (entryPoints: EntryPoint[]) => void;
}

export default function EntryPointsBlock({ entryPoints, onChange }: EntryPointsBlockProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<EntryPointType>("google");
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onChange([...entryPoints, { type: newType, label: trimmed }]);
    setNewLabel("");
    setShowAdd(false);
  };

  const handleRemove = (index: number) => {
    onChange(entryPoints.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-1.5">
      {entryPoints.map((ep, i) => {
        const Icon = ENTRY_ICON[ep.type];
        const color = ENTRY_COLOR[ep.type];

        if (ep.type === "google") {
          return (
            <div
              key={i}
              className="group flex items-center gap-0 rounded-lg border border-line bg-bg-base overflow-hidden transition-all duration-150 hover:border-line-strong"
            >
              <div className="flex items-center gap-2 px-2.5 py-2 border-r border-line bg-bg-surface shrink-0">
                <GoogleIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-label-secondary group-hover:text-label-primary transition-colors">
                  {ep.label}
                </span>
              </div>
              <button
                onClick={() => handleRemove(i)}
                className="pr-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Supprimer"
              >
                <X className="w-3 h-3" style={{ color: "var(--error-text)" }} />
              </button>
            </div>
          );
        }

        return (
          <div
            key={i}
            className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-line bg-bg-base transition-all duration-150 hover:border-line-strong"
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon className="w-3 h-3" style={{ color }} />
            </div>
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <span className="text-2xs font-medium text-label-muted shrink-0">
                {ENTRY_LABEL[ep.type]}
              </span>
              <span className="text-label-faint">·</span>
              <span className="text-xs text-label-secondary truncate group-hover:text-label-primary transition-colors">
                {ep.label}
              </span>
            </div>
            <button
              onClick={() => handleRemove(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              title="Supprimer"
            >
              <X className="w-3 h-3" style={{ color: "var(--error-text)" }} />
            </button>
          </div>
        );
      })}

      {/* Add form */}
      {showAdd ? (
        <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-accent/30 bg-accent-muted/30">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as EntryPointType)}
                className="appearance-none bg-transparent text-2xs font-medium outline-none cursor-pointer pr-4"
                style={{ color: "var(--text-secondary)" }}
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>{ENTRY_LABEL[t]}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ width: 10, height: 10, color: "var(--text-faint)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
                if (e.key === "Escape") { setShowAdd(false); setNewLabel(""); }
              }}
              placeholder={newType === "google" ? "Requête de recherche..." : "Label..."}
              autoFocus
              className="flex-1 text-xs bg-transparent border-none outline-none"
              style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="px-2 py-1 rounded text-2xs font-medium transition-colors disabled:opacity-40"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Ajouter
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewLabel(""); }}
              className="p-1 rounded hover:bg-bg-hover transition-colors"
            >
              <X className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-dashed border-line hover:border-accent/40 hover:bg-accent-muted/20 transition-all duration-150 group"
        >
          <Plus className="w-3 h-3 text-label-faint group-hover:text-accent transition-colors" />
          <span className="text-2xs text-label-faint group-hover:text-accent transition-colors">
            Ajouter un point d'entrée
          </span>
        </button>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
