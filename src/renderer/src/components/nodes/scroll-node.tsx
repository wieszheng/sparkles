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
import { Button } from "@/components/ui/button";

export function ScrollNode({ data, id }: NodeProps<ScrollNode>) {
  const updateConfig = (key: string, value: string) => {
    if (data.onConfigChange) {
      data.onConfigChange({
        ...data.config,
        [key]: value,
      });
    }
  };
  const handleSingleNodeExecution = () => {
    if (data.onSingleNodeExecute) {
      data.onSingleNodeExecute(id);
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
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <MousePointer2 className="h-4 w-4 text-white" />
            </Button>
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
              className="text-xs font-mono flex-1 mt-1"
            />
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
              className="text-xs mt-1"
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
