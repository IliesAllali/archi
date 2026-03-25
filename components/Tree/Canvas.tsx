"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeDragHandler,
  BackgroundVariant,
} from "reactflow";
import { Link2 } from "lucide-react";
import "reactflow/dist/style.css";
import { computeLayout } from "@/lib/elk-layout";
import type { Project, SiteNode } from "@/lib/types";
import { useCanvasStore, type DropIntent } from "@/store/canvas-store";
import { Plus } from "lucide-react";
import SiteNodeComponent from "./SiteNode";
import EntryPointNodeComponent from "./EntryPointNode";
import DropIndicatorNode from "./DropIndicator";
import DetailPanel from "../Panel/DetailPanel";
import DeleteNodeModal from "../DeleteNodeModal";
import CommentOverlay from "../CommentOverlay";

const nodeTypes = {
  siteNode: SiteNodeComponent,
  entryPointNode: EntryPointNodeComponent,
  dropIndicator: DropIndicatorNode,
};

const DROP_INDICATOR_ID = "__drop_indicator__";
const PREVIEW_EDGE_ID = "__preview_edge__";
const SHIFT_GAP = 70;

interface CanvasProps {
  project: Project;
  externalSelectedNode?: SiteNode | null;
  onExternalSelectClear?: () => void;
  onOpenComments?: (nodeId: string) => void;
  readOnly?: boolean;
  currentUser?: { id: string; name: string } | null;
}

// ─── Helper: get parent of a node from store nodes ──────────────────────────

function getParentId(nodeId: string, storeNodes: SiteNode[]): string | null {
  for (const node of storeNodes) {
    if (node.children.includes(nodeId)) return node.id;
  }
  return null;
}

function isDescendantOf(ancestorId: string, candidateId: string, storeNodes: SiteNode[]): boolean {
  const ancestor = storeNodes.find((n) => n.id === ancestorId);
  if (!ancestor) return false;
  if (ancestor.children.includes(candidateId)) return true;
  return ancestor.children.some((c) => isDescendantOf(c, candidateId, storeNodes));
}

// ─── Drop intent calculation ────────────────────────────────────────────────

function calculateDropIntent(
  draggedNode: Node,
  baseNodes: Node[],
  storeNodes: SiteNode[],
): DropIntent | null {
  const dragCx = draggedNode.position.x + (draggedNode.width ?? 110) / 2;
  const dragCy = draggedNode.position.y + (draggedNode.height ?? 60) / 2;

  let bestIntent: DropIntent | null = null;
  let bestDist = Infinity;

  for (const rfNode of baseNodes) {
    if (rfNode.id === draggedNode.id || rfNode.id.startsWith("ep_") || rfNode.id === DROP_INDICATOR_ID) continue;

    const nx = rfNode.position.x;
    const ny = rfNode.position.y;
    const nw = rfNode.width ?? 110;
    const nh = rfNode.height ?? 60;
    const ncx = nx + nw / 2;
    const ncy = ny + nh / 2;

    // CHILD intent: dragging below this node
    const childZoneTop = ny + nh - 5;
    const childZoneBottom = ny + nh + 90;
    if (
      dragCy > childZoneTop &&
      dragCy < childZoneBottom &&
      dragCx > nx - 40 &&
      dragCx < nx + nw + 40
    ) {
      const dist = Math.sqrt((dragCx - ncx) ** 2 + (dragCy - (childZoneTop + 45)) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestIntent = { type: "child", targetId: rfNode.id, parentId: rfNode.id };
      }
    }

    // SIBLING intent: dragging at similar Y level
    const sameLayerTolerance = nh * 1.0;
    if (Math.abs(dragCy - ncy) < sameLayerTolerance) {
      if (dragCx < ncx) {
        // Left side → before
        const anchorX = nx - 15;
        const dist = Math.sqrt((dragCx - anchorX) ** 2 + (dragCy - ncy) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          const parentId = getParentId(rfNode.id, storeNodes);
          bestIntent = { type: "before", targetId: rfNode.id, parentId };
        }
      } else {
        // Right side → after
        const anchorX = nx + nw + 15;
        const dist = Math.sqrt((dragCx - anchorX) ** 2 + (dragCy - ncy) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          const parentId = getParentId(rfNode.id, storeNodes);
          bestIntent = { type: "after", targetId: rfNode.id, parentId };
        }
      }
    }
  }

  // Distance threshold
  if (bestDist > 180) return null;

  // Validate: don't reparent to self or own descendant
  if (bestIntent) {
    const newParent =
      bestIntent.type === "child" ? bestIntent.targetId : bestIntent.parentId;
    if (
      newParent === draggedNode.id ||
      (newParent && isDescendantOf(draggedNode.id, newParent, storeNodes))
    ) {
      return null;
    }
    // Don't drop next to self (no-op)
    if (bestIntent.type !== "child") {
      const currentParent = getParentId(draggedNode.id, storeNodes);
      if (currentParent === bestIntent.parentId && bestIntent.targetId === draggedNode.id) {
        return null;
      }
    }
  }

  return bestIntent;
}

