import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Type, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectorDialog } from "@/components/selector-dialog";
import type { InputNode } from "@/components/type";
import { getCardStyle, getStatusBadge } from "@/components/status";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

export function InputNode({ data, id }: NodeProps<InputNode>) {
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
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <Type className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">输入</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.text || "输入文本"}
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
            <Label htmlFor="text" className="text-xs font-medium">
              输入内容
            </Label>
            <Input
              id="text"
              value={data.config?.text || ""}
              onChange={(e) => updateConfig("text", e.target.value)}
              placeholder="要输入的文本内容"
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label htmlFor="clearFirst" className="text-xs font-medium">
              输入前清空
            </Label>

            <Select
              value={data.config?.clearFirst || "false"}
              onValueChange={(value) => updateConfig("clearFirst", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="false">否</SelectItem>
                  <SelectItem value="true">是</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="delay" className="text-xs font-medium">
              输入延迟(ms)
            </Label>
            <Input
              id="delay"
              type="number"
              value={data.config?.waitTime || "100"}
              onChange={(e) => updateConfig("delay", e.target.value)}
              placeholder="100"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <Handle type="target" position={Position.Top} />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-purple-500 !border-purple-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
