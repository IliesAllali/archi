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
  BackgroundVariant,
  type Viewport,
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
  externalSelectedNode?: SiteNode | null;
  onExternalSelectClear?: () => void;
}

function CanvasInner({ project, externalSelectedNode, onExternalSelectClear }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const { fitView, setCenter } = useReactFlow();
  const rfNodesRef = useRef<Node[]>([]);

  // Set CSS accent color from project
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", project.accent);
    const r = parseInt(project.accent.slice(1, 3), 16);
    const g = parseInt(project.accent.slice(3, 5), 16);
    const b = parseInt(project.accent.slice(5, 7), 16);
    document.documentElement.style.setProperty("--accent-muted", `rgba(${r}, ${g}, ${b}, 0.12)`);
    document.documentElement.style.setProperty("--accent-strong", `rgba(${r}, ${g}, ${b}, 0.24)`);
  }, [project.accent]);

  // Compute layout
  useEffect(() => {
    computeLayout(project.nodes).then(({ rfNodes, rfEdges }) => {
      rfNodesRef.current = rfNodes;
      setNodes(rfNodes);
      setEdges(rfEdges);
      setLayoutReady(true);
    });
  }, [project.nodes, setNodes, setEdges]);

  // Cmd+F → fit view
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        fitView({ padding: 0.15, duration: 500 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fitView]);

  // Export preparation — force zoom ≤ 1 so html2canvas positions correctly
  useEffect(() => {
    const handler = () => {
      // maxZoom: 1 ensures scale never exceeds 1.0 (html2canvas breaks at scale > 1)
      fitView({ padding: 0.05, maxZoom: 1, duration: 600 });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("arbo:export-ready"));
      }, 720);
    };
    window.addEventListener("arbo:prepare-export", handler);
    return () => window.removeEventListener("arbo:prepare-export", handler);
  }, [fitView]);

  // Handle external spotlight selection — center on node
  useEffect(() => {
    if (!externalSelectedNode || !layoutReady) return;
    setSelectedNode(externalSelectedNode);

    // Find the node position and center camera on it
    const rfNode = rfNodesRef.current.find((n) => n.id === externalSelectedNode.id);
    if (rfNode && rfNode.position) {
      const nodeWidth = rfNode.width ?? 160;
      const nodeHeight = rfNode.height ?? 200;
      setCenter(
        rfNode.position.x + nodeWidth / 2,
        rfNode.position.y + nodeHeight / 2,
        { zoom: 1.2, duration: 500 }
      );
    }
  }, [externalSelectedNode, layoutReady, setCenter]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("ep_")) return;
      const siteNode = project.nodes.find((n) => n.id === node.id);
      if (siteNode) setSelectedNode(siteNode);
    },
    [project.nodes]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    onExternalSelectClear?.();
  }, [onExternalSelectClear]);

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
              Calcul du layout…
            </span>
            <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
              {project.nodes.length} pages
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative${selectedNode ? " has-selection" : ""}`}>
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
        minZoom={0.05}
        maxZoom={2.5}
        nodesDraggable={false}
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
          size={1}
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

      <DetailPanel
        node={selectedNode}
        project={project}
        onClose={() => {
          setSelectedNode(null);
          onExternalSelectClear?.();
        }}
      />
    </div>
  );
}


// Wrap with ReactFlowProvider to expose useReactFlow hook
export default function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
