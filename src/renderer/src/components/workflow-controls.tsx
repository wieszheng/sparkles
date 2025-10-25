import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Save, FolderOpen, FolderPlus, Bug } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Api } from "@/apis";
import type { Project, Directory } from "@/components/TestCase";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import type { WorkflowData } from "../../../types/workflow";

interface WorkflowControlsProps {
  onExecute: () => Promise<void>;
  onStop: () => Promise<void>;
  isRunning: boolean;
  currentNodes: Node[];
  currentEdges: Edge[];
  onLoadWorkflow: (workflow: WorkflowData) => void;
  onViewLog?: () => void;
  selectedProject: Project | null;
}

type CaseState = "draft" | "active" | "disabled" | "archived";
type CasePriority = "low" | "medium" | "high" | "critical";
export function WorkflowControls({
  onExecute,
  onStop,
  isRunning,
  currentNodes,
  currentEdges,
  onLoadWorkflow,
  onViewLog,
  selectedProject,
}: WorkflowControlsProps) {
  // 目录（用于保存/加载对话框内选择）
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<Directory | null>(
    null,
  );

  const [saveStatus, setSaveStatus] = useState<CaseState>("draft");
  const [savePriority, setSavePriority] = useState<CasePriority>("medium");
  // 保存对话框
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  const fetchDirectories = useCallback(async () => {
    if (!selectedProject) {
      setDirectories([]);
      setSelectedDirectory(null);
      return;
    }
    try {
      const resp = await window.api.callApi("POST", Api.getTestCaseDirs, {
        project_id: selectedProject.id,
      });
      const dirs = resp?.data?.dir_tree || [];
      setDirectories(dirs);
      if (dirs.length > 0)
        setSelectedDirectory((prev) =>
          prev && dirs.find((d: Directory) => d.id === prev.id)
            ? prev
            : dirs[0],
        );
    } catch (e) {
      console.error("获取目录列表失败", e);
      setDirectories([]);
      setSelectedDirectory(null);
    }
  }, [selectedProject]);

  // 打开保存对话框时准备目录
  useEffect(() => {
    if (saveOpen) fetchDirectories();
  }, [saveOpen, fetchDirectories]);

  const handleConfirmSave = useCallback(async () => {
    if (!selectedProject || !selectedDirectory) return;

    // 深度克隆并清理不可序列化的属性
    const serializableNodes = JSON.parse(JSON.stringify(currentNodes));
    const serializableEdges = JSON.parse(JSON.stringify(currentEdges));

    const payload = {
      project_id: selectedProject.id,
      directory_id: selectedDirectory.id,
      name: saveName.trim(),
      description: saveDescription.trim(),
      content: {
        name: `工作流_${new Date().toLocaleDateString()}`,
        description: "导出的工作流",
        nodes: serializableNodes,
        edges: serializableEdges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      priority: savePriority,
      status: saveStatus,
      creator: "admin",
      last_result: "pending",
    };
    console.log("Saving with status:", saveStatus);
    try {
      const res = await window.api.callApi("POST", Api.addTestCase, payload);
      console.log("保存用例", res);
      if (res.success) {
        toast.success("保存成功");
        setSaveOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      console.error("保存用例失败", e);
    }
  }, [
    selectedProject,
    selectedDirectory,
    saveName,
    saveDescription,
    currentNodes,
    currentEdges,
    saveStatus,
    savePriority,
  ]);

  // 加载对话框
  const [loadOpen, setLoadOpen] = useState(false);
  const [cases, setCases] = useState<
    {
      id: string;
      name: string;
      description?: string;
    }[]
  >([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const canLoad = useMemo(
    () => !!selectedProject && !!selectedDirectory && !!selectedCaseId,
    [selectedProject, selectedDirectory, selectedCaseId],
  );

  // 打开加载对话框时准备目录
  useEffect(() => {
    if (loadOpen) fetchDirectories();
  }, [loadOpen, fetchDirectories]);

  // 当目录变化时拉取用例
  const fetchCases = useCallback(async () => {
    if (!selectedProject || !selectedDirectory) {
      setCases([]);
      setSelectedCaseId("");
      return;
    }
    try {
      const resp = await window.api.callApi("POST", Api.getTestCases, {
        current: 1,
        pageSize: 100,
        project_id: selectedProject.id,
        directory_id: selectedDirectory.id,
      });
      const items = resp?.data?.items || [];
      setCases(items);
      if (items.length > 0) setSelectedCaseId(items[0].id);
    } catch (e) {
      console.error("获取用例列表失败", e);
      setCases([]);
      setSelectedCaseId("");
    }
  }, [selectedProject, selectedDirectory]);

  useEffect(() => {
    if (loadOpen) fetchCases();
  }, [loadOpen, selectedDirectory, fetchCases]);

  const handleConfirmLoad = useCallback(async () => {
    if (!canLoad || !selectedProject || !selectedDirectory) return;
    try {
      const res = await window.api.callApi(
        "GET",
        `${Api.getTestCase}/${selectedCaseId}`,
      );
      console.log(res);
      onLoadWorkflow(res.data.content);
      setLoadOpen(false);
    } catch (e) {
      console.error("加载用例失败", e);
    }
  }, [
    canLoad,
    selectedProject,
    selectedDirectory,
    selectedCaseId,
    onLoadWorkflow,
  ]);
  return (
    <Card className="absolute top-4 right-4 p-1 z-10">
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
                  className={isRunning ? "opacity-50" : ""}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRunning ? "工作流正在执行中" : "执行完整工作流"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onStop}
                  disabled={!isRunning}
                  className={!isRunning ? "opacity-50" : ""}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRunning ? "停止工作流执行" : "工作流未运行"}</p>
              </TooltipContent>
            </Tooltip>

            {/* 保存/加载（数据库） */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSaveOpen(true)}
                  disabled={!selectedProject}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>保存用例</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLoadOpen(true)}
                  disabled={!selectedProject}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>加载用例</p>
              </TooltipContent>
            </Tooltip>

            {onViewLog && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={onViewLog}>
                    <Bug className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>日志</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>

        {/* 保存对话框：包含目录选择 + 用例表单 */}
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent className="max-w-2xl bg-card">
            <DialogHeader>
              <DialogTitle>保存</DialogTitle>
              <DialogDescription>
                配置工作流来创建新的执行用例
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 ">
              <div className="grid gap-2">
                <Label>选择目录</Label>
                <Select
                  value={selectedDirectory?.id || ""}
                  onValueChange={(v) =>
                    setSelectedDirectory(
                      directories.find((d) => d.id === v) || null,
                    )
                  }
                  disabled={!selectedProject}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !selectedProject ? "请先选择项目" : "选择目录"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {directories.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="case-name">
                  用例名称<p className="text-red-500">*</p>
                </Label>
                <Input
                  id="case-name"
                  placeholder="请输入用例名称"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>状态</Label>
                  <Select
                    value={saveStatus}
                    onValueChange={(v) => setSaveStatus(v as CaseState)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a fruit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="active">活跃</SelectItem>
                        <SelectItem value="disabled">禁用</SelectItem>
                        <SelectItem value="archived">归档</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>优先级</Label>
                  <Select
                    value={savePriority}
                    onValueChange={(v) => setSavePriority(v as CasePriority)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a fruit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="critical">紧急</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="case-desc">用例描述</Label>
                <Textarea
                  id="case-desc"
                  placeholder="可选"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleConfirmSave} size="sm">
                <FolderPlus className="h-4 w-4" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 加载对话框：目录选择 + 用例选择 */}
        <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>加载测试用例</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label>选择目录</Label>
                <Select
                  value={selectedDirectory?.id || ""}
                  onValueChange={(v) =>
                    setSelectedDirectory(
                      directories.find((d) => d.id === v) || null,
                    )
                  }
                  disabled={!selectedProject}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !selectedProject ? "请先选择项目" : "选择目录"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {directories.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[40vh] overflow-auto space-y-2">
                {cases.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    {selectedDirectory ? "该目录暂无用例" : "请选择目录"}
                  </div>
                ) : (
                  cases.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="case"
                        value={c.id}
                        checked={selectedCaseId === c.id}
                        onChange={() => setSelectedCaseId(c.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        {c.description && (
                          <div className="text-xs text-muted-foreground">
                            {c.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setLoadOpen(false)}>
                取消
              </Button>
              <Button onClick={handleConfirmLoad} disabled={!canLoad}>
                加载
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
