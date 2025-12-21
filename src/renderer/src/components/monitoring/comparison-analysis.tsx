import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  Download,
  FileText,
  X,
  CheckCircle2,
  TrendingUp,
  Table,
  Cpu,
  HardDrive,
  Thermometer,
  Battery,
  Wifi,
} from "lucide-react";

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

interface ComparisonAnalysisProps {
  tasks: MonitoringTask[];
  onClose?: () => void;
}

interface TaskStatistics {
  taskId: string;
  taskName: string;
  metrics: {
    [key: string]: {
      avg: number;
      max: number;
      min: number;
      current: number;
      count: number;
    };
  };
}

interface ComparisonResult {
  tasks: TaskStatistics[];
  comparison: {
    [metricKey: string]: {
      best: { taskId: string; taskName: string; value: number };
      worst: { taskId: string; taskName: string; value: number };
      avg: number;
      variance: number;
    };
  };
}

export function ComparisonAnalysis({
  tasks,
  onClose,
}: ComparisonAnalysisProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [taskSamplesData, setTaskSamplesData] = useState<Record<string, any[]>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"table" | "charts">("charts");

  // 已完成的任务
  const completedTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.status === "completed" || t.status === "stopped") && t.backendId,
    );
  }, [tasks]);

  // 加载任务监控数据
  const loadTaskMetrics = async (taskId: string) => {
    try {
      const samples = await window.api.getTaskMetrics(taskId);
      setTaskSamplesData((prev) => ({
        ...prev,
        [taskId]: samples,
      }));
      return samples;
    } catch (error) {
      console.error(`加载任务 ${taskId} 的监控数据失败:`, error);
      return [];
    }
  };

  // 将 samples 转换为按指标分组的数据
  const convertSamplesToData = (samples: any[]): MonitoringTask["data"] => {
    const data: MonitoringTask["data"] = {
      cpu: [],
      memory: [],
      gpu: [],
      fps: [],
      temperature: [],
      power: [],
      network: [],
    };

    samples.forEach((sample) => {
      const time = new Date(sample.timestamp).toLocaleTimeString("zh-CN");

      if (sample.cpu != null) {
        data.cpu.push({ time, value: sample.cpu });
      }
      if (sample.memory != null) {
        data.memory.push({ time, value: sample.memory });
      }
      if (sample.gpuLoad != null) {
        data.gpu.push({ time, value: sample.gpuLoad });
      }
      if (sample.fps != null) {
        data.fps.push({ time, value: sample.fps });
      }
      if (sample.deviceTemperature != null) {
        data.temperature.push({ time, value: sample.deviceTemperature });
      }
      if (sample.powerConsumption != null) {
        data.power.push({ time, value: sample.powerConsumption });
      }
      if (sample.networkUpSpeed != null || sample.networkDownSpeed != null) {
        const networkValue =
          (sample.networkUpSpeed || 0) + (sample.networkDownSpeed || 0);
        data.network.push({ time, value: networkValue });
      }
    });

    return data;
  };

  // 计算任务统计信息
  const calculateTaskStatistics = (
    taskId: string,
    samples: any[],
  ): TaskStatistics["metrics"] => {
    const metrics: TaskStatistics["metrics"] = {};

    // 先尝试从 task.data 获取（如果已存在）
    const task = tasks.find((t) => t.backendId === taskId);
    let data = task?.data;

    // 如果没有 data，从 samples 转换
    if (!data && samples.length > 0) {
      data = convertSamplesToData(samples);
    }

    if (!data) return metrics;

    // 遍历所有监控指标
    const metricKeys: Array<keyof typeof data> = [
      "cpu",
      "memory",
      "gpu",
      "fps",
      "temperature",
      "power",
      "network",
    ];

    metricKeys.forEach((key) => {
      const metricData = data[key];
      if (!metricData || metricData.length === 0) return;

      const values = metricData
        .map((d) => d.value)
        .filter((v) => v != null && !isNaN(v)) as number[];
      if (values.length === 0) return;

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const current = values[values.length - 1] || 0;

      metrics[key] = {
        avg: Number(avg.toFixed(2)),
        max: Number(max.toFixed(2)),
        min: Number(min.toFixed(2)),
        current: Number(current.toFixed(2)),
        count: values.length,
      };
    });

    return metrics;
  };

  // 执行对比分析
  const performComparison = async () => {
    if (selectedTaskIds.size < 2) {
      alert("请至少选择 2 个任务进行对比");
      return;
    }

    setLoading(true);
    try {
      // 加载所有选中任务的监控数据
      const loadPromises = Array.from(selectedTaskIds).map(async (taskId) => {
        const samples = await loadTaskMetrics(taskId);
        return { taskId, samples };
      });
      const loadedData = await Promise.all(loadPromises);

      // 计算每个任务的统计信息
      const taskStats: TaskStatistics[] = [];
      for (const { taskId, samples } of loadedData) {
        const task = tasks.find((t) => t.backendId === taskId);
        if (!task) continue;

        const metrics = calculateTaskStatistics(taskId, samples);

        // 只有当有指标数据时才添加
        if (Object.keys(metrics).length > 0) {
          taskStats.push({
            taskId,
            taskName: task.name,
            metrics,
          });
        }
      }

      if (taskStats.length === 0) {
        alert("所选任务没有可用的监控数据，请确保任务已完成并包含监控数据");
        setLoading(false);
        return;
      }

      // 计算对比结果
      const comparison: ComparisonResult["comparison"] = {};

      // 获取所有指标键
      const allMetricKeys = new Set<string>();
      taskStats.forEach((stat) => {
        Object.keys(stat.metrics).forEach((key) => allMetricKeys.add(key));
      });

      allMetricKeys.forEach((metricKey) => {
        const metricValues = taskStats
          .map((stat) => ({
            taskId: stat.taskId,
            taskName: stat.taskName,
            value: stat.metrics[metricKey]?.avg || 0,
          }))
          .filter((item) => item.value > 0);

        if (metricValues.length === 0) return;

        // 计算平均值
        const avg =
          metricValues.reduce((sum, item) => sum + item.value, 0) /
          metricValues.length;

        // 计算方差
        const variance =
          metricValues.reduce((sum, item) => {
            return sum + Math.pow(item.value - avg, 2);
          }, 0) / metricValues.length;

        // 找出最佳和最差（根据指标类型判断，FPS 越高越好，CPU/温度等越低越好）
        const isHigherBetter = metricKey === "fps";
        const sorted = [...metricValues].sort((a, b) =>
          isHigherBetter ? b.value - a.value : a.value - b.value,
        );

        comparison[metricKey] = {
          best: sorted[0],
          worst: sorted[sorted.length - 1],
          avg: Number(avg.toFixed(2)),
          variance: Number(variance.toFixed(2)),
        };
      });

      setComparisonResult({
        tasks: taskStats,
        comparison,
      });
    } catch (error) {
      console.error("对比分析失败:", error);
      alert("对比分析失败");
    } finally {
      setLoading(false);
    }
  };

  // 生成报告
  const generateReport = () => {
    if (!comparisonResult) return;

    const report = {
      title: "监控数据对比分析报告",
      generatedAt: new Date().toLocaleString("zh-CN"),
      tasks: comparisonResult.tasks.map((t) => ({
        name: t.taskName,
        id: t.taskId,
        metrics: t.metrics,
      })),
      comparison: comparisonResult.comparison,
      summary: Object.keys(comparisonResult.comparison).map((metricKey) => {
        const comp = comparisonResult.comparison[metricKey];
        return {
          metric: metricKey,
          bestTask: comp.best.taskName,
          worstTask: comp.worst.taskName,
          average: comp.avg,
          variance: comp.variance,
        };
      }),
    };

    // 显示报告对话框
    setShowReportDialog(true);

    // 也可以导出为 JSON
    return report;
  };

  // 导出报告为 JSON
  const exportReport = () => {
    if (!comparisonResult) return;

    const report = generateReport();
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出报告为文本
  const exportReportText = () => {
    if (!comparisonResult) return;

    let text = "监控数据对比分析报告\n";
    text += "=".repeat(50) + "\n\n";
    text += `生成时间: ${new Date().toLocaleString("zh-CN")}\n\n`;

    text += "参与对比的任务:\n";
    comparisonResult.tasks.forEach((task, index) => {
      text += `${index + 1}. ${task.taskName} (ID: ${task.taskId})\n`;
    });
    text += "\n";

    text += "对比结果:\n";
    text += "-".repeat(50) + "\n";
    Object.keys(comparisonResult.comparison).forEach((metricKey) => {
      const comp = comparisonResult.comparison[metricKey];
      text += `\n指标: ${metricKey}\n`;
      text += `  最佳: ${comp.best.taskName} (${comp.best.value})\n`;
      text += `  最差: ${comp.worst.taskName} (${comp.worst.value})\n`;
      text += `  平均: ${comp.avg}\n`;
      text += `  方差: ${comp.variance}\n`;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // 准备柱状图数据（平均值对比）
  const prepareBarChartData = (metricKey: string) => {
    if (!comparisonResult) return [];

    return comparisonResult.tasks
      .map((task) => {
        const stat = task.metrics[metricKey];
        if (!stat) return null;
        return {
          task: task.taskName,
          avg: stat.avg,
          max: stat.max,
          min: stat.min,
        };
      })
      .filter(Boolean) as Array<{
      task: string;
      avg: number;
      max: number;
      min: number;
    }>;
  };

  // 准备折线图数据（时间序列对比）
  const prepareLineChartData = (metricKey: string) => {
    if (!comparisonResult) return [];

    // 获取所有任务的时间序列数据
    const allTimePoints = new Set<string>();
    const taskDataMap: Record<
      string,
      Array<{ time: string; value: number }>
    > = {};

    comparisonResult.tasks.forEach((task) => {
      const taskObj = tasks.find((t) => t.backendId === task.taskId);
      if (!taskObj) return;

      // 尝试从 task.data 获取
      let data = taskObj.data?.[metricKey as keyof typeof taskObj.data];

      // 如果没有，从 samples 转换
      if (!data && taskSamplesData[task.taskId]) {
        const converted = convertSamplesToData(taskSamplesData[task.taskId]);
        if (converted) {
          data = converted[metricKey as keyof typeof converted];
        }
      }

      if (data && data.length > 0) {
        taskDataMap[task.taskId] = data;
        data.forEach((d) => allTimePoints.add(d.time));
      }
    });

    // 按时间排序
    const sortedTimePoints = Array.from(allTimePoints).sort();

    // 构建折线图数据
    return sortedTimePoints.map((time) => {
      const dataPoint: Record<string, any> = { time };
      comparisonResult.tasks.forEach((task) => {
        const data = taskDataMap[task.taskId];
        if (data) {
          const point = data.find((d) => d.time === time);
          dataPoint[task.taskName] = point?.value ?? null;
        }
      });
      return dataPoint;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">数据对比分析</h2>
            <p className="text-sm text-muted-foreground">
              选择多个已完成的任务进行对比分析
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 任务选择 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">选择任务 (至少选择 2 个)</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {completedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无已完成的任务</p>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.backendId}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(task.backendId!)}
                    onChange={() => toggleTaskSelection(task.backendId!)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label className="text-sm flex-1 cursor-pointer">
                    {task.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({task.backendId})
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button
              onClick={performComparison}
              disabled={selectedTaskIds.size < 2 || loading}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {loading ? "分析中..." : "开始对比分析"}
            </Button>
            {comparisonResult && (
              <>
                <Button
                  variant="outline"
                  onClick={generateReport}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  查看报告
                </Button>
                <Button
                  variant="outline"
                  onClick={exportReport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  导出 JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={exportReportText}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  导出 TXT
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* 对比结果 */}
        {comparisonResult && (
          <div className="space-y-4">
            {/* 视图切换 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">对比结果</h3>
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "table" | "charts")}
                >
                  <TabsList className="h-8">
                    <TabsTrigger
                      value="charts"
                      className="text-xs px-3 h-7 gap-1.5"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      图表视图
                    </TabsTrigger>
                    <TabsTrigger
                      value="table"
                      className="text-xs px-3 h-7 gap-1.5"
                    >
                      <Table className="h-3.5 w-3.5" />
                      表格视图
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {viewMode === "charts" ? (
                /* 图表视图 */
                <div className="space-y-6">
                  {Object.keys(comparisonResult.comparison).map((metricKey) => {
                    const metric = monitorMetrics.find(
                      (m) => m.key === metricKey,
                    );
                    const barData = prepareBarChartData(metricKey);
                    const lineData = prepareLineChartData(metricKey);
                    const comp = comparisonResult.comparison[metricKey];

                    if (!metric || barData.length === 0) return null;

                    return (
                      <Card key={metricKey} className="p-4">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <metric.icon
                                className="h-4 w-4"
                                style={{ color: metric.color }}
                              />
                              <h4 className="text-sm font-medium">
                                {metric.label} 对比
                              </h4>
                            </div>
                            <Badge variant="outline">
                              平均: {comp.avg} {metric.unit}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              最佳: {comp.best.taskName} ({comp.best.value}{" "}
                              {metric.unit})
                            </div>
                            <div>
                              最差: {comp.worst.taskName} ({comp.worst.value}{" "}
                              {metric.unit})
                            </div>
                          </div>
                        </div>

                        <Tabs defaultValue="bar" className="w-full">
                          <TabsList className="mb-4">
                            <TabsTrigger value="bar">平均值对比</TabsTrigger>
                            {lineData.length > 0 && (
                              <TabsTrigger value="line">
                                时间序列对比
                              </TabsTrigger>
                            )}
                          </TabsList>

                          <TabsContent value="bar" className="mt-0">
                            <div className="h-[300px]">
                              <ChartContainer
                                config={{
                                  task: { label: "任务", color: metric.color },
                                }}
                                className="w-full h-full"
                              >
                                <BarChart
                                  data={barData}
                                  margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    strokeOpacity={0.2}
                                  />
                                  <XAxis
                                    dataKey="task"
                                    tick={{ fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10 }}
                                    label={{
                                      value: metric.unit,
                                      angle: -90,
                                      position: "insideLeft",
                                    }}
                                  />
                                  <ChartTooltip
                                    content={<ChartTooltipContent />}
                                  />
                                  <Legend />
                                  <Bar
                                    dataKey="avg"
                                    name={`平均值 (${metric.unit})`}
                                    fill={metric.color}
                                    radius={[4, 4, 0, 0]}
                                  />
                                  <Bar
                                    dataKey="max"
                                    name={`最大值 (${metric.unit})`}
                                    fill={`${metric.color}80`}
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ChartContainer>
                            </div>
                          </TabsContent>

                          {lineData.length > 0 && (
                            <TabsContent value="line" className="mt-0">
                              <div className="h-[300px]">
                                <ChartContainer
                                  config={comparisonResult.tasks.reduce(
                                    (acc, task) => {
                                      acc[task.taskName] = {
                                        label: task.taskName,
                                        color: `hsl(${(comparisonResult.tasks.indexOf(task) * 60) % 360}, 70%, 50%)`,
                                      };
                                      return acc;
                                    },
                                    {} as Record<
                                      string,
                                      { label: string; color: string }
                                    >,
                                  )}
                                  className="w-full h-full"
                                >
                                  <LineChart
                                    data={lineData}
                                    margin={{
                                      top: 10,
                                      right: 10,
                                      left: 0,
                                      bottom: 0,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="hsl(var(--border))"
                                      strokeOpacity={0.2}
                                    />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 10 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 10 }}
                                      label={{
                                        value: metric.unit,
                                        angle: -90,
                                        position: "insideLeft",
                                      }}
                                    />
                                    <ChartTooltip
                                      content={<ChartTooltipContent />}
                                    />
                                    <Legend />
                                    {comparisonResult.tasks.map(
                                      (task, index) => {
                                        const color = `hsl(${(index * 60) % 360}, 70%, 50%)`;
                                        return (
                                          <Line
                                            key={task.taskId}
                                            type="monotone"
                                            dataKey={task.taskName}
                                            stroke={color}
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            connectNulls
                                          />
                                        );
                                      },
                                    )}
                                  </LineChart>
                                </ChartContainer>
                              </div>
                            </TabsContent>
                          )}
                        </Tabs>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* 表格视图 */
                <div className="space-y-4">
                  {comparisonResult.tasks.length > 0 &&
                  Object.keys(comparisonResult.comparison).length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">任务</th>
                              {Object.keys(comparisonResult.comparison).map(
                                (metricKey) => (
                                  <th
                                    key={metricKey}
                                    className="text-center p-2"
                                  >
                                    {metricKey.toUpperCase()}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonResult.tasks.map((task) => (
                              <tr key={task.taskId} className="border-b">
                                <td className="p-2 font-medium">
                                  {task.taskName}
                                </td>
                                {Object.keys(comparisonResult.comparison).map(
                                  (metricKey) => {
                                    const stat = task.metrics[metricKey];
                                    if (!stat)
                                      return (
                                        <td
                                          key={metricKey}
                                          className="p-2 text-center"
                                        >
                                          -
                                        </td>
                                      );
                                    return (
                                      <td
                                        key={metricKey}
                                        className="p-2 text-center"
                                      >
                                        <div className="space-y-1">
                                          <div>平均: {stat.avg}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {stat.min} ~ {stat.max}
                                          </div>
                                        </div>
                                      </td>
                                    );
                                  },
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 对比分析 */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-3">对比分析</h4>
                        <div className="space-y-3">
                          {Object.keys(comparisonResult.comparison).map(
                            (metricKey) => {
                              const comp =
                                comparisonResult.comparison[metricKey];

                              return (
                                <div
                                  key={metricKey}
                                  className="border rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">
                                      {metricKey.toUpperCase()}
                                    </span>
                                    <Badge variant="outline">
                                      平均: {comp.avg}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      <span className="text-muted-foreground">
                                        最佳:
                                      </span>
                                      <span className="font-medium">
                                        {comp.best.taskName}
                                      </span>
                                      <span className="text-green-600">
                                        ({comp.best.value})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <X className="h-3 w-3 text-red-600" />
                                      <span className="text-muted-foreground">
                                        最差:
                                      </span>
                                      <span className="font-medium">
                                        {comp.worst.taskName}
                                      </span>
                                      <span className="text-red-600">
                                        ({comp.worst.value})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    方差: {comp.variance}{" "}
                                    (数值越小表示性能越稳定)
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      没有可用的任务统计数据
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* 报告对话框 */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>对比分析报告</DialogTitle>
            <DialogDescription>
              生成时间: {new Date().toLocaleString("zh-CN")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {comparisonResult && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">参与对比的任务</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {comparisonResult.tasks.map((task) => (
                      <li key={task.taskId}>{task.taskName}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">对比结果摘要</h4>
                  <div className="space-y-2 text-sm">
                    {Object.keys(comparisonResult.comparison).map(
                      (metricKey) => {
                        const comp = comparisonResult.comparison[metricKey];
                        return (
                          <div key={metricKey} className="border rounded p-2">
                            <div className="font-medium">
                              {metricKey.toUpperCase()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              最佳: {comp.best.taskName} ({comp.best.value}) |
                              最差: {comp.worst.taskName} ({comp.worst.value}) |
                              平均: {comp.avg} | 方差: {comp.variance}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
            >
              关闭
            </Button>
            <Button onClick={exportReport} className="gap-2">
              <Download className="h-4 w-4" />
              导出 JSON
            </Button>
            <Button onClick={exportReportText} className="gap-2">
              <Download className="h-4 w-4" />
              导出 TXT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
