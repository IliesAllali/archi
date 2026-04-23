"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type { SiteNode, Project, NodeData, GlobalSection, WireframeSettings } from "@/lib/types";
import { migrateNodeZoning, DEFAULT_WIREFRAME_SETTINGS } from "@/lib/types";
import { Events } from "@/lib/posthog";

enableMapSet();

// ─── Types ──────────────────────────────────────────────────────────────────

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface DropIntent {
  type: "before" | "after" | "child";
  targetId: string;
  parentId: string | null;
}

interface NodeState {
  nodes: SiteNode[];
  nodeMap: Map<string, SiteNode>;
}

interface CanvasState {
  // Project context
  projectId: string;
  projectSlug: string;
  accent: string;
  globalSections: GlobalSection[];
  wireframeSettings: WireframeSettings;

  // Node data
  nodes: SiteNode[];
  nodeMap: Map<string, SiteNode>;

  // Selection & editing
  selectedNodeId: string | null;
  editingNodeId: string | null; // inline label editing
  editingField: string | null; // panel field being edited

  // Drag state (transient, not undo-able)
  dropIntent: DropIntent | null;
  setDropIntent: (intent: DropIntent | null) => void;

  // Undo/redo
  past: NodeState[];
  future: NodeState[];

  // Save state
  saveStatus: SaveStatus;
  pendingSave: boolean;
  saveError: string | null;
  _pendingTriggers: string[];

  // Actions — initialization
  initProject: (project: Project) => void;

  // Actions — selection
  selectNode: (nodeId: string | null) => void;
  startEditing: (nodeId: string) => void;
  stopEditing: () => void;

  // Actions — node mutations (local, then synced)
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  addNode: (parentId: string | null, position: "child" | "sibling", initialLabel?: string) => string;
  deleteNode: (nodeId: string, mode: "cascade" | "reparent") => void;
  reparentNode: (nodeId: string, newParentId: string | null) => void;
  moveNode: (nodeId: string, intent: DropIntent) => void;
  reorderSiblings: (parentId: string | null, orderedIds: string[]) => void;
  duplicateNode: (nodeId: string) => void;

  // Actions — multi-parent linking
  linkToParents: (nodeId: string, parentIds: string[]) => void;
  unlinkFromParent: (nodeId: string, parentId: string) => void;

  // Actions — cross-links (dashed, non-hierarchical)
  addCrossLinks: (nodeId: string, targetIds: string[]) => void;
  removeCrossLink: (nodeId: string, targetId: string) => void;

  // Actions — undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions — wireframe globals
  setGlobalSections: (sections: GlobalSection[]) => void;

  // Actions — save
  setSaveStatus: (status: SaveStatus) => void;
  markDirty: (trigger?: string) => void;

  // Internal
  _pushHistory: () => void;
  _rebuildNodeMap: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildNodeMap(nodes: SiteNode[]): Map<string, SiteNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function generateId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getParentId(nodeId: string, nodes: SiteNode[]): string | null {
  for (const node of nodes) {
    if (node.children.includes(nodeId)) return node.id;
  }
  return null;
}

function getSiblings(nodeId: string, nodes: SiteNode[]): string[] {
  const parentId = getParentId(nodeId, nodes);
  if (!parentId) {
    // Root-level nodes
    const allChildIds = new Set<string>();
    nodes.forEach((n) => n.children.forEach((c) => allChildIds.add(c)));
    return nodes.filter((n) => !allChildIds.has(n.id)).map((n) => n.id);
  }
  const parent = nodes.find((n) => n.id === parentId);
  return parent?.children ?? [];
}

const MAX_HISTORY = 50;

// ─── Store ──────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    projectId: "",
    projectSlug: "",
    accent: "#F76B15",
    globalSections: [],
    wireframeSettings: DEFAULT_WIREFRAME_SETTINGS,

    nodes: [],
    nodeMap: new Map(),

    selectedNodeId: null,
    editingNodeId: null,
    editingField: null,

    dropIntent: null,
    setDropIntent: (intent) => set((state) => { state.dropIntent = intent; }),

    past: [],
    future: [],

    saveStatus: "saved" as SaveStatus,
    pendingSave: false,
    saveError: null,
    _pendingTriggers: [] as string[],

    // ─── Initialization ───────────────────────────────────────────────────

