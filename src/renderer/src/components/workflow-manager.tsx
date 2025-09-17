import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkflowStorage, type WorkflowData } from "@/lib/workflow-storage";
import {
  FolderOpen,
  Save,
  Trash2,
  Play,
  FileText,
  Calendar,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkflowManagerProps {
  currentNodes: Node[];
  currentEdges: Edge[];
  onLoadWorkflow: (workflow: WorkflowData) => void;
  onSaveSuccess?: () => void;
}

export function WorkflowManager({
  currentNodes,
  currentEdges,
  onLoadWorkflow,
  onSaveSuccess,
}: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<WorkflowData[]>(
    WorkflowStorage.getAllWorkflows(),
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: "", description: "" });

  const refreshWorkflows = () => {
    setWorkflows(WorkflowStorage.getAllWorkflows());
  };

  const handleSave = () => {
    if (!saveForm.name.trim()) return;

    try {
      WorkflowStorage.saveWorkflow({
        name: saveForm.name,
        description: saveForm.description,
        nodes: currentNodes,
        edges: currentEdges,
      });

      setSaveForm({ name: "", description: "" });
      setShowSaveDialog(false);
      refreshWorkflows();
      onSaveSuccess?.();
    } catch (error) {
      console.error("保存工作流失败:", error);
    }
  };

  const handleLoad = (workflow: WorkflowData) => {
    onLoadWorkflow(workflow);
    setShowLoadDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个工作流吗？")) {
      WorkflowStorage.deleteWorkflow(id);
      refreshWorkflows();
    }
  };

  return (
    <div className="flex gap-2">
      {/* 保存工作流 */}
      <TooltipProvider>
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>保存工作流</p>
              </TooltipContent>
            </Tooltip>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>保存工作流</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="name">工作流名称</Label>
                <Input
                  id="name"
                  value={saveForm.name}
                  onChange={(e) =>
                    setSaveForm({ ...saveForm, name: e.target.value })
                  }
                  placeholder="输入工作流名称"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={saveForm.description}
                  onChange={(e) =>
                    setSaveForm({ ...saveForm, description: e.target.value })
                  }
                  placeholder="输入工作流描述（可选）"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  取消
                </Button>
                <Button onClick={handleSave} disabled={!saveForm.name.trim()}>
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 加载工作流 */}
        <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
          <DialogTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>加载工作流</p>
              </TooltipContent>
            </Tooltip>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>工作流管理</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {workflows.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无保存的工作流</p>
                  </div>
                ) : (
                  workflows.map((workflow) => (
                    <Card key={workflow.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{workflow.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {workflow.nodes.length} 节点
                            </Badge>
                          </div>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {workflow.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              创建: {workflow.createdAt.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              更新: {workflow.updatedAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoad(workflow)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            加载
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(workflow.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
}
