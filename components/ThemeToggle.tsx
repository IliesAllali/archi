"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="
        w-8 h-8 rounded-lg flex items-center justify-center
        transition-all duration-200
        hover:scale-110 active:scale-90
      "
      style={{
        background: "var(--controls-bg)",
        border: "1px solid var(--line)",
      }}
      data-tooltip={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      <span key={theme} className="animate-spin-in flex items-center justify-center">
        {theme === "dark" ? (
          <Sun className="w-3.5 h-3.5" style={{ color: "var(--controls-fill)" }} />
        ) : (
          <Moon className="w-3.5 h-3.5" style={{ color: "var(--controls-fill)" }} />
        )}
      </span>
    </button>
  );
}
