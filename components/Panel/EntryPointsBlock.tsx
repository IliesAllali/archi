"use client";

import {
  Search,
  Globe,
  ArrowRight,
  Share2,
  Mail,
  Megaphone,
  QrCode,
} from "lucide-react";
import type { EntryPoint, EntryPointType } from "@/lib/types";

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
  nav: "#5E6AD2",
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
}

export default function EntryPointsBlock({ entryPoints }: EntryPointsBlockProps) {
  if (!entryPoints.length) return null;

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
              {/* Google icon area */}
              <div className="flex items-center gap-2 px-2.5 py-2 border-r border-line bg-bg-surface shrink-0">
                <GoogleIcon className="w-3.5 h-3.5" />
              </div>
              {/* Search query */}
              <div className="flex-1 px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-label-secondary group-hover:text-label-primary transition-colors">
                  {ep.label}
                </span>
              </div>
              <div className="pr-2.5">
                <Search className="w-3 h-3 text-label-faint" />
              </div>
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
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-2xs font-medium text-label-muted shrink-0">
                {ENTRY_LABEL[ep.type]}
              </span>
              <span className="text-label-faint">·</span>
              <span className="text-xs text-label-secondary truncate group-hover:text-label-primary transition-colors">
                {ep.label}
              </span>
            </div>
          </div>
        );
      })}
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
