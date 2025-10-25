import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Camera, Search } from "lucide-react";
import { SelectorDialog } from "@/components/selector-dialog";
import type { ScreenshotNode } from "@/components/type";
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

export function ScreenshotNode({ data, id }: NodeProps<ScreenshotNode>) {
  const updateConfig = (key: string, value: string | boolean) => {
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
        <Handle type="target" position={Position.Top} />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-500">
            <Button
              size="sm"
              variant="link"
              onClick={handleSingleNodeExecution}
              className="h-8 w-8 p-0 rounded-full"
              title="单独执行此节点"
            >
              <Camera className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">截图</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.config?.filename || "screenshot"}
            </div>
          </div>
          {data.executionStatus !== "idle" &&
            getStatusBadge(data.executionStatus)}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">全屏截图</Label>
            <Switch
              checked={data.config.fullScreen}
              onCheckedChange={(checked) => updateConfig("fullScreen", checked)}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">文件名</Label>
            <Input
              value={data.config.filename}
              onChange={(e) => updateConfig("filename", e.target.value)}
              placeholder="screenshot"
              className="h-8 text-xs mt-1"
            />
          </div>

          {!data.config.fullScreen && (
            <div>
              <Label className="text-xs font-medium">选择器</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  value={data.config.selector || ""}
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
          )}

          <div>
            <Label className="text-xs font-medium">格式</Label>
            <Select
              value={data.config?.format}
              onValueChange={(value) => updateConfig("format", value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-violet-500 !border-violet-600"
        />
      </Card>
    </AnimatedNodeWrapper>
  );
}
