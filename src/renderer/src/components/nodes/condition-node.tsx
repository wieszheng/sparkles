import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GitBranch, Search } from "lucide-react";
import { SelectorDialog } from "@/components/selector-dialog";
import { getCardStyle, getStatusBadge } from "@/components/status";
import { AnimatedNodeWrapper } from "@/components/animated-node-wrapper";
import type { ConditionNode } from "@/components/type";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

export function ConditionNode({ data, id }: NodeProps<ConditionNode>) {
  const updateConfig = (key: string, value: string) => {
    if (data.onConfigChange) {
      data.onConfigChange({
        ...data.config,
        [key]: value,
      });
    }
  };

  const operatorLabels = {
    equals: "等于",
    contains: "包含",
    exists: "存在",
    not_exists: "不存在",
    greater: "大于",
    less: "小于",
    visible: "可见",
    enabled: "可用",
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <GitBranch className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">条件</div>
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
            <Label className="text-xs font-medium">条件类型</Label>

            <Select
              value={data.config?.operator}
              onValueChange={(value) => updateConfig("operator", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(operatorLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {["equals", "contains", "greater", "less"].includes(
            data.config?.operator,
          ) && (
            <>
              <div>
                <Label className="text-xs font-medium">属性</Label>
                <Select
                  value={data.config?.attribute}
                  onValueChange={(value) => updateConfig("attribute", value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="text">文本内容</SelectItem>
                      <SelectItem value="value">值</SelectItem>
                      <SelectItem value="href">链接</SelectItem>
                      <SelectItem value="src">图片源</SelectItem>
                      <SelectItem value="class">CSS类</SelectItem>
                      <SelectItem value="id">ID</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">期望值</Label>
                <Input
                  value={data.config?.value}
                  onChange={(e) => updateConfig("value", e.target.value)}
                  placeholder="输入期望值"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-xs">超时时间 (毫秒)</Label>
            <Input
              type="number"
              value={data.config?.waitTime}
              onChange={(e) => updateConfig("waitTime", e.target.value)}
              placeholder="5000"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>真</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>假</span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: "25%" }}
          className="!bg-green-500 !border-green-600"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: "75%" }}
          className="!bg-red-500 !border-red-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
