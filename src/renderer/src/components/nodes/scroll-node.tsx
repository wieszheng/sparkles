import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MousePointer2 } from "lucide-react";
import type { ScrollNode } from "@/components/type";
import { getCardStyle, getStatusBadge } from "@/components/status";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ScrollNode({ data, id }: NodeProps<ScrollNode>) {
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
          <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
            <MousePointer2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">滚动</div>
            <div className="text-xs text-muted-foreground">
              {data.config?.direction || "down"} {data.config?.distance || 100}
              px
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="direction" className="text-xs font-medium">
              滚动方向
            </Label>
            <Select
              value={data.config?.direction || "down"}
              onValueChange={(value) => updateConfig("direction", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="up">向上</SelectItem>
                  <SelectItem value="down">向下</SelectItem>
                  <SelectItem value="left">向左</SelectItem>
                  <SelectItem value="right">向右</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="distance" className="text-xs font-medium">
              滚动距离(px)
            </Label>
            <Input
              id="distance"
              type="number"
              value={data.config?.distance || "100"}
              onChange={(e) => updateConfig("distance", e.target.value)}
              placeholder="100"
              className="h-8 text-xs font-mono flex-1"
            />
          </div>

          <div>
            <Label htmlFor="smooth" className="text-xs font-medium">
              平滑滚动
            </Label>
            <Select
              value={data.config?.smooth || "true"}
              onValueChange={(value) => updateConfig("smooth", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="speed" className="text-xs font-medium">
              滚动速度(ms)
            </Label>
            <Input
              id="speed"
              type="number"
              value={data.config?.speed || "500"}
              onChange={(e) => updateConfig("speed", e.target.value)}
              placeholder="500"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <Handle type="target" position={Position.Top} />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-pink-500 !border-pink-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
