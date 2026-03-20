"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PresenceUser } from "@/lib/types";

interface Props {
  users: PresenceUser[];
  maxVisible?: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ user, size = 28 }: { user: PresenceUser; size?: number }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const initials = getInitials(user.displayName);
  const isAI = user.isAI;
  const nodeLabel = user.activeNodeId ? `sur ${user.activeNodeId}` : "en ligne";

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="rounded-full flex items-center justify-center font-medium text-white relative"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.38,
          backgroundColor: user.color,
          border: "2px solid var(--surface)",
          boxShadow: `0 0 0 1px ${user.color}40`,
        }}
      >
        {isAI ? "IA" : initials}
        {user.activeNodeId && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#22C55E", border: "2px solid var(--surface)" }}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none"
          >
            <div
              className="whitespace-nowrap px-2.5 py-1.5 rounded-md text-2xs"
              style={{
                background: "var(--elevated)",
                border: "1px solid var(--line)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                {user.displayName}
                {isAI && (
                  <span
                    className="ml-1 px-1 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: `${user.color}20`, color: user.color }}
                  >
                    IA
                  </span>
                )}
              </div>
              <div style={{ color: "var(--text-faint)" }}>
                {user.role === "owner" ? "Propriétaire" : user.role === "editor" ? "Éditeur" : user.role === "viewer" ? "Lecteur" : "Invité"}
                {" · "}
                {nodeLabel}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PresenceAvatars({ users, maxVisible = 5 }: Props) {
  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  if (users.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5">
      <AnimatePresence mode="popLayout">
        {visible.map((user) => (
          <Avatar key={user.id} user={user} />
        ))}
      </AnimatePresence>
      {overflow > 0 && (
        <div
          className="rounded-full flex items-center justify-center text-2xs font-medium"
          style={{
            width: 28,
            height: 28,
            background: "var(--bg-hover)",
            color: "var(--text-muted)",
            border: "2px solid var(--surface)",
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
