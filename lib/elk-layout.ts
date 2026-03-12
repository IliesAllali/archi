import type { SiteNode, EntryPoint } from "./types";
import type { Node, Edge } from "reactflow";
import { getCardHeight, CARD_WIDTH } from "@/components/Tree/SiteNode";

const LABEL_HEIGHT = 28;
const NODE_WIDTH = CARD_WIDTH + 20;
const EP_WIDTH = 150;
const EP_MARGIN = 16; // gap between EP group and page top

function getEntryPointGroupHeight(entryPoints: EntryPoint[]): number {
  let h = 0;
  for (const ep of entryPoints) {
    h += ep.type === "google" ? 20 : 16;
  }
  h += (entryPoints.length - 1) * 4;
  return h;
}

/**
 * ELK layouts ONLY page nodes. Entry points are positioned manually
 * above their target page, shifted to the side to avoid overlapping
 * any other page node in the layout.
 */
export async function computeLayout(nodes: SiteNode[]): Promise<{
  rfNodes: Node[];
  rfEdges: Edge[];
}> {
  // --- ELK graph: pages only ---
  const elkNodes = nodes.map((n) => ({
    id: n.id,
    width: NODE_WIDTH,
    height: getCardHeight(n.zoning) + LABEL_HEIGHT,
  }));

  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];
  nodes.forEach((n) => {
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
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.edgeRouting": "SPLINES",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
  const elk = new ELK();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layouted = await elk.layout(graph as any);

  const positionMap: Record<string, { x: number; y: number; w: number; h: number }> = {};
  (layouted.children as { id: string; x: number; y: number; width: number; height: number }[]).forEach((n) => {
    positionMap[n.id] = { x: n.x, y: n.y, w: n.width, h: n.height };
  });

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Page nodes
  nodes.forEach((n) => {
    const p = positionMap[n.id];
    if (!p) return;
    rfNodes.push({
      id: n.id,
      type: "siteNode",
      position: { x: p.x, y: p.y },
      data: n,
    });
  });

  // Page-to-page edges
  nodes.forEach((n) => {
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

  // --- Place entry points above their target page, offset to the left ---
  // Collect all page bounding boxes for collision avoidance
  const pageBounds = nodes.map((n) => {
    const p = positionMap[n.id];
    if (!p) return null;
    return { id: n.id, x: p.x, y: p.y, w: p.w, h: p.h };
  }).filter(Boolean) as { id: string; x: number; y: number; w: number; h: number }[];

  const epPlaced: { x: number; y: number; w: number; h: number }[] = [];

  function overlapsAny(x: number, y: number, w: number, h: number): boolean {
    // Check against page nodes
    for (const b of pageBounds) {
      if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
    }
    // Check against already-placed EP nodes
    for (const b of epPlaced) {
      if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
    }
    return false;
  }

  nodes.forEach((n) => {
    if (!n.entryPoints || n.entryPoints.length === 0) return;
    const page = positionMap[n.id];
    if (!page) return;

    const epH = getEntryPointGroupHeight(n.entryPoints);

    // Default: centered above the page
    let epX = page.x + (NODE_WIDTH - EP_WIDTH) / 2;
    let epY = page.y - epH - EP_MARGIN;

    // If that overlaps, try shifting left, then right, then further out
    if (overlapsAny(epX, epY, EP_WIDTH, epH)) {
      const offsets = [-NODE_WIDTH - 20, NODE_WIDTH + 20, -2 * NODE_WIDTH - 40, 2 * NODE_WIDTH + 40];
      for (const dx of offsets) {
        const tryX = page.x + dx;
        if (!overlapsAny(tryX, epY, EP_WIDTH, epH)) {
          epX = tryX;
          break;
        }
      }
    }

    epPlaced.push({ x: epX, y: epY, w: EP_WIDTH, h: epH });

    rfNodes.push({
      id: `ep_${n.id}`,
      type: "entryPointNode",
      position: { x: epX, y: epY },
      data: { entryPoints: n.entryPoints, targetId: n.id },
      selectable: false,
      draggable: false,
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
        stroke: "rgba(255,255,255,0.12)",
      },
    });
  });

  // --- Cross-links: dashed horizontal edges ---
  nodes.forEach((n) => {
    if (!n.links || n.links.length === 0) return;
    n.links.forEach((targetId) => {
      rfEdges.push({
        id: `link_${n.id}->${targetId}`,
        source: n.id,
        sourceHandle: "right",
        target: targetId,
        targetHandle: "left",
        type: "default",
        className: "edge-crosslink",
        style: {
          strokeDasharray: "4 4",
          strokeWidth: 0.75,
          stroke: "rgba(255,255,255,0.18)",
        },
      });
    });
  });

  return { rfNodes, rfEdges };
}
