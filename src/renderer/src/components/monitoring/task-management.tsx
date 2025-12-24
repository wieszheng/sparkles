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
  Database,
  Cpu,
  FolderOpen,
} from "lucide-react";

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
          archived: t.archived,
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
    // }, 1000);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "running":
        return "bg-primary text-primary-foreground";
      case "completed":
        return "bg-emerald-600 text-white";
      case "error":
        return "bg-destructive text-destructive-foreground";
      case "stopped":
        return "bg-yellow-600 text-white";
      case "pending":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "正在运行";
      case "completed":
        return "执行成功";
      case "error":
        return "运行异常";
      case "stopped":
        return "手动停止";
      case "pending":
        return "待运行";
      default:
        return "未知状态";
    }
  };
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

      {/* 任务列表 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mr-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-card rounded-lg p-4 shadow-sm">
              {/* Header: Title and Status with More button */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate">
                    {task.name}
                  </h3>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${getStatusStyle(task.status)}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                  {task.archived && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Archive className="w-3 h-3" />
                      已归档
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewTask(task)}>
                      <Eye className="h-3.5 w-3.5" />
                      查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (task.backendId) {
                          window.api.openLogDirectory(task.backendId);
                        }
                      }}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      查看日志
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
              {/* Badges row removed - moved to header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-muted-foreground">
                      目标应用
                    </div>
                    <div className="text-xs font-medium text-foreground">
                      {task.app}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Database className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-muted-foreground">
                      执行脚本
                    </div>
                    <div className="text-xs font-mono text-foreground truncate max-w-[200px]">
                      {task.script}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    开始时间
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.createdAt ? task.createdAt : "--:--"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    完成时间
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.endTime ? task.endTime.split(" ")[1] : "--:--"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="rounded-md border border-dashed border-border py-8 text-center">
            <ListTodo className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">没有找到匹配的任务</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
