import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  Package,
} from "lucide-react";
import { MultiSelectCombobox } from "@/components/multi-select-combobox";

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

export function ComparisonAnalysis() {
  const [tasks, setTasks] = useState<MonitoringTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [taskSamplesData, setTaskSamplesData] = useState<Record<string, any[]>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"table" | "charts">("charts");

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

  // 组件挂载时加载任务列表
  useEffect(() => {
    loadTasks();
  }, []);

  // 已完成的任务
  const completedTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.status === "completed" || t.status === "stopped") && t.backendId,
    );
  }, [tasks]);

  // 准备多选框数据
  const taskItems = useMemo(() => {
    return completedTasks.map((task) => ({
      value: task.backendId!,
      label: task.name,
      color: undefined,
      icon: undefined,
    }));
  }, [completedTasks]);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTaskIds.length === completedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(completedTasks.map((t) => t.backendId!));
    }
  };

  // 加载任务监控数据
  const loadTaskMetrics = async (taskId: string) => {
    try {
      const samples = await window.api.getTaskMetrics(taskId);
      setTaskSamplesData((prev) => ({
        ...prev,

        [taskId]: samples,
      }));
      console.log(`加载任务 ${taskId} 的监控数据成功`, samples);
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
        console.log("powerConsumption", sample.powerConsumption);
        data.power.push({ time, value: sample.powerConsumption });
      }
      if (sample.networkUpSpeed != null || sample.networkDownSpeed != null) {
        const networkValue =
          (sample.networkUpSpeed || 0) + (sample.networkDownSpeed || 0);
        data.network.push({ time, value: networkValue });
      }
    });
    console.log("data", data);
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

      // 检查指标是否真的有数据（区分"真实数据为0"和"没有数据"）
      const hasRealData = values.some(v => v > 0) || 
                        (key === 'cpu' && values.some(v => v >= 0)) ||
                        (key === 'memory' && values.some(v => v >= 0)) ||
                        (key === 'power' && values.some(v => v >= 0)) ||
                        (key === 'temperature' && values.some(v => v > 0)) ||
                        (key === 'fps' && values.some(v => v > 0)) ||
                        (key === 'gpu' && values.some(v => v > 0));

      // 对于网络流量，需要检查是否有真实的非零数据点
      if (!hasRealData) return;

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
    if (selectedTaskIds.length < 2) {
      return;
    }

    setLoading(true);
    try {
      // 加载所有选中任务的监控数据
      const loadPromises = selectedTaskIds.map(async (taskId) => {
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
          .filter((item) => {
            // 对于某些指标，0值是有意义的，需要保留
            // 只过滤掉完全为null、undefined或NaN的情况
            return item.value !== null && 
                   item.value !== undefined && 
                   !isNaN(item.value) && 
                   item.value >= 0;
          })
          .filter((item) => {
            // 进一步检查指标是否真的有数据
            // 网络流量需要有真正的非零数据点
            if (metricKey === 'network') {
              return item.value > 0;
            }
            // 其他指标允许0值，但需要至少有一个任务有大于0的数据
            return true;
          });

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

  // 生成 HTML 格式报告
  const generateHTMLReport = () => {
    if (!comparisonResult) return;

    const metricLabels: Record<string, string> = {
      cpu: "CPU 使用率",
      memory: "内存占用",
      gpu: "GPU 负载",
      fps: "FPS 帧率",
      temperature: "温度",
      power: "功耗",
      network: "网络流量",
    };

    const metricUnits: Record<string, string> = {
      cpu: "%",
      memory: "MB",
      gpu: "%",
      fps: "fps",
      temperature: "°C",
      power: "W",
      network: "MB/s",
    };

    const metricColors: Record<string, string> = {
      cpu: "#3b82f6",
      memory: "#10b981",
      gpu: "#6366f1",
      fps: "#22c55e",
      temperature: "#f59e0b",
      power: "#8b5cf6",
      network: "#ec4899",
    };

    // 准备图表数据
    const prepareChartData = (metricKey: string) => {
      const taskDataMap: Record<
        string,
        { avg: number; max: number; min: number }
      > = {};

      comparisonResult.tasks.forEach((task) => {
        const stat = task.metrics[metricKey];
        if (stat) {
          taskDataMap[task.taskName] = {
            avg: stat.avg,
            max: stat.max,
            min: stat.min,
          };
        }
      });

      return {
        labels: ["平均值", "最大值", "最小值"],
        datasets: Object.entries(taskDataMap).map(([taskName, data], index) => {
          const hex = metricColors[metricKey] || "#3b82f6";
          const hexClean = hex.replace("#", "");
          const r = parseInt(hexClean.substr(0, 2), 16);
          const g = parseInt(hexClean.substr(2, 2), 16);
          const b = parseInt(hexClean.substr(4, 2), 16);
          const lightnessFactor = 1 - index * 0.2;
          const adjustedR = Math.round(r * lightnessFactor);
          const adjustedG = Math.round(g * lightnessFactor);
          const adjustedB = Math.round(b * lightnessFactor);
          const color = `rgba(${adjustedR}, ${adjustedG}, ${adjustedB}, 0.8)`;

          return {
            label: taskName,
            data: [data.avg, data.max, data.min],
            backgroundColor: color,
            borderColor: color.replace("0.8", "1"),
            borderWidth: 1,
          };
        }),
      };
    };

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>监控数据对比分析报告</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .meta {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    h2 {
      color: #1a1a1a;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 20px;
      border-bottom: 2px solid #e5e5e5;
      padding-bottom: 8px;
    }
    .task-list {
      list-style: none;
      padding-left: 0;
    }
    .task-list li {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .task-list li:last-child {
      border-bottom: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #e5e5e5;
    }
    td {
      padding: 12px;
      border: 1px solid #e5e5e5;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    .metric-section {
      margin: 25px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .metric-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #1a1a1a;
    }
    .metric-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .stat-item {
      background: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #e5e5e5;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .best {
      color: #10b981;
    }
    .worst {
      color: #ef4444;
    }
    .summary-table {
      margin-top: 20px;
    }
    .chart-container {
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e5e5;
    }
    .chart-wrapper {
      position: relative;
      height: 300px;
      margin-top: 15px;
    }
    .summary-section {
      margin: 30px 0;
      padding: 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }
    .summary-section h2 {
      color: white;
      border-bottom: 2px solid rgba(255,255,255,0.3);
      margin-bottom: 20px;
      padding-bottom: 10px;
    }
    .summary-content {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 6px;
      margin-top: 15px;
    }
    .summary-item {
      margin: 12px 0;
      padding-left: 20px;
      position: relative;
    }
    .summary-item::before {
      content: "•";
      position: absolute;
      left: 0;
      font-size: 20px;
      line-height: 1;
    }
    .key-findings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .finding-card {
      background: rgba(255,255,255,0.15);
      padding: 15px;
      border-radius: 6px;
      backdrop-filter: blur(10px);
    }
    .finding-title {
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .finding-content {
      font-size: 13px;
      opacity: 0.95;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>监控数据对比分析报告</h1>
    <div class="meta">生成时间: ${new Date().toLocaleString("zh-CN")}</div>

    <h2>参与对比的任务</h2>
    <ul class="task-list">
      ${comparisonResult.tasks.map((task) => `<li>${task.taskName}</li>`).join("")}
    </ul>

    <h2>任务统计数据</h2>
    <table>
      <thead>
        <tr>
          <th>任务</th>
          ${Object.keys(comparisonResult.comparison)
            .map(
              (metricKey) =>
                `<th>${metricLabels[metricKey] || metricKey.toUpperCase()}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${comparisonResult.tasks
          .map(
            (task) => `
          <tr>
            <td><strong>${task.taskName}</strong></td>
            ${Object.keys(comparisonResult.comparison)
              .map((metricKey) => {
                const stat = task.metrics[metricKey];
                if (!stat) return "<td>-</td>";
                const unit = metricUnits[metricKey] || "";
                return `
                <td>
                  平均: ${stat.avg}${unit}<br>
                  <small style="color: #666;">${stat.min}${unit} ~ ${stat.max}${unit}</small>
                </td>
              `;
              })
              .join("")}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <h2>对比分析</h2>
    ${Object.keys(comparisonResult.comparison)
      .map((metricKey, metricIndex) => {
        const comp = comparisonResult.comparison[metricKey];
        const metricLabel = metricLabels[metricKey] || metricKey.toUpperCase();
        const unit = metricUnits[metricKey] || "";

        return `
        <div class="metric-section">
          <div class="metric-title">${metricLabel}</div>
          <div class="metric-stats">
            <div class="stat-item">
              <div class="stat-label">最佳任务</div>
              <div class="stat-value best">${comp.best.taskName}</div>
              <div class="stat-value best">${comp.best.value}${unit}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最差任务</div>
              <div class="stat-value worst">${comp.worst.taskName}</div>
              <div class="stat-value worst">${comp.worst.value}${unit}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">平均值</div>
              <div class="stat-value">${comp.avg}${unit}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">方差</div>
              <div class="stat-value">${comp.variance}</div>
              <small style="color: #666;">(数值越小表示性能越稳定)</small>
            </div>
          </div>
          <div class="chart-container">
            <h3 style="font-size: 16px; margin-bottom: 10px; color: #1a1a1a;">统计对比图表</h3>
            <div class="chart-wrapper">
              <canvas id="chart-${metricIndex}"></canvas>
            </div>
          </div>
        </div>
      `;
      })
      .join("")}

    <div class="summary-section">
      <h2>报告总结</h2>
      <div class="summary-content">
        <h3 style="font-size: 16px; margin-bottom: 15px; font-weight: 600;">概述</h3>
        <p style="margin-bottom: 15px; line-height: 1.8;">
          本报告对 <strong>${comparisonResult.tasks.length}</strong> 个任务的监控数据进行了全面对比分析，
          涵盖了 ${Object.keys(comparisonResult.comparison).length} 个关键性能指标。
          通过对比平均值、最大值、最小值等统计数据，识别出各任务在不同指标上的表现差异。
        </p>

        <h3 style="font-size: 16px; margin-bottom: 15px; font-weight: 600; margin-top: 25px;">关键发现</h3>
        <div class="key-findings">
          ${Object.keys(comparisonResult.comparison)
            .map((metricKey) => {
              const comp = comparisonResult.comparison[metricKey];
              const metricLabel =
                metricLabels[metricKey] || metricKey.toUpperCase();
              const unit = metricUnits[metricKey] || "";
              const varianceRatio =
                comp.avg > 0
                  ? ((comp.variance / comp.avg) * 100).toFixed(1)
                  : "0";
              const isStable = parseFloat(varianceRatio) < 10;

              return `
              <div class="finding-card">
                <div class="finding-title">${metricLabel}</div>
                <div class="finding-content">
                  <div style="margin-bottom: 5px;">最佳: <strong>${comp.best.taskName}</strong> (${comp.best.value}${unit})</div>
                  <div style="margin-bottom: 5px;">最差: <strong>${comp.worst.taskName}</strong> (${comp.worst.value}${unit})</div>
                  <div style="margin-bottom: 5px;">平均: ${comp.avg}${unit}</div>
                  <div style="font-size: 12px; opacity: 0.9; margin-top: 8px;">
                    ${isStable ? "✓ 性能表现稳定" : "⚠ 性能波动较大"}
                  </div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <h3 style="font-size: 16px; margin-bottom: 15px; font-weight: 600; margin-top: 25px;">任务表现分析</h3>
        <div style="margin-top: 15px;">
          ${comparisonResult.tasks
            .map((task) => {
              const bestCount = Object.keys(comparisonResult.comparison).filter(
                (metricKey) => {
                  const comp = comparisonResult.comparison[metricKey];
                  return comp.best.taskName === task.taskName;
                },
              ).length;
              const worstCount = Object.keys(
                comparisonResult.comparison,
              ).filter((metricKey) => {
                const comp = comparisonResult.comparison[metricKey];
                return comp.worst.taskName === task.taskName;
              }).length;

              return `
              <div class="summary-item" style="margin-bottom: 10px;">
                <strong>${task.taskName}</strong>：
                在 ${bestCount} 个指标上表现最佳，
                ${worstCount > 0 ? `在 ${worstCount} 个指标上表现最差` : "无表现最差的指标"}。
                ${bestCount > worstCount ? "整体表现优秀。" : bestCount < worstCount ? "需要关注性能优化。" : "表现中等。"}
              </div>
            `;
            })
            .join("")}
        </div>

        <h3 style="font-size: 16px; margin-bottom: 15px; font-weight: 600; margin-top: 25px;">建议</h3>
        <div style="margin-top: 15px;">
          <div class="summary-item">
            对于表现最佳的任务，建议分析其配置和运行环境，作为其他任务的优化参考。
          </div>
          <div class="summary-item">
            对于表现较差的任务，建议重点关注资源使用情况，考虑优化算法或调整资源配置。
          </div>
          <div class="summary-item">
            方差较大的指标表示性能波动较大，建议进一步分析时间序列数据，找出性能瓶颈。
          </div>
          <div class="summary-item">
            建议定期进行对比分析，跟踪性能改进效果，建立性能基线。
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    const chartConfigs = ${JSON.stringify(
      Object.keys(comparisonResult.comparison).map((metricKey) => {
        const chartData = prepareChartData(metricKey);
        return {
          labels: chartData.labels,
          datasets: chartData.datasets,
        };
      }),
    )};
    
    const metricUnits = ${JSON.stringify(metricUnits)};
    const metricKeys = ${JSON.stringify(Object.keys(comparisonResult.comparison))};
    
    chartConfigs.forEach((config, index) => {
      const ctx = document.getElementById('chart-' + index);
      if (!ctx) return;
      
      new Chart(ctx, {
        type: 'bar',
        data: config,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const unit = metricUnits[metricKeys[index]] || '';
                  return context.dataset.label + ': ' + context.parsed.y + unit;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  const unit = metricUnits[metricKeys[index]] || '';
                  return value + unit;
                }
              }
            }
          }
        }
      });
    });
  </script>
</body>
</html>
    `.trim();

    // 创建 Blob 并下载
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `监控数据对比分析报告_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectedChange = (selected: string[]) => {
    setSelectedTaskIds(selected);
  };

  // 准备柱状图数据（按统计类型分组：平均值、最大值、最小值）
  const prepareBarChartData = (metricKey: string) => {
    if (!comparisonResult) return [];

    // 构建数据对象，每个任务作为属性
    const taskDataMap: Record<
      string,
      { avg: number; max: number; min: number }
    > = {};

    comparisonResult.tasks.forEach((task) => {
      const stat = task.metrics[metricKey];
      if (stat) {
        taskDataMap[task.taskName] = {
          avg: stat.avg,
          max: stat.max,
          min: stat.min,
        };
      }
    });

    // 按统计类型分组：平均值一组，最大值一组，最小值一组
    return [
      {
        name: "平均值",
        ...Object.fromEntries(
          Object.entries(taskDataMap).map(([taskName, data]) => [
            taskName,
            data.avg,
          ]),
        ),
      },
      {
        name: "最大值",
        ...Object.fromEntries(
          Object.entries(taskDataMap).map(([taskName, data]) => [
            taskName,
            data.max,
          ]),
        ),
      },
      {
        name: "最小值",
        ...Object.fromEntries(
          Object.entries(taskDataMap).map(([taskName, data]) => [
            taskName,
            data.min,
          ]),
        ),
      },
    ];
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
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 pr-3">
          {/* 任务选择 */}
          <div>
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">
                至少选择 2 个已完成的任务，当前已选择{" "}
                <span className="text-primary font-medium">
                  {selectedTaskIds.length}
                </span>{" "}
                个
              </p>
            </div>

            {/* 多选择框和按钮一行显示 */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground font-medium">
                      暂无已完成的任务
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      请先完成一些监控任务后再进行对比分析
                    </p>
                  </div>
                ) : (
                  <MultiSelectCombobox
                    items={taskItems}
                    selected={selectedTaskIds}
                    onSelectedChange={handleSelectedChange}
                    placeholder="选择要对比的任务..."
                    emptyMessage="未找到匹配的任务"
                    maxDisplayItems={3}
                    customActions={[
                      {
                        label:
                          selectedTaskIds.length === completedTasks.length
                            ? "取消全选"
                            : `全选 (${completedTasks.length})`,
                        onSelect: toggleSelectAll,
                      },
                    ]}
                  />
                )}
              </div>

              {/* 操作按钮 - 常驻显示在右侧 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  onClick={performComparison}
                  disabled={selectedTaskIds.length < 2 || loading}
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  {loading ? "分析中..." : "对比分析"}
                </Button>
                <Button
                  variant="outline"
                  onClick={generateReport}
                  size="sm"
                  disabled={!comparisonResult}
                >
                  <FileText className="h-4 w-4" />
                  查看报告
                </Button>
              </div>
            </div>
          </div>

          {/* 对比结果 */}
          {comparisonResult && (
            <div className="space-y-4">
              {/* 视图切换 */}
              <div className="px-1">
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
                  <div className="space-y-4">
                    {Object.keys(comparisonResult.comparison).map(
                      (metricKey) => {
                        const metric = monitorMetrics.find(
                          (m) => m.key === metricKey,
                        );
                        const barData = prepareBarChartData(metricKey);
                        const lineData = prepareLineChartData(metricKey);
                        const comp = comparisonResult.comparison[metricKey];

                        if (!metric || barData.length === 0) return null;

                        return (
                          <div key={metricKey} className="px-3">
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
                                  最差: {comp.worst.taskName} (
                                  {comp.worst.value} {metric.unit})
                                </div>
                              </div>
                            </div>

                            <Tabs defaultValue="bar" className="w-full">
                              <TabsList className="mb-4">
                                <TabsTrigger value="bar">统计对比</TabsTrigger>
                                {lineData.length > 0 && (
                                  <TabsTrigger value="line">
                                    时间序列对比
                                  </TabsTrigger>
                                )}
                              </TabsList>

                              <TabsContent value="bar" className="mt-0">
                                <div className="h-[300px]">
                                  <ChartContainer
                                    config={comparisonResult.tasks.reduce(
                                      (acc, task, index) => {
                                        // 使用任务名作为 key，这样 ChartTooltip 和 ChartLegend 能正确显示标签
                                        // 基于指标颜色主题，为每个任务生成不同深浅的颜色
                                        const hex = metric.color.replace(
                                          "#",
                                          "",
                                        );
                                        const r = parseInt(
                                          hex.substr(0, 2),
                                          16,
                                        );
                                        const g = parseInt(
                                          hex.substr(2, 2),
                                          16,
                                        );
                                        const b = parseInt(
                                          hex.substr(4, 2),
                                          16,
                                        );

                                        // 为每个任务调整亮度（第一个任务最亮，后续逐渐变暗）
                                        // 通过混合白色或黑色来调整亮度
                                        const lightnessFactor = 1 - index * 0.2; // 0.8, 0.6, 0.4...
                                        const adjustedR = Math.round(
                                          r * lightnessFactor,
                                        );
                                        const adjustedG = Math.round(
                                          g * lightnessFactor,
                                        );
                                        const adjustedB = Math.round(
                                          b * lightnessFactor,
                                        );

                                        const color = `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;

                                        acc[task.taskName] = {
                                          label: task.taskName,
                                          color: color,
                                        };
                                        return acc;
                                      },
                                      {} as ChartConfig,
                                    )}
                                    className="w-full h-full"
                                  >
                                    <BarChart
                                      accessibilityLayer
                                      data={barData}
                                      margin={{
                                        top: 10,
                                        right: 10,
                                        left: 0,
                                        bottom: 80,
                                      }}
                                    >
                                      <CartesianGrid vertical={false} />
                                      <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tick={{ fontSize: 10 }}
                                      />
                                      <YAxis
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        label={{
                                          value: metric.unit,
                                          angle: -90,
                                          position: "insideLeft",
                                        }}
                                      />
                                      <ChartTooltip
                                        cursor={false}
                                        content={
                                          <ChartTooltipContent indicator="dashed" />
                                        }
                                      />
                                      <ChartLegend
                                        content={<ChartLegendContent />}
                                      />
                                      {comparisonResult.tasks.map((task) => {
                                        // 使用 CSS 变量引用 ChartContainer 配置的颜色
                                        return (
                                          <Bar
                                            key={task.taskId}
                                            dataKey={task.taskName}
                                            fill={`var(--color-${task.taskName})`}
                                            radius={4}
                                          />
                                        );
                                      })}
                                    </BarChart>
                                  </ChartContainer>
                                </div>
                              </TabsContent>

                              {lineData.length > 0 && (
                                <TabsContent value="line" className="mt-0">
                                  <div className="h-[300px]">
                                    <ChartContainer
                                      config={comparisonResult.tasks.reduce(
                                        (acc, task, index) => {
                                          // 基于指标颜色主题，为每个任务生成不同深浅的颜色
                                          const hex = metric.color.replace(
                                            "#",
                                            "",
                                          );
                                          const r = parseInt(
                                            hex.substr(0, 2),
                                            16,
                                          );
                                          const g = parseInt(
                                            hex.substr(2, 2),
                                            16,
                                          );
                                          const b = parseInt(
                                            hex.substr(4, 2),
                                            16,
                                          );

                                          // 为每个任务调整亮度（第一个任务最亮，后续逐渐变暗）
                                          const lightnessFactor =
                                            1 - index * 0.2;
                                          const adjustedR = Math.round(
                                            r * lightnessFactor,
                                          );
                                          const adjustedG = Math.round(
                                            g * lightnessFactor,
                                          );
                                          const adjustedB = Math.round(
                                            b * lightnessFactor,
                                          );

                                          const color = `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;

                                          acc[task.taskName] = {
                                            label: task.taskName,
                                            color: color,
                                          };
                                          return acc;
                                        },
                                        {} as ChartConfig,
                                      )}
                                      className="w-full h-full"
                                    >
                                      <LineChart
                                        accessibilityLayer
                                        data={lineData}
                                        margin={{
                                          left: 12,
                                          right: 12,
                                          top: 10,
                                          bottom: 80,
                                        }}
                                      >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                          dataKey="time"
                                          tickLine={false}
                                          axisLine={false}
                                          tickMargin={8}
                                          tick={{ fontSize: 10 }}
                                          angle={-45}
                                          textAnchor="end"
                                        />
                                        <YAxis
                                          tick={{ fontSize: 10 }}
                                          tickLine={false}
                                          axisLine={false}
                                          label={{
                                            value: metric.unit,
                                            angle: -90,
                                            position: "insideLeft",
                                          }}
                                        />
                                        <ChartTooltip
                                          cursor={false}
                                          content={
                                            <ChartTooltipContent hideLabel />
                                          }
                                        />
                                        <ChartLegend
                                          content={<ChartLegendContent />}
                                        />
                                        {comparisonResult.tasks.map((task) => {
                                          return (
                                            <Line
                                              key={task.taskId}
                                              dataKey={task.taskName}
                                              type="natural"
                                              stroke={`var(--color-${task.taskName})`}
                                              strokeWidth={2}
                                              dot={false}
                                              connectNulls
                                            />
                                          );
                                        })}
                                      </LineChart>
                                    </ChartContainer>
                                  </div>
                                </TabsContent>
                              )}
                            </Tabs>
                          </div>
                        );
                      },
                    )}
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
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 报告对话框 */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="min-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>对比分析报告</DialogTitle>
            <DialogDescription>
              生成时间: {new Date().toLocaleString("zh-CN")}
            </DialogDescription>
          </DialogHeader>
          <div>
            {comparisonResult && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">参与对比的任务</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {comparisonResult.tasks.map((task) => (
                      <li key={task.taskId}>{task.taskName}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">对比结果摘要</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {Object.keys(comparisonResult.comparison).map(
                      (metricKey) => {
                        const comp = comparisonResult.comparison[metricKey];
                        const metric = monitorMetrics.find(
                          (m) => m.key === metricKey,
                        );
                        return (
                          <div key={metricKey} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                              {metric && (
                                <metric.icon
                                  className="h-4 w-4"
                                  style={{ color: metric.color }}
                                />
                              )}
                              <span className="text-sm">{metric?.label || metricKey.toUpperCase()}</span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">最佳:</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-green-600">
                                    {comp.best.taskName}
                                  </span>
                                  <span className="text-green-600">
                                    ({comp.best.value})
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">最差:</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-red-600">
                                    {comp.worst.taskName}
                                  </span>
                                  <span className="text-red-600">
                                    ({comp.worst.value})
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">平均:</span>
                                <span className="font-medium">
                                  {comp.avg}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">方差:</span>
                                <span className="text-muted-foreground">
                                  {comp.variance}
                                  <span className="ml-1 text-[10px]">
                                    (越小越稳定)
                                  </span>
                                </span>
                              </div>
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
              size="sm"
              onClick={generateHTMLReport}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              导出 HTML 报告
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportDialog(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
