import { EdgeProps, getBezierPath } from "@xyflow/react";
import { Relationship } from "@/types";

interface CustomEdgeData extends Relationship, Record<string, unknown> {
  sourceCardinality: "1" | "N";
  targetCardinality: "1" | "N";
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
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
      <path
        id={id}
        style={{
          stroke: "hsl(217.2 32.6% 17.5%)",
          strokeWidth: 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd="url(#arrowclosed)"
      />
      {data && (
        <g>
          <text
            x={sourceX + (targetX - sourceX) * 0.25}
            y={sourceY + (targetY - sourceY) * 0.25}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-xs font-semibold"
            style={{ pointerEvents: "all" }}
          >
            {(data as CustomEdgeData).sourceCardinality}
          </text>
          <text
            x={sourceX + (targetX - sourceX) * 0.75}
            y={sourceY + (targetY - sourceY) * 0.75}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-xs font-semibold"
            style={{ pointerEvents: "all" }}
          >
            {(data as CustomEdgeData).targetCardinality}
          </text>
        </g>
      )}
    </>
  );
}

