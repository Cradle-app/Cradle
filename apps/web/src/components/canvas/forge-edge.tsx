'use client';

import { memo } from 'react';
import { getBezierPath, type EdgeProps } from 'reactflow';

function ForgeEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Glow effect */}
      <path
        id={`${id}-glow`}
        d={edgePath}
        fill="none"
        stroke="url(#edge-gradient)"
        strokeWidth={6}
        strokeOpacity={0.3}
        filter="blur(4px)"
      />
      
      {/* Main edge */}
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke="url(#edge-gradient)"
        strokeWidth={2}
        markerEnd={markerEnd}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#ff00ff" />
        </linearGradient>
      </defs>
    </>
  );
}

export const ForgeEdge = memo(ForgeEdgeComponent);

