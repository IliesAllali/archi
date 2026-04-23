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
    // Cancelled flag so in-flight async ops stop writing to the store after unmount / project change
    let cancelled = false;

    const socket = io({
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    const clearHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    socket.on("connect", () => {
      if (cancelled) return;
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

      // Always clear the previous heartbeat before starting a new one —
      // reconnects otherwise stack intervals.
      clearHeartbeat();
      heartbeatRef.current = setInterval(() => {
        socket.emit("heartbeat", { projectId });
      }, HEARTBEAT_INTERVAL);
    });

    socket.on("presence-update", ({ users }: { users: PresenceUser[] }) => {
      if (cancelled) return;
      const others = users.filter((u) => u.id !== myId);
      usePresenceStore.getState().setOtherUsers(others);
    });

    socket.on("nodes-updated", async ({ projectId: pid }: { projectId: string }) => {
      if (cancelled || pid !== projectId) return;

      // Skip if we just saved (our own event bouncing back)
      if (Date.now() - lastSaveRef.current < 2000) return;

      const store = useCanvasStore.getState();
      if (store.saveStatus === "saving" || store.pendingSave) return;

      try {
        const res = await fetch(`/api/projects/${projectId}/nodes`);
        if (cancelled || !res.ok) return;
        const rawNodes: SiteNode[] = await res.json();
        const freshNodes = rawNodes.map(migrateNodeZoning);

        // Re-check after the async fetch — if the user made a local edit while we were
        // fetching, their unsaved work would get clobbered by the stale server state.
        const current = useCanvasStore.getState();
        if (cancelled || current.saveStatus === "saving" || current.pendingSave || current.saveStatus === "unsaved") return;

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
      clearHeartbeat();
      if (!cancelled) usePresenceStore.getState().setOtherUsers([]);
    });

    // Track our own saves to ignore bounced-back events
    const unsubSave = useCanvasStore.subscribe((state, prev) => {
      if (prev.saveStatus === "saving" && state.saveStatus === "saved") {
        lastSaveRef.current = Date.now();
      }
    });

    return () => {
      cancelled = true;
      clearHeartbeat();
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
