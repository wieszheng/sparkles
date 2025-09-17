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
export function CloseNode({ data, id }: NodeProps<CloseNode>) {
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
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <X className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">关闭</div>
            <div className="text-xs text-muted-foreground">
              {data.config?.method === "force" ? "强制关闭" : "正常关闭"}
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
              placeholder="应用名称"
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmClose" className="text-xs font-medium">
              确认关闭
            </Label>
            <Select
              value={data.config?.confirmClose || "false"}
              onValueChange={(value) => updateConfig("confirmClose", value)}
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
            <Label htmlFor="timeout" className="text-xs font-medium">
              超时时间(ms)
            </Label>
            <Input
              id="timeout"
              type="number"
              value={data.config?.waitTime || "5000"}
              onChange={(e) => updateConfig("timeout", e.target.value)}
              placeholder="5000"
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>

        <Handle type="target" position={Position.Top} />
      </Card>
    </AnimatedNodeWrapper>
  );
}