// ─── Compute node shifts and indicator position ─────────────────────────────

function computeShiftsAndIndicator(
  intent: DropIntent,
  baseNodes: Node[],
  storeNodes: SiteNode[],
  draggedNodeId: string,
): {
  shifts: Map<string, number>;
  indicatorPos: { x: number; y: number; orientation: "vertical" | "horizontal" };
  previewEdgeTarget: { x: number; y: number };
} {
  const shifts = new Map<string, number>();
  let indicatorPos: { x: number; y: number; orientation: "vertical" | "horizontal" } = { x: 0, y: 0, orientation: "vertical" };
  let previewEdgeTarget = { x: 0, y: 0 };

  const targetRf = baseNodes.find((n) => n.id === intent.targetId);
  if (!targetRf) return { shifts, indicatorPos, previewEdgeTarget };

  const tw = targetRf.width ?? 110;
  const th = targetRf.height ?? 60;

  if (intent.type === "child") {
    // Indicator below the target
    indicatorPos = {
      x: targetRf.position.x + tw / 2 - 40,
      y: targetRf.position.y + th + 15,
      orientation: "horizontal",
    };
    previewEdgeTarget = {
      x: targetRf.position.x + tw / 2,
      y: targetRf.position.y + th + 30,
    };

    // Shift existing children of target to the right to make room
    const targetNode = storeNodes.find((n) => n.id === intent.targetId);
    if (targetNode) {
      for (const childId of targetNode.children) {
        if (childId !== draggedNodeId) {
          shifts.set(childId, SHIFT_GAP / 2);
        }
      }
    }
  } else {
    // Before or after sibling — find all siblings
    const parent = intent.parentId ? storeNodes.find((n) => n.id === intent.parentId) : null;
    const siblingIds = parent
      ? parent.children.filter((id) => id !== draggedNodeId)
      : [];

    // Sort by visual X
    const sortedSiblings = siblingIds
      .map((id) => ({ id, rf: baseNodes.find((n) => n.id === id) }))
      .filter((s) => s.rf)
      .sort((a, b) => (a.rf!.position.x) - (b.rf!.position.x));

    const targetIdx = sortedSiblings.findIndex((s) => s.id === intent.targetId);

    if (intent.type === "before") {
      // Vertical indicator to the left of target
      indicatorPos = {
        x: targetRf.position.x - 18,
        y: targetRf.position.y,
        orientation: "vertical",
      };
      // Shift target and all after to the right
      for (let i = targetIdx; i < sortedSiblings.length; i++) {
        shifts.set(sortedSiblings[i].id, SHIFT_GAP);
      }
    } else {
      // After: indicator to the right of target
      indicatorPos = {
        x: targetRf.position.x + tw + 12,
        y: targetRf.position.y,
        orientation: "vertical",
      };
      // Shift everything after target to the right
      for (let i = targetIdx + 1; i < sortedSiblings.length; i++) {
        shifts.set(sortedSiblings[i].id, SHIFT_GAP);
      }
    }

    // Preview edge comes from the parent
    previewEdgeTarget = {
      x: indicatorPos.x + (indicatorPos.orientation === "vertical" ? 1.5 : 40),
      y: indicatorPos.y + 25,
    };
  }

  return { shifts, indicatorPos, previewEdgeTarget };
}

// ─── Main Canvas ────────────────────────────────────────────────────────────

