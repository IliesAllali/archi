"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { PresenceUser, SiteNode } from "@/lib/types";
import { migrateNodeZoning } from "@/lib/types";
import { usePresenceStore } from "./usePresenceStore";
import { useCanvasStore } from "@/store/canvas-store";

const HEARTBEAT_INTERVAL = 25_000;

interface UsePresenceOptions {
  projectId: string;
  userId?: string;
  displayName?: string;
  role?: string;
  color?: string;
  avatarUrl?: string | null;
}

/**
 * Connects to the Socket.IO server, joins the project room,
 * and syncs presence data directly into the Zustand store
 * (no local useState — avoids re-rendering the host component).
 */
export function usePresence({ projectId, userId, displayName, role, color, avatarUrl }: UsePresenceOptions) {
  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaveRef = useRef<number>(0);
  const myId = userId || "";

  useEffect(() => {
    const socket = io({
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-project", {
        projectId,
        userId: userId || undefined,
        guestId: !userId ? `guest-${Math.random().toString(36).slice(2, 8)}` : undefined,
        displayName: displayName || "Visiteur",
        role: role || "guest",
        color: color || undefined,
        avatarUrl: avatarUrl || null,
        isAI: false,
      });

      heartbeatRef.current = setInterval(() => {
        socket.emit("heartbeat", { projectId });
      }, HEARTBEAT_INTERVAL);
    });

    socket.on("presence-update", ({ users }: { users: PresenceUser[] }) => {
      const others = users.filter((u) => u.id !== myId);
      usePresenceStore.getState().setOtherUsers(others);
    });

    socket.on("nodes-updated", async ({ projectId: pid }: { projectId: string }) => {
      if (pid !== projectId) return;

      // Skip if we just saved (our own event bouncing back)
      if (Date.now() - lastSaveRef.current < 2000) return;

      const store = useCanvasStore.getState();
      if (store.saveStatus === "saving" || store.pendingSave) return;

      try {
        const res = await fetch(`/api/projects/${projectId}/nodes`);
        if (!res.ok) return;
        const rawNodes: SiteNode[] = await res.json();
        const freshNodes = rawNodes.map(migrateNodeZoning);

        const current = useCanvasStore.getState();
        if (current.saveStatus === "saving" || current.pendingSave) return;

        useCanvasStore.setState((state) => {
          state.nodes = freshNodes;
          state.nodeMap = new Map(freshNodes.map((n) => [n.id, n]));
          state.saveStatus = "saved";
        });
      } catch {
        // Silently ignore fetch errors
      }
    });

    socket.on("disconnect", () => {
      usePresenceStore.getState().setOtherUsers([]);
    });

    // Track our own saves to ignore bounced-back events
    const unsubSave = useCanvasStore.subscribe((state, prev) => {
      if (prev.saveStatus === "saving" && state.saveStatus === "saved") {
        lastSaveRef.current = Date.now();
      }
    });

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      unsubSave();
      socket.emit("leave-project", { projectId });
      socket.disconnect();
      socketRef.current = null;
      usePresenceStore.getState().setOtherUsers([]);
    };
  }, [projectId, userId, displayName, role, color, avatarUrl, myId]);

  const focusNode = useCallback((nodeId: string) => {
    socketRef.current?.emit("node-focus", { projectId, nodeId });
  }, [projectId]);

  const blurNode = useCallback(() => {
    socketRef.current?.emit("node-blur", { projectId });
  }, [projectId]);

  return { focusNode, blurNode };
}
