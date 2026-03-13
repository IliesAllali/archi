import type { SiteNode, EntryPoint } from "./types";
import type { Node, Edge } from "reactflow";
import { getCardHeight, CARD_WIDTH } from "@/components/Tree/SiteNode";

const LABEL_HEIGHT = 28;
const NODE_WIDTH = CARD_WIDTH + 20;
const EP_WIDTH = 150;
const EP_MARGIN = 20; // gap between EP group bottom and page top

function getEntryPointGroupHeight(entryPoints: EntryPoint[]): number {
  let h = 0;
  for (const ep of entryPoints) {
    h += ep.type === "google" ? 20 : 16;
  }
  h += (entryPoints.length - 1) * 4;
  return h;
}

/**
 * ELK layouts page nodes. Pages with entry points get inflated heights
 * so ELK reserves vertical space above them. After layout, the page
 * is shifted down and the EP node is placed in the reserved space.
 */
export async function computeLayout(nodes: SiteNode[]): Promise<{
  rfNodes: Node[];
  rfEdges: Edge[];
}> {
  // Compute real card heights and EP overhead
  const pageHeight: Record<string, number> = {};
  const epOverhead: Record<string, number> = {};

  nodes.forEach((n) => {
    const cardH = getCardHeight(n.zoning) + LABEL_HEIGHT;
    pageHeight[n.id] = cardH;

    if (n.entryPoints && n.entryPoints.length > 0) {
      epOverhead[n.id] = getEntryPointGroupHeight(n.entryPoints) + EP_MARGIN;
    } else {
      epOverhead[n.id] = 0;
    }
  });

  // ELK nodes: height includes EP overhead so layout reserves space
  const elkNodes = nodes.map((n) => ({
    id: n.id,
    width: NODE_WIDTH,
    height: pageHeight[n.id] + epOverhead[n.id],
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
      "elk.layered.spacing.nodeNodeBetweenLayers": "70",
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

  const positionMap: Record<string, { x: number; y: number }> = {};
  (layouted.children as { id: string; x: number; y: number }[]).forEach((n) => {
    positionMap[n.id] = { x: n.x, y: n.y };
  });

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Page nodes — shifted down by EP overhead so EP fits above
  nodes.forEach((n) => {
    const p = positionMap[n.id];
    if (!p) return;
    rfNodes.push({
      id: n.id,
      type: "siteNode",
      position: { x: p.x, y: p.y + epOverhead[n.id] },
      data: n,
    });
  });

  // Page-to-page edges (parent → direct children only)
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

  // Entry point nodes — placed in the reserved space above their page
  nodes.forEach((n) => {
    if (!n.entryPoints || n.entryPoints.length === 0) return;
    const p = positionMap[n.id];
    if (!p) return;

    const epH = getEntryPointGroupHeight(n.entryPoints);

    rfNodes.push({
      id: `ep_${n.id}`,
      type: "entryPointNode",
      position: {
        x: p.x + (NODE_WIDTH - EP_WIDTH) / 2,
        y: p.y, // top of reserved space
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

  // Cross-links (dashed, side-to-side) — don't affect layout
  nodes.forEach((n) => {
    if (!n.links || n.links.length === 0) return;
    n.links.forEach((targetId) => {
      if (!positionMap[n.id] || !positionMap[targetId]) return;
      const srcPos = positionMap[n.id];
      const tgtPos = positionMap[targetId];
      // Pick side handles based on relative position
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

  return { rfNodes, rfEdges };
}
