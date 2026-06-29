import type { SiteNode, EntryPoint } from "./types";
import type { Node, Edge } from "reactflow";
import { getCardHeight, getCardWidth } from "@/components/Tree/SiteNode";

const LABEL_HEIGHT = 28;
const EP_WIDTH = 200;
const EP_MARGIN = 24; // gap between EP group bottom and page top
const ISOLATED_GAP = 20; // horizontal spacing between standalone nodes
const ISOLATED_Y_OFFSET = 80; // vertical gap below the tree

function getEntryPointGroupHeight(entryPoints: EntryPoint[], isHome: boolean): number {
  if (!isHome) {
    // Compact mode: single row of icons, all 24px tall
    return 24;
  }
  // Full mode: stacked vertically
  let h = 0;
  for (const ep of entryPoints) {
    h += ep.type === "google" ? 30 : 24;
  }
  h += (entryPoints.length - 1) * 6;
  return h;
}

/**
 * ELK layouts the connected page tree.
 * Utility nodes not referenced as children of any other node
 * (contact, le-serce, etc.) are placed manually in a row below the tree.
 */
export async function computeLayout(nodes: SiteNode[]): Promise<{
  rfNodes: Node[];
  rfEdges: Edge[];
}> {
  // Compute card dimensions for ALL nodes
  const pageHeight: Record<string, number> = {};
  const pageWidth: Record<string, number> = {};
  const epOverhead: Record<string, number> = {};

  nodes.forEach((n) => {
    const isExpanded = n.zoningCanvasMode === "wireframe" || n.zoningCanvasMode === "zoning" || n.zoningExpanded;
    pageHeight[n.id] = getCardHeight(n.type, n.label, n.zoningExpanded, n.zoningBlocks, n.zoningCanvasMode, n.zoningHtml, n.id) + LABEL_HEIGHT;
    pageWidth[n.id] = getCardWidth(n.type, isExpanded) + 20;
    epOverhead[n.id] =
      n.entryPoints && n.entryPoints.length > 0
        ? getEntryPointGroupHeight(n.entryPoints, n.type === "home") + EP_MARGIN
        : 0;
  });

  // Split: nodes in the connected tree vs standalone isolated nodes
  const allChildIds = new Set<string>();
  nodes.forEach((n) => n.children.forEach((c) => allChildIds.add(c)));

  const treeNodes = nodes.filter((n) => n.type === "home" || allChildIds.has(n.id));
  const isolatedNodes = nodes.filter((n) => n.type !== "home" && !allChildIds.has(n.id));

  const treeIds = new Set(treeNodes.map((n) => n.id));
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // ─── Cluster setup ───────────────────────────────────────────────────────────
  // A node can pack its direct children into a compact block (childLayout 'stack'
  // = 1 col, 'grid' = childCols). The clustered children are hidden from ELK (so it
  // reserves no horizontal spread for them) and the parent's ELK width is widened to
  // the block width; the children are then placed in a grid below the parent.
  // Only applied when every direct child is a leaf, so no descendant is lost.
  const CLUSTER_GAP_X = 16;
  const CLUSTER_GAP_Y = 18;
  const CLUSTER_TOP_GAP = 44; // gap below the parent card (matches ELK layer gap)

  type ClusterInfo = { kids: string[]; cols: number; cellW: number; cellH: number; blockW: number };
  const clusters = new Map<string, ClusterInfo>();
  const clusteredHidden = new Set<string>();

  treeNodes.forEach((n) => {
    if (n.childLayout !== "stack" && n.childLayout !== "grid") return;
    const kids = n.children.filter((c) => treeIds.has(c));
    if (kids.length < 2) return;
    const allLeaves = kids.every((c) => (nodeById.get(c)?.children.length ?? 0) === 0);
    if (!allLeaves) return; // don't cluster parents whose children have their own subtrees
    const cols = n.childLayout === "stack" ? 1 : Math.max(2, Math.min(6, n.childCols || 2));
    const cellW = Math.max(...kids.map((c) => pageWidth[c]));
    const cellH = Math.max(...kids.map((c) => pageHeight[c] + epOverhead[c]));
    const blockW = cols * cellW + (cols - 1) * CLUSTER_GAP_X;
    clusters.set(n.id, { kids, cols, cellW, cellH, blockW });
    kids.forEach((c) => clusteredHidden.add(c));
  });

  // ELK nodes — exclude hidden cluster children; cluster parents reserve the block width
  const elkNodes = treeNodes
    .filter((n) => !clusteredHidden.has(n.id))
    .map((n) => {
      const ci = clusters.get(n.id);
      return {
        id: n.id,
        width: ci ? Math.max(pageWidth[n.id], ci.blockW) : pageWidth[n.id],
        height: pageHeight[n.id] + epOverhead[n.id],
      };
    });

  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];
  treeNodes.forEach((n) => {
    if (clusteredHidden.has(n.id)) return;
    n.children.forEach((childId) => {
      if (clusteredHidden.has(childId)) return;
      elkEdges.push({
        id: `${n.id}->${childId}`,
        sources: [n.id],
        targets: [childId],
      });
    });
  });

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "28",
      "elk.layered.spacing.nodeNodeBetweenLayers": "44",
      "elk.edgeRouting": "SPLINES",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
  const elk = new ELK();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layouted = await elk.layout(graph as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layoutedChildren = layouted.children as any[];

  const positionMap: Record<string, { x: number; y: number }> = {};
  layoutedChildren.forEach((n) => {
    positionMap[n.id] = { x: n.x, y: n.y };
  });

  // ─── Cluster placement ───────────────────────────────────────────────────────
  // Centre each cluster parent's card within its reserved (block) width, then lay
  // its children out in a grid directly below it. Children were excluded from ELK,
  // so they hold no reserved width and leave no horizontal void.
  const cardX: Record<string, number> = {}; // x override for cluster-parent cards
  clusters.forEach((ci, pid) => {
    const p = positionMap[pid];
    if (!p) return;
    const reservedW = Math.max(pageWidth[pid], ci.blockW);
    cardX[pid] = p.x + (reservedW - pageWidth[pid]) / 2;
    const startX = p.x + (reservedW - ci.blockW) / 2;
    const startY = p.y + epOverhead[pid] + pageHeight[pid] + CLUSTER_TOP_GAP;
    ci.kids.forEach((cid, i) => {
      const col = i % ci.cols;
      const row = Math.floor(i / ci.cols);
      const x = startX + col * (ci.cellW + CLUSTER_GAP_X) + (ci.cellW - pageWidth[cid]) / 2;
      const y = startY + row * (ci.cellH + CLUSTER_GAP_Y);
      positionMap[cid] = { x, y };
    });
  });

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Tree page nodes — shifted down by EP overhead so EP fits above
  treeNodes.forEach((n) => {
    const p = positionMap[n.id];
    if (!p) return;
    rfNodes.push({
      id: n.id,
      type: "siteNode",
      position: { x: cardX[n.id] ?? p.x, y: p.y + epOverhead[n.id] },
      data: n,
    });
  });

  // Page-to-page edges (tree only)
  treeNodes.forEach((n) => {
    n.children.forEach((childId) => {
      rfEdges.push({
        id: `page_${n.id}->${childId}`,
        source: n.id,
        target: childId,
        type: "default",
        className: "edge-page",
      });
    });
  });

  // Entry point nodes — only for tree nodes that have entryPoints
  treeNodes.forEach((n) => {
    if (!n.entryPoints || n.entryPoints.length === 0) return;
    const p = positionMap[n.id];
    if (!p) return;

    const isHome = n.type === "home";
    const epH = getEntryPointGroupHeight(n.entryPoints, isHome);
    const nodeW = pageWidth[n.id];

    rfNodes.push({
      id: `ep_${n.id}`,
      type: "entryPointNode",
      position: {
        x: (cardX[n.id] ?? p.x) + (nodeW - EP_WIDTH) / 2,
        y: p.y,
      },
      data: { entryPoints: n.entryPoints, targetId: n.id, isHome },
      selectable: false,
      draggable: false,
      zIndex: 10,
    });

    rfEdges.push({
      id: `ep_edge_${n.id}`,
      source: `ep_${n.id}`,
      target: n.id,
      type: "default",
      className: "edge-entry",
      style: {
        strokeDasharray: "3 4",
        strokeWidth: 0.75,
      },
    });
  });

  // Cross-links (dashed, side-to-side)
  treeNodes.forEach((n) => {
    if (!n.links || n.links.length === 0) return;
    n.links.forEach((targetId) => {
      if (!positionMap[n.id] || !positionMap[targetId]) return;
      const srcPos = positionMap[n.id];
      const tgtPos = positionMap[targetId];
      const srcRight = srcPos.x < tgtPos.x;
      rfEdges.push({
        id: `link_${n.id}->${targetId}`,
        source: n.id,
        target: targetId,
        sourceHandle: srcRight ? "right" : "left",
        targetHandle: srcRight ? "left" : "right",
        type: "default",
        className: "edge-crosslink",
        style: {
          strokeDasharray: "4 4",
          strokeWidth: 0.75,
        },
      });
    });
  });

  // Secondary parent edges (multi-parent links — solid, colored)
  const allNodes = [...treeNodes, ...isolatedNodes];
  allNodes.forEach((n) => {
    if (!n.secondaryParentIds || n.secondaryParentIds.length === 0) return;
    n.secondaryParentIds.forEach((secParentId) => {
      // Only draw if both nodes exist in layout
      const sourceExists = positionMap[secParentId] || isolatedNodes.some((iso) => iso.id === secParentId);
      const targetExists = positionMap[n.id] || isolatedNodes.some((iso) => iso.id === n.id);
      if (!sourceExists || !targetExists) return;

      rfEdges.push({
        id: `multiparent_${secParentId}->${n.id}`,
        source: secParentId,
        target: n.id,
        type: "default",
        className: "edge-multiparent",
        style: {
          strokeWidth: 1.5,
          stroke: "var(--accent)",
          opacity: 0.65,
        },
      });
    });
  });

  // Isolated standalone nodes — placed in a row below the tree
  if (isolatedNodes.length > 0) {
    // Bounding box of the FINAL tree layout (after cluster placement), so isolated
    // nodes always sit below everything — including tall clustered grids.
    let maxY = 0;
    let minX = Infinity;
    let maxX = -Infinity;

    const COMPACT_NODE_W = getCardWidth("other") + 20; // non-home width for isolated nodes
    treeNodes.forEach((n) => {
      const p = positionMap[n.id];
      if (!p) return;
      const left = cardX[n.id] ?? p.x;
      const w = pageWidth[n.id] ?? COMPACT_NODE_W;
      const bottom = p.y + (pageHeight[n.id] ?? 0) + (epOverhead[n.id] ?? 0);
      if (bottom > maxY) maxY = bottom;
      if (left < minX) minX = left;
      if (left + w > maxX) maxX = left + w;
    });

    const totalW =
      isolatedNodes.length * COMPACT_NODE_W + (isolatedNodes.length - 1) * ISOLATED_GAP;
    const centerX = (minX + maxX) / 2;
    const startX = centerX - totalW / 2;
    const isolatedY = maxY + ISOLATED_Y_OFFSET;

    isolatedNodes.forEach((n, i) => {
      rfNodes.push({
        id: n.id,
        type: "siteNode",
        position: {
          x: startX + i * (COMPACT_NODE_W + ISOLATED_GAP),
          y: isolatedY,
        },
        data: n,
      });
    });
  }

  return { rfNodes, rfEdges };
}
