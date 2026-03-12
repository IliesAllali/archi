import type { SiteNode, EntryPoint } from "./types";
import type { Node, Edge } from "reactflow";
import { getCardHeight } from "@/components/Tree/SiteNode";

const CARD_WIDTH = 140;
const LABEL_HEIGHT = 24;
const EP_GAP = 40; // gap between entry points group and page node

function getEntryPointGroupHeight(entryPoints: EntryPoint[]): number {
  let h = 0;
  for (const ep of entryPoints) {
    h += ep.type === "google" ? 18 : 14;
  }
  h += (entryPoints.length - 1) * 3; // gaps
  return h;
}

export async function computeLayout(nodes: SiteNode[]): Promise<{
  rfNodes: Node[];
  rfEdges: Edge[];
}> {
  // Compute variable heights per node
  const nodeHeights: Record<string, number> = {};
  nodes.forEach((n) => {
    const cardH = getCardHeight(n.zoning);
    nodeHeights[n.id] = cardH + LABEL_HEIGHT;
  });

  const elkNodes = nodes.map((n) => ({
    id: n.id,
    width: CARD_WIDTH + 20, // some margin
    height: nodeHeights[n.id],
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

  // Add page nodes
  nodes.forEach((n) => {
    rfNodes.push({
      id: n.id,
      type: "siteNode",
      position: positionMap[n.id] ?? { x: 0, y: 0 },
      data: n,
    });
  });

  // Add page-to-page edges (bézier with glow)
  nodes.forEach((n) => {
    n.children.forEach((childId) => {
      rfEdges.push({
        id: `${n.id}->${childId}`,
        source: n.id,
        target: childId,
        type: "default",
        className: "edge-page",
      });
    });
  });

  // Add entry point nodes + edges (positioned above their target page)
  nodes.forEach((n) => {
    if (!n.entryPoints || n.entryPoints.length === 0) return;
    const pagePos = positionMap[n.id];
    if (!pagePos) return;

    const epHeight = getEntryPointGroupHeight(n.entryPoints);
    const epNodeId = `ep_${n.id}`;

    rfNodes.push({
      id: epNodeId,
      type: "entryPointNode",
      position: {
        x: pagePos.x + (CARD_WIDTH + 20) / 2 - 70, // center above page
        y: pagePos.y - epHeight - EP_GAP,
      },
      data: {
        entryPoints: n.entryPoints,
        targetId: n.id,
      },
      selectable: false,
      draggable: false,
    });

    rfEdges.push({
      id: `ep_${n.id}->${n.id}`,
      source: epNodeId,
      target: n.id,
      type: "default",
      className: "edge-entry",
      animated: false,
      style: {
        strokeDasharray: "4 3",
        strokeWidth: 1,
        stroke: "rgba(255,255,255,0.08)",
      },
    });
  });

  return { rfNodes, rfEdges };
}
