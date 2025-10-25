import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Move, Search } from "lucide-react";
import { SelectorDialog } from "@/components/selector-dialog";
import type { SwipeNode } from "@/components/type";
import { getCardStyle, getStatusBadge } from "@/components/status.tsx";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SwipeNode({ data, id }: NodeProps<SwipeNode>) {
  const updateConfig = (key: string, value: string | number) => {
    if (data.onConfigChange) {
      data.onConfigChange({
        ...data.config,
        [key]: value,
      });
    }
  };

  const directionLabels = {
    up: "向上",
    down: "向下",
    left: "向左",
    right: "向右",
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
        <Handle type="target" position={Position.Top} />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <Move className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">滑动</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.direction || "down"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs">滑动区域 (可选)</Label>
            <div className="flex gap-1 mt-1">
              <Input
                value={data.config.selector || ""}
                onChange={(e) => updateConfig("selector", e.target.value)}
                placeholder="留空则在屏幕上滑动"
                className="text-xs font-mono flex-1"
              />
              <SelectorDialog
                value={data.config?.selector || ""}
                onChange={(value) => updateConfig("selector", value)}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 bg-transparent"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </SelectorDialog>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">滑动方向</Label>

            <Select
              value={data.config?.direction || "down"}
              onValueChange={(value) => updateConfig("direction", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(directionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium">滑动时长 (毫秒)</Label>
            <Input
              type="number"
              value={data.config.duration}
              onChange={(e) => updateConfig("duration", e.target.value)}
              placeholder="500"
              className="text-xs font-mono flex-1 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium">起始X坐标</Label>
              <Input
                type="number"
                value={data.config.startX}
                onChange={(e) =>
                  updateConfig("startX", Number.parseInt(e.target.value))
                }
                placeholder="0"
                className="w-28 text-xs font-mono flex-1 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">起始Y坐标</Label>
              <Input
                type="number"
                value={data.config.startY}
                onChange={(e) =>
                  updateConfig("startY", Number.parseInt(e.target.value))
                }
                placeholder="0"
                className="w-28 text-xs font-mono flex-1 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium">结束X坐标</Label>
              <Input
                type="number"
                value={data.config.endX}
                onChange={(e) =>
                  updateConfig("endX", Number.parseInt(e.target.value))
                }
                placeholder="0"
                className="w-28 text-xs font-mono flex-1 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">结束Y坐标</Label>
              <Input
                type="number"
                value={data.config.endY}
                onChange={(e) =>
                  updateConfig("endY", Number.parseInt(e.target.value))
                }
                placeholder="0"
                className="w-28 text-xs font-mono flex-1 mt-1"
              />
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-indigo-500 !border-indigo-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
