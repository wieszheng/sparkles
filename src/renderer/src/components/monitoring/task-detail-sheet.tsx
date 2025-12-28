import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MonitoringChart } from "./monitoring-chart";
import { TaskStatusBadge } from "./task-status-badge";
import { useState } from "react";
import {
  AlertCircle,
  Battery,
  CheckCircle2,
  Copy,
  Cpu,
  HardDrive,
  Thermometer,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: MonitoringTask | null;
}

const monitorMetrics: MonitorMetric[] = [
  { key: "cpu", label: "CPU 使用率", icon: Cpu, color: "#3b82f6", unit: "%" },
  {
    key: "memory",
    label: "内存占用",
    icon: HardDrive,
    color: "#10b981",
    unit: "MB",
  },
  {
    key: "gpu",
    label: "GPU 负载",
    icon: Cpu,
    color: "#6366f1",
    unit: "%",
  },
  {
    key: "fps",
    label: "FPS 帧率",
    icon: Thermometer,
    color: "#22c55e",
    unit: "fps",
  },
  {
    key: "temperature",
    label: "温度",
    icon: Thermometer,
    color: "#f59e0b",
    unit: "°C",
  },
  {
    key: "power",
    label: "功耗",
    icon: Battery,
    color: "#8b5cf6",
    unit: "W",
  },
  {
    key: "network",
    label: "网络流量",
    icon: Wifi,
    color: "#ec4899",
    unit: "MB/s",
  },
];

// 计算监控数据的统计信息
function calculateStats(data: Array<{ time: string; value: number }>) {
  if (!data || data.length === 0) {
    return {
      count: 0,
      avg: 0,
      max: 0,
      min: 0,
      current: 0,
    };
  }

  const values = data
    .map((d) => d.value)
    .filter((v) => typeof v === "number" && !isNaN(v));
  if (values.length === 0) {
    return {
      count: 0,
      avg: 0,
      max: 0,
      min: 0,
      current: 0,
    };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const current = values[values.length - 1]; // 最新值

  return {
    count: values.length,
    avg: Number(avg.toFixed(2)),
    max: Number(max.toFixed(2)),
    min: Number(min.toFixed(2)),
    current: Number(current.toFixed(2)),
  };
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
}: TaskDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!task) return null;

  console.log("TaskDetailSheet task", task);
  // 复制错误信息到剪贴板
  const handleCopyError = async () => {
    if (task.errorMessage) {
      try {
        await navigator.clipboard.writeText(task.errorMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("复制失败:", error);
      }
    }
  };

  // 计算各监控项的统计数据
  const metricStats = task.data
    ? Object.entries(task.data)
        .map(([key, data]) => {
          if (!data || !Array.isArray(data) || data.length === 0) return null;
          const metric = monitorMetrics.find((m) => m.key === key);
          if (!metric) return null;
          return {
            key,
            metric,
            stats: calculateStats(data),
            data,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-card p-0 rounded-l-lg"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="flex-shrink-0 p-3.5">
            <SheetTitle>{task.name}</SheetTitle>
            <SheetDescription>任务详情和监控数据</SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-3 pb-6 space-y-4">
                {/* 错误信息展示 */}
                {task.status === "error" && task.errorMessage && (
                  <div className="p-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex items-center gap-1 text-red-700 dark:text-red-400 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        执行错误
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyError}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            复制错误
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="rounded-md bg-white dark:bg-gray-900 p-3 border border-red-200 dark:border-red-900/30">
                      <pre className="text-xs font-mono text-red-800 dark:text-red-300 whitespace-pre-wrap break-words overflow-x-auto">
                        {task.errorMessage}
                      </pre>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      任务因执行错误已自动停止。请检查脚本代码或联系技术支持。
                    </p>
                  </div>
                )}
                {/* 任务信息 */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">状态</span>
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">脚本</span>
                    <span>{task.script}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">应用</span>
                    <span>{task.app}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">创建时间</span>
                    <span>{task.createdAt}</span>
                  </div>
                  {task.startTime && (
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">开始时间</span>
                      <span>{task.startTime}</span>
                    </div>
                  )}
                  {task.endTime && (
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">结束时间</span>
                      <span>{task.endTime}</span>
                    </div>
                  )}
                </div>
                {/* 监控项数据统计 */}
                {metricStats.length > 0 && (
                  <div className="p-2 space-y-3">
                    <div className="text-sm font-semibold">监控项数据</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {metricStats.map(({ key, metric, stats }) => {
                        const Icon = metric.icon;
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-border/30 shadow-sm bg-background/30 shrink-0 p-3 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                className="h-4 w-4"
                                style={{ color: metric.color }}
                              />
                              <span className="text-xs font-medium">
                                {metric.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  当前值
                                </span>
                                <div className="text-sm font-semibold mt-0.5">
                                  {stats.current} {metric.unit}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  平均值
                                </span>
                                <div className="text-sm font-semibold mt-0.5">
                                  {stats.avg} {metric.unit}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  最大值
                                </span>
                                <div className="text-sm font-semibold mt-0.5">
                                  {stats.max} {metric.unit}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  最小值
                                </span>
                                <div className="text-sm font-semibold mt-0.5">
                                  {stats.min} {metric.unit}
                                </div>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                样本数: {stats.count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* 监控图表 */}
                {task.data && (
                  <div className="space-y-3 p-2">
                    <h3 className="text-sm font-semibold">监控数据</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {task.data &&
                        Object.entries(task.data).map(([key, data]) => {
                          if (
                            !data ||
                            !Array.isArray(data) ||
                            data.length === 0
                          )
                            return null;
                          return (
                            <div
                              key={key}
                              className="rounded-lg border border-border/50 p-3 shadow-sm bg-background/30"
                            >
                              <MonitoringChart metricKey={key} data={data} />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
