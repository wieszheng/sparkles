import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

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
type StartNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    appName?: string;
    waitTime?: number;
    startingMode?: string;
    retryCount?: number;
  };
}>;
export function StartNode({ data, id }: NodeProps<StartNode>) {
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <Play className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">开始</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.appName || "启动应用"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="appName" className="text-xs font-medium">
              应用名称
            </Label>
            <Input
              id="appName"
              value={data.config?.appName}
              onChange={(e) => updateConfig("appName", e.target.value)}
              placeholder="应用程序名称"
              className="text-xs mt-1"
            />
          </div>
          <div>
            <Label htmlFor="startingMode" className="text-xs font-medium">
              启动方式
            </Label>
            <Select
              value={data.config?.startingMode}
              onValueChange={(value) => updateConfig("startingMode", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="coldBoot">冷启动</SelectItem>
                  <SelectItem value="warmBoot">热启动</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="waitTime" className="text-xs font-medium">
              启动等待时间(ms)
            </Label>
            <Input
              id="waitTime"
              type="number"
              value={data.config?.waitTime}
              onChange={(e) => updateConfig("waitTime", e.target.value)}
              placeholder="2000"
              className="text-xs mt-1"
            />
          </div>
        </div>

        <Handle
          id="green"
          type="source"
          position={Position.Bottom}
          className="!bg-green-500 !border-green-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
