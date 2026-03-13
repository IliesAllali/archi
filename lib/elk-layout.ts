import type { SiteNode, EntryPoint } from "./types";
import type { Node, Edge } from "reactflow";
import { getCardHeight, getCardWidth } from "@/components/Tree/SiteNode";

const LABEL_HEIGHT = 28;
const EP_WIDTH = 200;
const EP_MARGIN = 24; // gap between EP group bottom and page top
const ISOLATED_GAP = 20; // horizontal spacing between standalone nodes
const ISOLATED_Y_OFFSET = 80; // vertical gap below the tree

function getEntryPointGroupHeight(entryPoints: EntryPoint[]): number {
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
    pageHeight[n.id] = getCardHeight(n.type, n.label) + LABEL_HEIGHT;
    pageWidth[n.id] = getCardWidth(n.type) + 20; // +20 for ELK padding
    epOverhead[n.id] =
      n.entryPoints && n.entryPoints.length > 0
        ? getEntryPointGroupHeight(n.entryPoints) + EP_MARGIN
        : 0;
  });

  // Split: nodes in the connected tree vs standalone isolated nodes
  const allChildIds = new Set<string>();
  nodes.forEach((n) => n.children.forEach((c) => allChildIds.add(c)));

  const treeNodes = nodes.filter((n) => n.type === "home" || allChildIds.has(n.id));
  const isolatedNodes = nodes.filter((n) => n.type !== "home" && !allChildIds.has(n.id));

  // ELK nodes and edges (tree only) — each node uses its own width
  const elkNodes = treeNodes.map((n) => ({
    id: n.id,
    width: pageWidth[n.id],
    height: pageHeight[n.id] + epOverhead[n.id],
  }));

  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];
  treeNodes.forEach((n) => {
    n.children.forEach((childId) => {
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

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Tree page nodes — shifted down by EP overhead so EP fits above
  treeNodes.forEach((n) => {
    const p = positionMap[n.id];
    if (!p) return;
    rfNodes.push({
      id: n.id,
      type: "siteNode",
      position: { x: p.x, y: p.y + epOverhead[n.id] },
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

    const epH = getEntryPointGroupHeight(n.entryPoints);
    const nodeW = pageWidth[n.id];

    rfNodes.push({
      id: `ep_${n.id}`,
      type: "entryPointNode",
      position: {
        x: p.x + (nodeW - EP_WIDTH) / 2,
        y: p.y,
      },
      data: { entryPoints: n.entryPoints, targetId: n.id },
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

  // Isolated standalone nodes — placed in a row below the tree
  if (isolatedNodes.length > 0) {
    // Compute the bounding box of the ELK layout
    let maxY = 0;
    let minX = Infinity;
    let maxX = -Infinity;

    const COMPACT_NODE_W = getCardWidth("other") + 20; // non-home width for isolated nodes
    layoutedChildren.forEach((n) => {
      const bottom = n.y + (pageHeight[n.id] ?? 0) + (epOverhead[n.id] ?? 0);
      if (bottom > maxY) maxY = bottom;
      if (n.x < minX) minX = n.x;
      if (n.x + (pageWidth[n.id] ?? COMPACT_NODE_W) > maxX) maxX = n.x + (pageWidth[n.id] ?? COMPACT_NODE_W);
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
