import { NodeProps } from "@xyflow/react";
import { TableGroup } from "@/types";
import { cn } from "@/lib/utils";

interface GroupNodeData extends TableGroup, Record<string, unknown> {
  width?: number;
  height?: number;
}

const colorMap: Record<string, string> = {
  blue: "border-blue-500/50 bg-blue-500/10",
  purple: "border-purple-500/50 bg-purple-500/10",
};

export function GroupNode({ data }: NodeProps) {
  const groupData = data as GroupNodeData;
  const borderColor = groupData.color ? colorMap[groupData.color] : "border-gray-500/50 bg-gray-500/10";

  return (
    <div
      className={cn(
        "rounded-lg border-2",
        borderColor,
        "pointer-events-none"
      )}
      style={{
        width: groupData.width || 400,
        height: groupData.height || 300,
      }}
    >
      <div className="p-2 text-xs font-semibold text-foreground/70">
        {groupData.name}
      </div>
    </div>
  );
}

