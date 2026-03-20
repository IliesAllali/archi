"use client";

import { memo } from "react";
import type { NodeProps } from "reactflow";

interface DropIndicatorData {
  orientation: "vertical" | "horizontal";
}

function DropIndicatorNode({ data }: NodeProps<DropIndicatorData>) {
  const isVertical = data.orientation === "vertical";

  return (
    <div
      style={{
        width: isVertical ? 3 : 80,
        height: isVertical ? 50 : 3,
        background: "var(--accent)",
        borderRadius: 2,
        boxShadow: "0 0 12px var(--accent), 0 0 4px var(--accent)",
        opacity: 0.95,
        pointerEvents: "none",
      }}
    >
      {/* Circles at the ends */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? -4 : -3,
          left: isVertical ? -3 : -4,
          width: isVertical ? 9 : 9,
          height: isVertical ? 9 : 9,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? -4 : -3,
          right: isVertical ? -3 : -4,
          width: isVertical ? 9 : 9,
          height: isVertical ? 9 : 9,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent)",
        }}
      />
    </div>
  );
}

export default memo(DropIndicatorNode);
