import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MousePointer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectorDialog } from "@/components/selector-dialog";
import type { ClickNode } from "@/components/type";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCardStyle, getStatusBadge } from "@/components/status";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";

export function ClickNode({ data, id }: NodeProps<ClickNode>) {
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
            <MousePointer className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">点击</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.selector || "选择目标元素"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="selector" className="text-xs font-medium">
              目标选择器
            </Label>
            <div className="flex gap-1 mt-1">
              <Input
                id="selector"
                value={data.config?.selector || ""}
                onChange={(e) => updateConfig("selector", e.target.value)}
                placeholder="CSS选择器或XPath"
                className="h-8 text-xs font-mono flex-1"
              />
              <SelectorDialog
                value={data.config?.selector || ""}
                onChange={(value) => updateConfig("selector", value)}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </SelectorDialog>
            </div>
          </div>

          <div>
            <Label htmlFor="clickType" className="text-xs font-medium">
              点击类型
            </Label>
            <Select
              value={data.config?.clickType || "left"}
              onValueChange={(value) => updateConfig("clickType", value)}
            >
              <SelectTrigger className="w-full mt-1 text-xs font-medium">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="left">左键单击</SelectItem>
                  <SelectItem value="right">右键单击</SelectItem>
                  <SelectItem value="double">双击</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="waitTime" className="text-xs font-medium">
              等待时间(ms)
            </Label>
            <Input
              id="waitTime"
              value={data.config?.waitTime || "1000"}
              onChange={(e) => updateConfig("waitTime", e.target.value)}
              placeholder="1000"
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label htmlFor="retryCount" className="text-xs font-medium">
              重试次数
            </Label>
            <Input
              id="retryCount"
              value={data.config?.retryCount || "3"}
              onChange={(e) => updateConfig("retryCount", e.target.value)}
              placeholder="3"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <Handle type="target" position={Position.Top} />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-blue-500 !border-blue-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
