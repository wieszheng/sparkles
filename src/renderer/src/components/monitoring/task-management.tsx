import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  Trash2,
  ListTodo,
  Archive,
} from "lucide-react";

import { TaskStatusBadge } from "./task-status-badge";

interface TaskManagementProps {
  onViewTask: (task: MonitoringTask) => void;
}
export function TaskManagement({ onViewTask }: TaskManagementProps) {
  const [tasks, setTasks] = useState<MonitoringTask[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 加载任务列表
  const loadTasks = async () => {
    try {
      const backendTasks = await window.api.listTasks();
      // 转换为 MonitoringTask 格式
      const monitoringTasks: MonitoringTask[] = backendTasks.map(
        (t, index) => ({
          id: index + 1,
          name: t.name,
          script: t.scriptTemplateId,
          app: t.packageName,
          status:
            t.status === "running"
              ? "running"
              : t.status === "finished"
                ? "completed"
                : t.status === "error"
                  ? "error"
                  : "pending",
          createdAt: new Date(t.createdAt).toISOString().split("T")[0],
          deprecated: false,
          reportData: true,
          backendId: t.id,
          errorMessage: t.errorMessage,
          archived: (t as any).archived,
        }),
      );
      setTasks(monitoringTasks);
    } catch (error) {
      console.error("加载任务列表失败:", error);
    }
  };

  useEffect(() => {
    loadTasks();
    // 定期刷新任务列表
    // const interval = setInterval(() => {
    //   void loadTasks();
    // }, 3000);
    // return () => clearInterval(interval);
  }, []);

  const handleToggleTaskStatus = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task?.backendId) return;

    const action =
      task.status === "running"
        ? () => window.api.stopTask(task.backendId!)
        : () => window.api.startTask(task.backendId!);

    void action()
      .then(() => {
        void loadTasks();
      })
      .catch(console.error);
  };

  const handleDeleteTask = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task?.backendId) return;
    void window.api
      .removeTask(task.backendId)
      .then(() => {
        void loadTasks();
      })
      .catch(console.error);
  };

  const handleArchiveTask = async (id: number, archived: boolean) => {
    const task = tasks.find((t) => t.id === id);
    if (!task?.backendId) return;

    try {
      const result = await window.api.archiveTask(task.backendId, archived);
      if (result.success) {
        await loadTasks();
      }
    } catch (error) {
      console.error("归档任务失败:", error);
    }
  };
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* 搜索和筛选 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="running">运行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="pending">待执行</SelectItem>
            <SelectItem value="stopped">已停止</SelectItem>
            <SelectItem value="error">异常</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 任务列表 - 使用 ScrollArea 包装 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mr-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-md border border-border/30 bg-muted/50 p-3 hover:border-border/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {task.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.script}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewTask(task)}>
                      <Eye className="h-3.5 w-3.5" />
                      查看详情
                    </DropdownMenuItem>
                    {!task.archived && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleToggleTaskStatus(task.id)}
                        >
                          {task.status === "running" ? (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              暂停任务
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              启动任务
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchiveTask(task.id, true)}
                        >
                          <Archive className="h-3.5 w-3.5" />
                          归档
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          删除
                        </DropdownMenuItem>
                      </>
                    )}
                    {/*{task.archived && (*/}
                    {/*  <DropdownMenuItem*/}
                    {/*    onClick={() => handleArchiveTask(task.id, false)}*/}
                    {/*  >*/}
                    {/*    <ArchiveRestore className="h-3.5 w-3.5 mr-2" />*/}
                    {/*    取消归档*/}
                    {/*  </DropdownMenuItem>*/}
                    {/*)}*/}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <TaskStatusBadge status={task.status} />
                {task.archived && (
                  <Badge className="text-[10px] px-1.5 py-0 ">已归档</Badge>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {task.app}
                </Badge>
              </div>

              <div className="space-y-1 text-[10px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>创建</span>
                  <span>{task.createdAt}</span>
                </div>
                {task.startTime && (
                  <div className="flex items-center justify-between">
                    <span>开始</span>
                    <span>{task.startTime}</span>
                  </div>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  数据上报
                </span>
                <div
                  className={`h-1.5 w-1.5 rounded-full ${task.reportData ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                />
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="rounded-md border border-dashed border-border/40 py-8 text-center">
            <ListTodo className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">没有找到匹配的任务</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
