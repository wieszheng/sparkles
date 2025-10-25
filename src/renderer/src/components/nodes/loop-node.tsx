import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Search } from "lucide-react";
import { SelectorDialog } from "@/components/selector-dialog";
import type { LoopNode } from "@/components/type";
import { getCardStyle, getStatusBadge } from "@/components/status.tsx";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

export function LoopNode({ data, id }: NodeProps<LoopNode>) {
  const updateConfig = (key: string, value: string) => {
    if (data.onConfigChange) {
      data.onConfigChange({
        ...data.config,
        [key]: value,
      });
    }
  };

  const loopTypeLabels = {
    count: "固定次数",
    condition: "条件循环",
    foreach: "遍历元素",
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <RotateCcw className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">循环</div>
            <div className="text-xs text-muted-foreground truncate">
              {loopTypeLabels[data.config?.type || "count"]}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs font-medium">循环类型</Label>
            <Select
              value={data.config?.type || "count"}
              onValueChange={(value) => updateConfig("type", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(loopTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {data.config.type === "count" && (
            <div>
              <Label className="text-xs font-medium">循环次数</Label>
              <Input
                type="number"
                value={data.config.count}
                onChange={(e) => updateConfig("count", e.target.value)}
                placeholder="3"
                className="h-8 text-xs mt-1"
              />
            </div>
          )}

          {data.config.type === "condition" && (
            <div>
              <Label className="text-xs font-medium">循环条件</Label>
              <Input
                value={data.config.condition}
                onChange={(e) => updateConfig("condition", e.target.value)}
                placeholder="元素存在时继续"
                className="h-8 text-xs mt-1"
              />
            </div>
          )}

          {data.config.type === "foreach" && (
            <div>
              <Label className="text-xs font-medium">遍历选择器</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  value={data.config.selector || ""}
                  onChange={(e) => updateConfig("selector", e.target.value)}
                  placeholder="选择要遍历的元素"
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
          )}

          <div>
            <Label className="text-xs font-medium">最大迭代次数</Label>
            <Input
              type="number"
              value={data.config.maxIterations}
              onChange={(e) => updateConfig("maxIterations", e.target.value)}
              placeholder="10"
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">循环间隔 (毫秒)</Label>
            <Input
              type="number"
              value={data.config.waitTime}
              onChange={(e) => updateConfig("waitTime", e.target.value)}
              placeholder="1000"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>循环体</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span>结束</span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="loop"
          style={{ left: "25%" }}
          className="!bg-blue-500 !border-blue-600"
        />

        <Handle
          type="source"
          position={Position.Bottom}
          id="end"
          style={{ left: "75%" }}
          className="!bg-gray-500 !border-gray-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