    initProject: (project: Project) => {
      const migratedNodes = project.nodes.map(migrateNodeZoning);
      const current = get();
      const isSameProject = current.projectId === project.id && current.nodes.length > 0;

      set((state) => {
        if (isSameProject) {
          // Same project reload (e.g. after AI edit) — preserve undo history
          const snapshot: NodeState = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            nodeMap: buildNodeMap(JSON.parse(JSON.stringify(state.nodes))),
          };
          state.past.push(snapshot);
          if (state.past.length > MAX_HISTORY) state.past.shift();
          state.future = [];
        } else {
          // Different project — clean slate
          state.past = [];
          state.future = [];
          state.selectedNodeId = null;
          state.editingNodeId = null;
        }

        state.projectId = project.id;
        state.projectSlug = project.slug;
        state.accent = project.accent;
        state.globalSections = project.globalSections || [];
        state.wireframeSettings = project.wireframeSettings
          ? { ...DEFAULT_WIREFRAME_SETTINGS, ...project.wireframeSettings }
          : DEFAULT_WIREFRAME_SETTINGS;
        state.nodes = migratedNodes;
        state.nodeMap = buildNodeMap(migratedNodes);
        state.saveStatus = "saved";
        state.saveError = null;
      });
      Events.canvasOpened(migratedNodes.length, 0);
    },

    // ─── Selection ────────────────────────────────────────────────────────

    selectNode: (nodeId: string | null) => {
      set((state) => {
        if (state.editingNodeId && state.editingNodeId !== nodeId) {
          state.editingNodeId = null;
        }
        state.selectedNodeId = nodeId;
      });
    },

    startEditing: (nodeId: string) => {
      set((state) => {
        state.editingNodeId = nodeId;
        state.selectedNodeId = nodeId;
      });
    },

    stopEditing: () => {
      set((state) => {
        state.editingNodeId = null;
      });
    },

    // ─── Node mutations ──────────────────────────────────────────────────

    updateNodeLabel: (nodeId: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.label = trimmed;
          state.nodeMap = buildNodeMap(state.nodes);
        }
      });
      get().markDirty();
    },

    updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          Object.assign(node, data);
          state.nodeMap = buildNodeMap(state.nodes);
        }
      });
      get().markDirty();
    },

    addNode: (parentId: string | null, position: "child" | "sibling", initialLabel?: string): string => {
      const id = generateId();
      get()._pushHistory();

      set((state) => {
        const refNode = parentId ? state.nodes.find((n) => n.id === parentId) : null;

        const newNode: SiteNode = {
          id,
          label: initialLabel || "Nouvelle page",
          type: "detail",
          priority: refNode?.priority || "secondary",
          group: refNode?.group,
          description: "",
          children: [],
        };

        if (position === "child" && parentId) {
          const parent = state.nodes.find((n) => n.id === parentId);
          if (parent) {
            parent.children.push(id);
          }
        } else if (position === "sibling" && parentId) {
          const refParentId = getParentId(parentId, state.nodes);
          if (refParentId) {
            const refParent = state.nodes.find((n) => n.id === refParentId);
            if (refParent) {
              const idx = refParent.children.indexOf(parentId);
              refParent.children.splice(idx + 1, 0, id);
            }
          }
        }

        state.nodes.push(newNode);
        state.nodeMap = buildNodeMap(state.nodes);
        state.selectedNodeId = id;
        state.editingNodeId = id;
      });

      get().markDirty("create_node");
      Events.nodeCreated("detail", "ui");
      return id;
    },

    deleteNode: (nodeId: string, mode: "cascade" | "reparent") => {
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const parentId = getParentId(nodeId, state.nodes);

        if (mode === "cascade") {
          // Collect all descendant IDs recursively
          const toDelete = new Set<string>();
          const collect = (nid: string) => {
            toDelete.add(nid);
            const n = state.nodes.find((x) => x.id === nid);
            n?.children.forEach(collect);
          };
          collect(nodeId);

          // Remove from parent's children
          if (parentId) {
            const parent = state.nodes.find((n) => n.id === parentId);
            if (parent) {
              parent.children = parent.children.filter((c) => c !== nodeId);
            }
          }

          state.nodes = state.nodes.filter((n) => !toDelete.has(n.id));
        } else {
          // Reparent: move children up to the deleted node's parent
          if (parentId) {
            const parent = state.nodes.find((n) => n.id === parentId);
            if (parent) {
              const idx = parent.children.indexOf(nodeId);
              parent.children.splice(idx, 1, ...node.children);
            }
          }
          state.nodes = state.nodes.filter((n) => n.id !== nodeId);
        }

        state.nodeMap = buildNodeMap(state.nodes);
        if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
        if (state.editingNodeId === nodeId) state.editingNodeId = null;
      });
      get().markDirty("delete_node");
      Events.nodeDeleted(mode === "cascade", "ui");
    },

    reparentNode: (nodeId: string, newParentId: string | null) => {
      get()._pushHistory();
      set((state) => {
        // Remove from old parent
        const oldParentId = getParentId(nodeId, state.nodes);
        if (oldParentId) {
          const oldParent = state.nodes.find((n) => n.id === oldParentId);
          if (oldParent) {
            oldParent.children = oldParent.children.filter((c) => c !== nodeId);
          }
        }

        // Add to new parent
        if (newParentId) {
          const newParent = state.nodes.find((n) => n.id === newParentId);
          if (newParent) {
            newParent.children.push(nodeId);
          }
        }

        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty("reparent");
    },

    moveNode: (nodeId: string, intent: DropIntent) => {
      get()._pushHistory();
      set((state) => {
        // Remove from old parent
        const oldParentId = getParentId(nodeId, state.nodes);
        if (oldParentId) {
          const oldParent = state.nodes.find((n) => n.id === oldParentId);
          if (oldParent) {
            oldParent.children = oldParent.children.filter((c) => c !== nodeId);
          }
        }

        if (intent.type === "child") {
          const newParent = state.nodes.find((n) => n.id === intent.targetId);
          if (newParent) {
            newParent.children.push(nodeId);
          }
        } else {
          // before or after a sibling
          const newParent = intent.parentId
            ? state.nodes.find((n) => n.id === intent.parentId)
            : null;

          if (newParent) {
            const targetIdx = newParent.children.indexOf(intent.targetId);
            const insertIdx = intent.type === "before" ? targetIdx : targetIdx + 1;
            newParent.children.splice(insertIdx, 0, nodeId);
          }
        }

        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty("reparent");
    },

    reorderSiblings: (parentId: string | null, orderedIds: string[]) => {
      get()._pushHistory();
      set((state) => {
        if (parentId) {
          const parent = state.nodes.find((n) => n.id === parentId);
          if (parent) {
            parent.children = orderedIds;
          }
        }
        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty();
    },

    duplicateNode: (nodeId: string) => {
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        // Deep-clone the subtree
        const idMap = new Map<string, string>();
        const cloneTree = (nid: string): SiteNode[] => {
          const n = state.nodes.find((x) => x.id === nid);
          if (!n) return [];
          const newId = generateId();
          idMap.set(nid, newId);
          const childClones = n.children.flatMap(cloneTree);
          const clone: SiteNode = {
            ...JSON.parse(JSON.stringify(n)),
            id: newId,
            label: nid === nodeId ? `${n.label} (copie)` : n.label,
            children: n.children.map((c) => idMap.get(c) || c),
          };
          return [clone, ...childClones];
        };

        const clones = cloneTree(nodeId);
        const newRootId = idMap.get(nodeId)!;

        // Add clone after original in parent's children
        const parentId = getParentId(nodeId, state.nodes);
        if (parentId) {
          const parent = state.nodes.find((n) => n.id === parentId);
          if (parent) {
            const idx = parent.children.indexOf(nodeId);
            parent.children.splice(idx + 1, 0, newRootId);
          }
        }

        state.nodes.push(...clones);
        state.nodeMap = buildNodeMap(state.nodes);
        state.selectedNodeId = newRootId;
      });
      get().markDirty("create_node");
    },

    // ─── Multi-parent linking ─────────────────────────────────────────────

    linkToParents: (nodeId: string, parentIds: string[]) => {
      if (parentIds.length === 0) return;
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return;
        const existing = new Set(node.secondaryParentIds || []);
        // Don't add the primary parent as secondary
        const primaryParentId = getParentId(nodeId, state.nodes);
        for (const pid of parentIds) {
          if (pid !== nodeId && pid !== primaryParentId && !existing.has(pid)) {
            existing.add(pid);
          }
        }
        node.secondaryParentIds = [...existing];
        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty("reparent");
    },

    unlinkFromParent: (nodeId: string, parentId: string) => {
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node || !node.secondaryParentIds) return;
        node.secondaryParentIds = node.secondaryParentIds.filter((id) => id !== parentId);
        if (node.secondaryParentIds.length === 0) delete node.secondaryParentIds;
        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty("reparent");
    },

    // ─── Cross-links (dashed, non-hierarchical) ──────────────────────────

    addCrossLinks: (nodeId: string, targetIds: string[]) => {
      if (targetIds.length === 0) return;
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return;
        const existing = new Set(node.links || []);
        for (const tid of targetIds) {
          if (tid !== nodeId && !existing.has(tid)) {
            existing.add(tid);
          }
        }
        node.links = [...existing];
        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty();
    },

    removeCrossLink: (nodeId: string, targetId: string) => {
      get()._pushHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node || !node.links) return;
        node.links = node.links.filter((id) => id !== targetId);
        if (node.links.length === 0) delete node.links;
        state.nodeMap = buildNodeMap(state.nodes);
      });
      get().markDirty();
    },

    // ─── Undo/Redo ────────────────────────────────────────────────────────

    undo: () => {
      const { past, nodes } = get();
      if (past.length === 0) return;

      const previous = past[past.length - 1];
      set((state) => {
        state.future.unshift({ nodes: state.nodes, nodeMap: state.nodeMap });
        if (state.future.length > MAX_HISTORY) state.future.pop();
        state.past.pop();
        state.nodes = previous.nodes;
        state.nodeMap = previous.nodeMap;
      });
      get().markDirty();
    },

    redo: () => {
      const { future } = get();
      if (future.length === 0) return;

      const next = future[0];
      set((state) => {
        state.past.push({ nodes: state.nodes, nodeMap: state.nodeMap });
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future.shift();
        state.nodes = next.nodes;
        state.nodeMap = next.nodeMap;
      });
      get().markDirty();
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    // ─── Wireframe globals ──────────────────────────────────────────────────

    setGlobalSections: (sections: GlobalSection[]) => {
      set((state) => { state.globalSections = sections; });
    },

    // ─── Save ──────────────────────────────────────────────────────────────

    setSaveStatus: (status: SaveStatus) => {
      set((state) => {
        state.saveStatus = status;
        if (status === "saved") state.saveError = null;
      });
    },

    markDirty: (trigger?: string) => {
      set((state) => {
        state.saveStatus = "unsaved";
        state.pendingSave = true;
        if (trigger && !state._pendingTriggers.includes(trigger)) {
          state._pendingTriggers.push(trigger);
        }
      });
    },

    // ─── Internal ──────────────────────────────────────────────────────────

    _pushHistory: () => {
      set((state) => {
        // Deep clone current nodes for the history entry
        const snapshot: NodeState = {
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          nodeMap: buildNodeMap(JSON.parse(JSON.stringify(state.nodes))),
        };
        state.past.push(snapshot);
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = []; // Clear redo on new action
      });
    },

    _rebuildNodeMap: () => {
      set((state) => {
        state.nodeMap = buildNodeMap(state.nodes);
      });
    },
  }))
);