function CanvasInner({ project, externalSelectedNode, onExternalSelectClear, onOpenComments, readOnly = false, currentUser = null }: CanvasProps) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const { fitView, setCenter } = useReactFlow();
  const rfNodesRef = useRef<Node[]>([]);
  const rfEdgesRef = useRef<Edge[]>([]);
  const [deleteModalNodeId, setDeleteModalNodeId] = useState<string | null>(null);

  // Drag tracking
  const baseNodesRef = useRef<Node[]>([]);
  const baseEdgesRef = useRef<Edge[]>([]);
  const isDraggingRef = useRef(false);

  // Track new node for auto-focus
  const pendingFocusRef = useRef<string | null>(null);
  const prevNodeCountRef = useRef(0);

  // Store
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const editingNodeId = useCanvasStore((s) => s.editingNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const startEditing = useCanvasStore((s) => s.startEditing);
  const stopEditing = useCanvasStore((s) => s.stopEditing);
  const addNode = useCanvasStore((s) => s.addNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);
  const moveNode = useCanvasStore((s) => s.moveNode);
  const setDropIntent = useCanvasStore((s) => s.setDropIntent);

  // Alt key for drag-duplicate
  const altKeyRef = useRef(false);
  // Shift key for multi-parent linking
  const shiftKeyRef = useRef(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [stackedParents, setStackedParents] = useState<{ id: string; label: string; type: "child" | "sibling" }[]>([]);
  const stackedParentsRef = useRef<{ id: string; label: string; type: "child" | "sibling" }[]>([]);
  const linkToParents = useCanvasStore((s) => s.linkToParents);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.altKey) altKeyRef.current = true;
      if (e.shiftKey) { shiftKeyRef.current = true; setShiftHeld(true); }
    };
    const up = (e: KeyboardEvent) => {
      if (!e.altKey) altKeyRef.current = false;
      if (!e.shiftKey) { shiftKeyRef.current = false; setShiftHeld(false); }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const deleteModalNode = useMemo(
    () => nodes.find((n) => n.id === deleteModalNodeId) ?? null,
    [nodes, deleteModalNodeId]
  );

  // Detect new node for auto-focus
  useEffect(() => {
    if (nodes.length > prevNodeCountRef.current && selectedNodeId) {
      const isNewNode = !rfNodesRef.current.find((n) => n.id === selectedNodeId);
      if (isNewNode) {
        pendingFocusRef.current = selectedNodeId;
      }
    }
    prevNodeCountRef.current = nodes.length;
  }, [nodes.length, selectedNodeId]);

  // Set CSS accent color
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", project.accent);
    const r = parseInt(project.accent.slice(1, 3), 16);
    const g = parseInt(project.accent.slice(3, 5), 16);
    const b = parseInt(project.accent.slice(5, 7), 16);
    document.documentElement.style.setProperty("--accent-muted", `rgba(${r}, ${g}, ${b}, 0.12)`);
    document.documentElement.style.setProperty("--accent-strong", `rgba(${r}, ${g}, ${b}, 0.24)`);
  }, [project.accent]);

  // Compute layout when store nodes change
  useEffect(() => {
    if (nodes.length === 0) {
      setRfNodes([]);
      setRfEdges([]);
      setLayoutReady(true);
      return;
    }
    if (isDraggingRef.current) return;

    const currentSelectedId = useCanvasStore.getState().selectedNodeId;

    computeLayout(nodes).then(({ rfNodes: layoutNodes, rfEdges: layoutEdges }) => {
      // Mark the selected node + inject readOnly into data
      const withSelection = layoutNodes.map((n) => ({
        ...n,
        selected: n.id === currentSelectedId,
        data: { ...n.data, readOnly },
      }));

      rfNodesRef.current = withSelection;
      rfEdgesRef.current = layoutEdges;
      setRfNodes(withSelection);
      setRfEdges(layoutEdges);
      setLayoutReady(true);

      // Focus on newly created node
      const focusId = pendingFocusRef.current;
      if (focusId) {
        pendingFocusRef.current = null;
        const newRfNode = withSelection.find((n) => n.id === focusId);
        if (newRfNode?.position) {
          const w = newRfNode.width ?? 110;
          const h = newRfNode.height ?? 60;
          requestAnimationFrame(() => {
            setCenter(
              newRfNode.position.x + w / 2,
              newRfNode.position.y + h / 2,
              { zoom: 1.3, duration: 400 }
            );
          });
        }
      }
    });
  }, [nodes, setRfNodes, setRfEdges, setCenter]);

  // Sync selectedNodeId → ReactFlow selected state
  useEffect(() => {
    if (isDraggingRef.current) return;
    setRfNodes((currentNodes) =>
      currentNodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setRfNodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (!readOnly && (e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault(); undo(); return;
      }
      if (!readOnly && (e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault(); redo(); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault(); fitView({ padding: 0.15, duration: 500 }); return;
      }

      if (isInput) return;

      if (selectedNodeId && !editingNodeId && !readOnly) {
        if (e.key === "Tab") {
          e.preventDefault(); addNode(selectedNodeId, "child"); return;
        }
        if (e.key === "Enter") {
          e.preventDefault(); addNode(selectedNodeId, "sibling"); return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          const node = nodes.find((n) => n.id === selectedNodeId);
          if (node && node.children.length > 0) {
            setDeleteModalNodeId(selectedNodeId);
          } else if (node) {
            deleteNode(selectedNodeId, "cascade");
          }
          return;
        }
        if (e.key === "F2") {
          e.preventDefault(); startEditing(selectedNodeId); return;
        }
      }

      if (e.key === "Escape") {
        if (editingNodeId) stopEditing();
        else { selectNode(null); onExternalSelectClear?.(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNodeId, editingNodeId, nodes, fitView, undo, redo, addNode, deleteNode, startEditing, stopEditing, selectNode, onExternalSelectClear]);

  // Export preparation
  useEffect(() => {
    const handler = () => {
      fitView({ padding: 0.05, maxZoom: 1, duration: 600 });
      setTimeout(() => window.dispatchEvent(new CustomEvent("arbo:export-ready")), 720);
    };
    window.addEventListener("arbo:prepare-export", handler);
    return () => window.removeEventListener("arbo:prepare-export", handler);
  }, [fitView]);

  // Handle external spotlight selection
  useEffect(() => {
    if (!externalSelectedNode || !layoutReady) return;
    selectNode(externalSelectedNode.id);
    const rfNode = rfNodesRef.current.find((n) => n.id === externalSelectedNode.id);
    if (rfNode?.position) {
      setCenter(
        rfNode.position.x + (rfNode.width ?? 160) / 2,
        rfNode.position.y + (rfNode.height ?? 200) / 2,
        { zoom: 1.2, duration: 500 }
      );
    }
  }, [externalSelectedNode, layoutReady, setCenter, selectNode]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("ep_")) return;
      selectNode(node.id);
    },
    [selectNode]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      if (node.id.startsWith("ep_")) return;
      startEditing(node.id);
    },
    [startEditing, readOnly]
  );

  const onPaneClick = useCallback(() => {
    if (editingNodeId) stopEditing();
    selectNode(null);
    onExternalSelectClear?.();
  }, [editingNodeId, stopEditing, selectNode, onExternalSelectClear]);

  // ─── Drag handlers ──────────────────────────────────────────────────────────

  const onNodeDragStart: NodeDragHandler = useCallback(
    (_event, _draggedNode) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      // Snapshot positions before any drag modifications
      baseNodesRef.current = rfNodesRef.current.map((n) => ({
        ...n,
        position: { ...n.position },
      }));
      baseEdgesRef.current = [...rfEdgesRef.current];

      // Shift+drag = link mode
      if (shiftKeyRef.current) {
        setLinkMode(true);
        setStackedParents([]);
        stackedParentsRef.current = [];
      }
    },
    []
  );

  // Last hover target for link mode (to avoid re-adding same parent on every frame)
  const lastLinkHoverRef = useRef<string | null>(null);

  const onNodeDrag: NodeDragHandler = useCallback(
    (_event, draggedNode) => {
      if (draggedNode.id.startsWith("ep_")) return;

      const intent = calculateDropIntent(draggedNode, baseNodesRef.current, nodes);

      // ─── SHIFT+DRAG: link mode (stack parents) ─────────────────────────
      if (linkMode) {
        if (intent) {
          const targetParentId = intent.type === "child" ? intent.targetId : intent.parentId;
          if (targetParentId && targetParentId !== draggedNode.id && targetParentId !== lastLinkHoverRef.current) {
            lastLinkHoverRef.current = targetParentId;
            const targetNode = nodes.find((n) => n.id === targetParentId);
            if (targetNode && !stackedParentsRef.current.some((p) => p.id === targetParentId)) {
              const intentType = intent.type === "child" ? "child" as const : "sibling" as const;
              const newStack = [...stackedParentsRef.current, { id: targetParentId, label: targetNode.label, type: intentType }];
              stackedParentsRef.current = newStack;
              setStackedParents(newStack);
            }
          }
        } else {
          lastLinkHoverRef.current = null;
        }

        // In link mode, show preview edges to all stacked parents but don't shift nodes
        const previewEdges: Edge[] = stackedParentsRef.current.map((p, i) => ({
          id: `${PREVIEW_EDGE_ID}_link_${i}`,
          source: p.id,
          target: draggedNode.id,
          type: "default",
          animated: true,
          style: {
            strokeDasharray: "6 3",
            strokeWidth: 2,
            stroke: "var(--accent)",
            opacity: 0.6,
          },
        }));
        setRfEdges([...baseEdgesRef.current, ...previewEdges]);

        // Restore base positions (no shifts in link mode)
        setRfNodes((currentNodes) =>
          currentNodes
            .filter((n) => n.id !== DROP_INDICATOR_ID)
            .map((n) => {
              if (n.id === draggedNode.id) return n;
              const base = baseNodesRef.current.find((bn) => bn.id === n.id);
              return base ? { ...n, position: { ...base.position } } : n;
            })
        );
        return;
      }

      // ─── Normal drag mode ────────────────────────────────────────────────
      setDropIntent(intent);

      if (!intent) {
        // Restore base positions + remove indicator
        setRfNodes((currentNodes) =>
          currentNodes
            .filter((n) => n.id !== DROP_INDICATOR_ID)
            .map((n) => {
              if (n.id === draggedNode.id) return n;
              const base = baseNodesRef.current.find((bn) => bn.id === n.id);
              return base ? { ...n, position: { ...base.position } } : n;
            })
        );
        setRfEdges(baseEdgesRef.current);
        return;
      }

      const { shifts, indicatorPos } = computeShiftsAndIndicator(
        intent,
        baseNodesRef.current,
        nodes,
        draggedNode.id,
      );

      // Apply shifts + add indicator node
      setRfNodes((currentNodes) => {
        const result: Node[] = [];

        for (const n of currentNodes) {
          if (n.id === DROP_INDICATOR_ID) continue; // Remove old indicator
          if (n.id === draggedNode.id) {
            result.push(n); // Keep dragged node as-is
            continue;
          }
          const base = baseNodesRef.current.find((bn) => bn.id === n.id);
          if (!base) { result.push(n); continue; }

          const shift = shifts.get(n.id) ?? 0;
          result.push({
            ...n,
            position: { x: base.position.x + shift, y: base.position.y },
          });
        }

        // Add drop indicator node
        result.push({
          id: DROP_INDICATOR_ID,
          type: "dropIndicator",
          position: { x: indicatorPos.x, y: indicatorPos.y },
          data: { orientation: indicatorPos.orientation },
          selectable: false,
          draggable: false,
          zIndex: 100,
        });

        return result;
      });

      // Preview edge: from parent to indicator
      const parentNodeId =
        intent.type === "child" ? intent.targetId : intent.parentId;
      if (parentNodeId) {
        const previewEdge: Edge = {
          id: PREVIEW_EDGE_ID,
          source: parentNodeId,
          target: DROP_INDICATOR_ID,
          type: "default",
          animated: true,
          style: {
            strokeDasharray: "6 4",
            strokeWidth: 2,
            stroke: "var(--accent)",
            opacity: 0.7,
          },
        };
        setRfEdges([...baseEdgesRef.current, previewEdge]);
      }
    },
    [nodes, setDropIntent, setRfNodes, setRfEdges, linkMode]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, draggedNode) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      lastLinkHoverRef.current = null;

      const intent = useCanvasStore.getState().dropIntent;
      setDropIntent(null);

      // Always restore ALL nodes (including dragged) to base positions
      setRfNodes((currentNodes) =>
        currentNodes
          .filter((n) => n.id !== DROP_INDICATOR_ID)
          .map((n) => {
            const base = baseNodesRef.current.find((bn) => bn.id === n.id);
            return base ? { ...n, position: { ...base.position } } : n;
          })
      );
      setRfEdges(baseEdgesRef.current);

      if (draggedNode.id.startsWith("ep_")) {
        setLinkMode(false);
        setStackedParents([]);
        stackedParentsRef.current = [];
        return;
      }

      // ─── SHIFT+DRAG: apply stacked links ─────────────────────────────────
      if (linkMode && stackedParentsRef.current.length > 0) {
        linkToParents(draggedNode.id, stackedParentsRef.current.map((p) => p.id));
        setLinkMode(false);
        setStackedParents([]);
        stackedParentsRef.current = [];
        return;
      }

      setLinkMode(false);
      setStackedParents([]);
      stackedParentsRef.current = [];

      // Alt+drag = duplicate
      if (altKeyRef.current) {
        duplicateNode(draggedNode.id);
        return;
      }

      // Execute the move only if there's a valid drop target
      if (intent) {
        moveNode(draggedNode.id, intent);
      }
    },
    [setDropIntent, setRfNodes, setRfEdges, duplicateNode, moveNode, linkMode, linkToParents]
  );

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.9 }), []);

  if (!layoutReady) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--line-strong)", borderTopColor: "transparent" }}
            />
            <div
              className="absolute inset-0 w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "transparent",
                borderTopColor: "var(--accent)",
                animationDuration: "0.8s",
                animationDirection: "reverse",
              }}
            />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Calcul du layout...
            </span>
            <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
              {nodes.length} pages
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        {readOnly ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ce projet est vide.</p>
        ) : (
          <button
            onClick={() => addNode(null, "child", "Accueil")}
            className="flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: "var(--elevated)",
              border: "2px dashed var(--line-strong)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text-primary)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.color = "var(--text-secondary)" }}
          >
            <Plus className="w-5 h-5" />
            Créer la première page
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative${selectedNode ? " has-selection" : ""}`}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
        minZoom={0.05}
        maxZoom={2.5}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.4}
          color="rgba(100,100,110,0.5)"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          style={{ bottom: 16, left: 16 }}
        />
        <MiniMap
          nodeStrokeWidth={0}
          pannable
          zoomable
          position="bottom-right"
          style={{
            width: 140,
            height: 90,
            bottom: 16,
            right: 16,
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--surface)",
          }}
          maskColor="var(--minimap-mask)"
        />
      </ReactFlow>

      {/* Shift multi-link badge — appears during drag, next to zoom controls */}
      {isDragging && (
        <div
          className="absolute z-50 flex items-center gap-1.5 px-2 py-1 rounded-md pointer-events-none"
          style={{
            bottom: 16,
            left: 68,
            background: linkMode ? "var(--accent)" : "var(--surface)",
            border: linkMode ? "1px solid var(--accent)" : "1px solid var(--line)",
            opacity: linkMode ? 1 : 0.6,
            transition: "all 150ms ease",
          }}
        >
          <Link2
            className="w-3 h-3"
            style={{ color: linkMode ? "#fff" : "var(--text-faint)" }}
          />
          <kbd
            className="text-2xs font-mono font-medium leading-none"
            style={{ color: linkMode ? "#fff" : "var(--text-faint)" }}
          >
            Shift
          </kbd>
          {linkMode && stackedParents.length > 0 && (
            <span
              className="text-2xs font-medium leading-none"
              style={{ color: "#fff" }}
            >
              +{stackedParents.length}
            </span>
          )}
        </div>
      )}

      <CommentOverlay
        projectId={project.id}
        currentUser={currentUser}
        rfNodes={rfNodesRef.current}
      />

      <DetailPanel
        node={selectedNode}
        project={project}
        onClose={() => {
          selectNode(null);
          onExternalSelectClear?.();
        }}
        onOpenComments={onOpenComments}
      />

      <DeleteNodeModal
        node={deleteModalNode}
        onClose={() => setDeleteModalNodeId(null)}
        onDelete={(mode) => {
          if (deleteModalNodeId) {
            deleteNode(deleteModalNodeId, mode);
            setDeleteModalNodeId(null);
          }
        }}
      />
    </div>
  );
}

export default function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
