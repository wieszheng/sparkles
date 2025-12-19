import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Square, Zap } from "lucide-react";

import { MonitoringChart } from "./monitoring-chart";
import { TaskStatusBadge } from "./task-status-badge";

interface MonitoringDashboardProps {
  tasks: MonitoringTask[];
  onCreateTask: () => void;
  onToggleTaskStatus: (id: number) => void;
}

export function MonitoringDashboard({
  tasks,
  onCreateTask,
  onToggleTaskStatus,
}: MonitoringDashboardProps) {
  const runningTasks = tasks.filter((t) => t.status === "running");

  if (runningTasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/40 py-12 text-center">
        <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-medium mb-1">暂无运行中的任务</h3>
        <p className="text-xs text-muted-foreground mb-3">
          创建一个新任务开始监控
        </p>
        <Button
          onClick={onCreateTask}
          size="sm"
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          新建任务
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 固定控制区 */}
      <div className="flex-shrink-0 space-y-3 pb-3 border-b border-border/40">
        {runningTasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative h-2 w-2">
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold">{task.name}</h2>
              <TaskStatusBadge status={task.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {task.startTime}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleTaskStatus(task.id)}
                className="h-7 text-xs gap-1"
              >
                <Square className="h-3 w-3" />
                停止
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 可滚动图表区 */}
      <div className="flex-1 min-h-0 pt-3">
        <ScrollArea className="h-full">
          <div className="space-y-4 mr-3">
            {runningTasks.map((task) => (
              <div key={task.id} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {task.data &&
                    Object.entries(task.data).map(([key, data]) => {
                      if (!data || !Array.isArray(data) || data.length === 0)
                        return null;
                      console.log("key", key);
                      return (
                        <div
                          key={key}
                          className="rounded-md border border-border/30 bg-muted/20 p-3"
                        >
                          <MonitoringChart metricKey={key} data={data} />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
