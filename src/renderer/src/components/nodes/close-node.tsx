import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { CloseNode } from "@/components/type";
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
import { Button } from "@/components/ui/button.tsx";
export function CloseNode({ data, id }: NodeProps<CloseNode>) {
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
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">开始</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.target || "关闭应用"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="target" className="text-xs font-medium">
              目标应用
            </Label>
            <Input
              id="target"
              value={data.config?.target || ""}
              onChange={(e) => updateConfig("target", e.target.value)}
              placeholder="应用程序名称"
              className="text-xs mt-1"
            />
          </div>
          <div>
            <Label htmlFor="closeMode" className="text-xs font-medium">
              关闭方式
            </Label>
            <Select
              value={data.config?.closeMode}
              onValueChange={(value) => updateConfig("closeMode", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Force">终止应用</SelectItem>
                  <SelectItem value="GoBack">退到后台</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timeout" className="text-xs font-medium">
              超时时间(ms)
            </Label>
            <Input
              id="waitTime"
              type="number"
              value={data.config?.waitTime}
              onChange={(e) => updateConfig("waitTime", e.target.value)}
              placeholder="5000"
              className="text-xs mt-1"
            />
          </div>
        </div>

        <Handle type="target" position={Position.Top} />
      </Card>
    </AnimatedNodeWrapper>
  );
}
