import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Download, Upload, Eye } from "lucide-react";
import { WorkflowManager } from "@/components/workflow-manager";
import type { Node, Edge } from "@xyflow/react";
import type { WorkflowData } from "@/lib/workflow-storage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkflowControlsProps {
  onExecute: () => Promise<void>;
  onStop: () => Promise<void>;
  isRunning: boolean;
  currentNodes: Node[];
  currentEdges: Edge[];
  onLoadWorkflow: (workflow: WorkflowData) => void;
  onViewLog?: () => void;
}

export function WorkflowControls({
  onExecute,
  onStop,
  isRunning,
  currentNodes,
  currentEdges,
  onLoadWorkflow,
  onViewLog,
}: WorkflowControlsProps) {
  const exportWorkflow = () => {
    const workflow = {
      name: `工作流_${new Date().toLocaleDateString()}`,
      description: "导出的工作流",
      nodes: currentNodes,
      edges: currentEdges,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflow.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflow = JSON.parse(e.target?.result as string);
            onLoadWorkflow(workflow);
          } catch (error) {
            console.error("导入工作流失败:", error);
            alert("导入失败，请检查文件格式");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Card className="absolute top-4 right-4 p-3 z-10">
      <div className="flex flex-col gap-3">
        {/* 执行控制 */}
        <TooltipProvider>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onExecute}
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>执行流程</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onStop}
                  disabled={!isRunning}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>停止流程</p>
              </TooltipContent>
            </Tooltip>

            {/* 导入导出 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={importWorkflow}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>导入</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={exportWorkflow}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>导出</p>
              </TooltipContent>
            </Tooltip>

            {onViewLog && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={onViewLog}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>日志</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
        {/* 工作流管理 */}
        <div className="border-t pt-2">
          <WorkflowManager
            currentNodes={currentNodes}
            currentEdges={currentEdges}
            onLoadWorkflow={onLoadWorkflow}
          />
        </div>
      </div>
    </Card>
  );
}
