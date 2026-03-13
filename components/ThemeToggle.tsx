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
        hover:scale-105 active:scale-95
      "
      style={{
        background: "var(--controls-bg)",
        border: "1px solid var(--line)",
      }}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="w-3.5 h-3.5" style={{ color: "var(--controls-fill)" }} />
      ) : (
        <Moon className="w-3.5 h-3.5" style={{ color: "var(--controls-fill)" }} />
      )}
    </button>
  );
}
