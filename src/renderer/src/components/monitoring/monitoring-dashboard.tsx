import { Button } from "@/components/ui/button";
import { Plus, Square, Zap } from "lucide-react";

import { MonitoringChart } from "./monitoring-chart";
import { TaskStatusBadge } from "./task-status-badge";

interface MonitoringDashboardProps {
  tasks: MonitoringTask[];
  monitorConfig: MonitorConfig;
  onCreateTask: () => void;
  onToggleTaskStatus: (id: number) => void;
}

export function MonitoringDashboard({
  tasks,
  monitorConfig,
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
    <div className="space-y-4">
      {runningTasks.map((task) => (
        <div key={task.id} className="space-y-3">
          <div className="flex items-center justify-between">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(monitorConfig).map(([key, enabled]) => {
              if (
                key === "interval" ||
                !enabled ||
                !task.data?.[key as keyof typeof task.data]
              )
                return null;
              return (
                <div
                  key={key}
                  className="rounded-md border border-border/30 bg-muted/20 p-3"
                >
                  <MonitoringChart
                    metricKey={key}
                    data={task.data[key as keyof typeof task.data]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
