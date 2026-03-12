import type { SiteNode } from "./types";
import type { Node, Edge } from "reactflow";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

export async function computeLayout(nodes: SiteNode[]): Promise<{
  rfNodes: Node[];
  rfEdges: Edge[];
}> {
  const elkNodes = nodes.map((n) => ({
    id: n.id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
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
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
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

  const rfNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: "siteNode",
    position: positionMap[n.id] ?? { x: 0, y: 0 },
    data: n,
  }));

  const rfEdges: Edge[] = [];
  nodes.forEach((n) => {
    n.children.forEach((childId) => {
      rfEdges.push({
        id: `${n.id}->${childId}`,
        source: n.id,
        target: childId,
        type: "smoothstep",
      });
    });
  });

  return { rfNodes, rfEdges };
}