// ─── Auto-save hook ───────────────────────────────────────────────────────

/**
 * Subscribe to store changes and debounce-save to the backend.
 * The returned function unsubscribes AND cancels any pending save —
 * critical when switching projects, otherwise a stale save can POST
 * nodes from the new project to the previous project's URL.
 */
export function setupAutoSave(projectId: string) {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  // Bumped on unsub — any in-flight or pending save ignores its result
  let cancelled = false;

  const unsub = useCanvasStore.subscribe((state) => {
    if (cancelled) return;
    if (state.saveStatus === "unsaved" && state.pendingSave) {
      if (saveTimeout) clearTimeout(saveTimeout);

      saveTimeout = setTimeout(async () => {
        if (cancelled) return;
        const current = useCanvasStore.getState();
        if (current.saveStatus !== "unsaved") return;

        const triggers = [...current._pendingTriggers];
        useCanvasStore.setState({ saveStatus: "saving", pendingSave: false, _pendingTriggers: [] });

        try {
          const csrfToken = getCsrfToken();
          const res = await fetch(`/api/projects/${projectId}/nodes/sync`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
            },
            body: JSON.stringify({ nodes: current.nodes, triggers }),
          });

          if (cancelled) return;
          if (!res.ok) {
            throw new Error(`Save failed: ${res.status}`);
          }

          useCanvasStore.setState({ saveStatus: "saved", saveError: null });
        } catch (err) {
          if (cancelled) return;
          useCanvasStore.setState({
            saveStatus: "error",
            saveError: err instanceof Error ? err.message : "Erreur de sauvegarde",
          });
        }
      }, 800);
    }
  });

  return () => {
    cancelled = true;
    if (saveTimeout) clearTimeout(saveTimeout);
    unsub();
  };
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}
