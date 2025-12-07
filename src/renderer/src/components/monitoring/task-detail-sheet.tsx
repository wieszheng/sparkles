import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { MonitoringChart } from "./monitoring-chart";
import { TaskStatusBadge } from "./task-status-badge";

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: MonitoringTask | null;
  monitorConfig: MonitorConfig;
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  monitorConfig,
}: TaskDetailSheetProps) {
  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-base">{task.name}</SheetTitle>
          <SheetDescription className="text-xs">
            任务详情和监控数据
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 任务信息 */}
          <div className="rounded-md border border-border/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">状态</span>
              <TaskStatusBadge status={task.status} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">脚本</span>
              <span>{task.script}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">应用</span>
              <span>{task.app}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">创建时间</span>
              <span>{task.createdAt}</span>
            </div>
            {task.startTime && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">开始时间</span>
                <span>{task.startTime}</span>
              </div>
            )}
            {task.endTime && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">结束时间</span>
                <span>{task.endTime}</span>
              </div>
            )}
          </div>

          {/* 监控图表 */}
          {task.data && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold">监控数据</h3>
              <div className="grid grid-cols-1 gap-3">
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
