import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import type { StartNode } from "@/components/type";
import { getCardStyle, getStatusBadge } from "@/components/status";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";

export function StartNode({ data, id }: NodeProps<StartNode>) {
  const updateConfig = (key: string, value: string) => {
    if (data.onConfigChange) {
      data.onConfigChange({
        ...data.config,
        [key]: value,
      });
    }
  };

  return (
    <AnimatedNodeWrapper
      isCurrentNode={data.isCurrentNode}
      executionStatus={data.executionStatus}
      nodeId={id}
    >
      <Card className={getCardStyle(data.isCurrentNode, data.executionStatus)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
            <Play className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">开始</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.appName || "启动应用"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="appName" className="text-xs font-medium">
              应用名称
            </Label>
            <Input
              id="appName"
              value={data.config?.appName || ""}
              onChange={(e) => updateConfig("appName", e.target.value)}
              placeholder="应用程序名称"
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label htmlFor="waitTime" className="text-xs font-medium">
              启动等待时间(ms)
            </Label>
            <Input
              id="waitTime"
              type="number"
              value={data.config?.waitTime || "2000"}
              onChange={(e) => updateConfig("waitTime", e.target.value)}
              placeholder="2000"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <Handle
          id="green"
          type="source"
          position={Position.Bottom}
          className="!bg-green-500 !border-green-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
