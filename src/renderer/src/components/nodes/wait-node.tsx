import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Search } from "lucide-react";

import { getCardStyle, getStatusBadge } from "@/components/status";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";
import { SelectorDialog } from "@/components/selector-dialog";
import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type WaitNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    duration: number;
    unit: "seconds" | "milliseconds";
    waitType: "fixed" | "arise" | "vanish";
    selector?: string;
  };
}>;

export function WaitNode({ data, id }: NodeProps<WaitNode>) {
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
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <Clock className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">等待</div>
            <div className="text-xs text-muted-foreground">
              {data.config?.duration || 1000}
              {data.config?.unit === "milliseconds" ? "毫秒" : "秒"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="duration" className="text-xs font-medium">
              等待时长
            </Label>
            <Input
              id="duration"
              type="number"
              value={data.config?.duration || "1000"}
              onChange={(e) => updateConfig("duration", e.target.value)}
              placeholder="1000"
              className="text-xs mt-1"
            />
          </div>

          <div>
            <Label htmlFor="unit" className="text-xs font-medium">
              时间单位
            </Label>
            <Select
              value={data.config?.unit || "milliseconds"}
              onValueChange={(value) => updateConfig("unit", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="milliseconds">毫秒(ms)</SelectItem>
                  <SelectItem value="seconds">秒(s)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="waitType" className="text-xs font-medium">
              等待类型
            </Label>
            <Select
              value={data.config?.waitType}
              onValueChange={(value) => updateConfig("waitType", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="fixed">固定时间</SelectItem>
                  <SelectItem value="arise">等待元素出现</SelectItem>
                  <SelectItem value="vanish">等待元素消失</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {(data.config?.waitType === "arise" ||
            data.config?.waitType === "vanish") && (
            <div>
              <Label htmlFor="selector" className="text-xs font-medium">
                目标元素
              </Label>
              <div className="flex gap-1 mt-1">
                <Input
                  id="selector"
                  value={data.config?.selector || ""}
                  onChange={(e) => updateConfig("selector", e.target.value)}
                  placeholder="CSS选择器或XPath"
                  className="text-xs font-mono"
                />
                <SelectorDialog
                  value={data.config?.selector || ""}
                  onChange={(value) => updateConfig("selector", value)}
                >
                  <Button variant="outline" className="h-9 w-9 bg-transparent">
                    <Search className="h-3 w-3" />
                  </Button>
                </SelectorDialog>
              </div>
            </div>
          )}
        </div>

        <Handle type="target" position={Position.Top} />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-orange-500 !border-orange-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
