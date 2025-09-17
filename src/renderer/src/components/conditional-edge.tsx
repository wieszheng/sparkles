import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
  getBezierPath,
  useReactFlow,
  type Position,
} from "@xyflow/react";
import { useMemo } from "react";

type ConditionalEdgeProps = Edge<{
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  markerEnd?: string;
  sourceHandleId?: string;
}>;

export function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  sourceHandleId,
}: EdgeProps<ConditionalEdgeProps>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = useMemo(() => {
    if (sourceHandleId === "true") {
      return "#10b981"; // green-500
    } else if (sourceHandleId === "false") {
      return "#ef4444"; // red-500
    } else if (sourceHandleId === "loop") {
      return "#3b82f6"; // blue-500
    } else if (sourceHandleId === "end") {
      return "#6b7280"; // gray-500
    }
    return "#6b7280"; // gray-500
  }, [sourceHandleId]);

  const label = useMemo(() => {
    if (sourceHandleId === "true") {
      return "真";
    } else if (sourceHandleId === "false") {
      return "假";
    } else if (sourceHandleId === "loop") {
      return "循环";
    } else if (sourceHandleId === "end") {
      return "结束";
    }
    return "";
  }, [sourceHandleId]);
  const { deleteElements } = useReactFlow();
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: 2,
        }}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeColor,
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "bold",
              pointerEvents: "all",
            }}
            className="nodrag nopan"
            onClick={() => deleteElements({ edges: [{ id }] })}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
