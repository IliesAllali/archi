import type { SiteNode, EntryPoint } from "./types";
import type { Node, Edge } from "reactflow";
import { getCardHeight, CARD_WIDTH } from "@/components/Tree/SiteNode";

const LABEL_HEIGHT = 28;
const EP_ITEM_H_GOOGLE = 20;
const EP_ITEM_H_OTHER = 16;
const EP_GAP = 4;
const EP_MARGIN_BOTTOM = 12; // space between entry group and page node

function getEntryPointGroupHeight(entryPoints: EntryPoint[]): number {
  let h = 0;
  for (const ep of entryPoints) {
    h += ep.type === "google" ? EP_ITEM_H_GOOGLE : EP_ITEM_H_OTHER;
  }
  h += (entryPoints.length - 1) * EP_GAP;
  return h;
}

export async function computeLayout(nodes: SiteNode[]): Promise<{
  rfNodes: Node[];
  rfEdges: Edge[];
}> {
  // Build ELK graph — entry point groups are real nodes in the graph
  // so ELK reserves space for them and nothing overlaps
  const elkNodes: { id: string; width: number; height: number }[] = [];
  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];

  // For each page node with entry points, create a compound:
  // ep_node -> page_node (sequential, so ELK puts ep above page)
  nodes.forEach((n) => {
    const cardH = getCardHeight(n.zoning);
    elkNodes.push({
      id: n.id,
      width: CARD_WIDTH + 20,
      height: cardH + LABEL_HEIGHT,
    });

    // Add entry point group as an ELK node
    if (n.entryPoints && n.entryPoints.length > 0) {
      const epH = getEntryPointGroupHeight(n.entryPoints);
      elkNodes.push({
        id: `ep_${n.id}`,
        width: CARD_WIDTH + 20,
        height: epH,
      });
      // Edge from EP group to page — forces EP above the page in layout
      elkEdges.push({
        id: `ep_${n.id}->${n.id}`,
        sources: [`ep_${n.id}`],
        targets: [n.id],
      });
    }
  });

  // Page-to-page edges
  nodes.forEach((n) => {
    n.children.forEach((childId) => {
      // If child has entry points, connect page -> ep_child (then ep_child -> child is already set)
      const child = nodes.find((c) => c.id === childId);
      if (child?.entryPoints && child.entryPoints.length > 0) {
        elkEdges.push({
          id: `${n.id}->ep_${childId}`,
          sources: [n.id],
          targets: [`ep_${childId}`],
        });
      } else {
        elkEdges.push({
          id: `${n.id}->${childId}`,
          sources: [n.id],
          targets: [childId],
        });
      }
    });
  });

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
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

  // Page nodes
  nodes.forEach((n) => {
    rfNodes.push({
      id: n.id,
      type: "siteNode",
      position: positionMap[n.id] ?? { x: 0, y: 0 },
      data: n,
    });
  });

  // Entry point group nodes
  nodes.forEach((n) => {
    if (!n.entryPoints || n.entryPoints.length === 0) return;
    const epPos = positionMap[`ep_${n.id}`];
    if (!epPos) return;

    rfNodes.push({
      id: `ep_${n.id}`,
      type: "entryPointNode",
      position: epPos,
      data: { entryPoints: n.entryPoints, targetId: n.id },
      selectable: false,
      draggable: false,
    });
  });

  // Page-to-page edges (skip entry-point intermediaries for visual edges)
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

  // Entry point to page edges
  nodes.forEach((n) => {
    if (!n.entryPoints || n.entryPoints.length === 0) return;
    if (!positionMap[`ep_${n.id}`]) return;

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

  return { rfNodes, rfEdges };
}
