import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  console.log("TaskDetailSheet task", task);
  if (!task) return null;
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
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-base">{task.name}</SheetTitle>
          <SheetDescription className="text-xs">
            任务详情和监控数据
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 错误信息展示 */}
          {task.status === "error" && task.errorMessage && (
            <Card className="border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    执行错误
                  </CardTitle>
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
                        复制错误信息
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-white dark:bg-gray-900 p-3 border border-red-200 dark:border-red-900/30">
                  <pre className="text-xs font-mono text-red-800 dark:text-red-300 whitespace-pre-wrap break-words overflow-x-auto">
                    {task.errorMessage}
                  </pre>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  任务因执行错误已自动停止。请检查脚本代码或联系技术支持。
                </p>
              </CardContent>
            </Card>
          )}
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
          {/* 监控项数据统计 */}
          {metricStats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">监控项数据</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metricStats.map(({ key, metric, stats }) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={key}
                        className="rounded-md border border-border/30 bg-muted/10 p-3 space-y-2"
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
                        <div className="pt-2 border-t border-border/20">
                          <span className="text-[10px] text-muted-foreground">
                            样本数: {stats.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          {/* 监控图表 */}
          {task.data && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold">监控数据</h3>
              <div className="grid grid-cols-1 gap-3">
                {task.data &&
                  Object.entries(task.data).map(([key, data]) => {
                    if (!data || !Array.isArray(data) || data.length === 0)
                      return null;
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
