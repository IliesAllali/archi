"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { computeLayout } from "@/lib/elk-layout";
import type { Project, SiteNode } from "@/lib/types";
import SiteNodeComponent from "./SiteNode";
import EntryPointNodeComponent from "./EntryPointNode";
import DetailPanel from "../Panel/DetailPanel";

const nodeTypes = {
  siteNode: SiteNodeComponent,
  entryPointNode: EntryPointNodeComponent,
};

interface CanvasProps {
  project: Project;
}

export default function Canvas({ project }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);

  // Set CSS accent color from project
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", project.accent);
    const r = parseInt(project.accent.slice(1, 3), 16);
    const g = parseInt(project.accent.slice(3, 5), 16);
    const b = parseInt(project.accent.slice(5, 7), 16);
    document.documentElement.style.setProperty(
      "--accent-muted",
      `rgba(${r}, ${g}, ${b}, 0.12)`
    );
    document.documentElement.style.setProperty(
      "--accent-strong",
      `rgba(${r}, ${g}, ${b}, 0.24)`
    );
  }, [project.accent]);

  // Compute layout
  useEffect(() => {
    computeLayout(project.nodes).then(({ rfNodes, rfEdges }) => {
      setNodes(rfNodes);
      setEdges(rfEdges);
      setLayoutReady(true);
    });
  }, [project.nodes, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Ignore entry point nodes
      if (node.id.startsWith("ep_")) return;
      const siteNode = project.nodes.find((n) => n.id === node.id);
      if (siteNode) {
        setSelectedNode(siteNode);
      }
    },
    [project.nodes]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.9 }), []);

  if (!layoutReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-sm text-label-muted">Chargement…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1F1F23"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          nodeStrokeWidth={0}
          pannable
          zoomable
          position="bottom-right"
          style={{
            width: 140,
            height: 90,
          }}
        />
      </ReactFlow>

      <DetailPanel
        node={selectedNode}
        project={project}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
