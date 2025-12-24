import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  BarChart3,
  ListTodo,
  Settings,
  Package,
  GitCompare,
} from "lucide-react";

// 子组件
import { MonitoringDashboard } from "./monitoring/monitoring-dashboard";
import { TaskManagement } from "./monitoring/task-management";
import { ScriptMarket } from "./monitoring/script-editor";
import { MonitoringConfigPanel } from "./monitoring/monitoring-config";
import { TaskDetailSheet } from "./monitoring/task-detail-sheet";
import { CreateTaskDialog } from "./monitoring/create-task-dialog";
import { ComparisonAnalysis } from "@/components/monitoring/comparison-analysis";

function statusMap(status: SceneTaskStatus): MonitorTaskStatus {
  switch (status) {
    case "running":
      return "running";
    case "finished":
      return "completed";
    case "error":
      return "error";
    case "idle":
    default:
      return "pending";
  }
}

function buildTaskDataFromSamples(
  samples: MonitorSample[] | undefined,
  metrics?: MonitoringMetric[],
): MonitoringTask["data"] | undefined {
  if (!samples || samples.length === 0) return undefined;

  const toTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return String(ts);
    }
  };

  // 根据任务配置的监控指标来决定生成哪些数据
  const result: MonitoringTask["data"] = {
    cpu: [],
    memory: [],
    gpu: [],
    fps: [],
    temperature: [],
    power: [],
    network: [],
  };

  console.log("metrics", metrics);
  if (!metrics || metrics.includes("cpu")) {
    result.cpu = samples.map((s) => ({
      time: toTime(s.timestamp),
      value: s.appCpuUsage ?? s.cpu ?? 0,
    }));
  }

  if (!metrics || metrics.includes("memory")) {
    result.memory = samples.map((s) => ({
      time: toTime(s.timestamp),
      value: s.appMemoryUsage ?? s.memory ?? 0,
    }));
  }

  if (!metrics || metrics.includes("gpu")) {
    result.gpu = samples.map((s) => ({
      time: toTime(s.timestamp),
      value: s.gpuLoad ?? 0,
    }));
  }

  if (!metrics || metrics.includes("fps")) {
    result.fps = samples.map((s) => ({
      time: toTime(s.timestamp),
      value: s.fps ?? 0,
    }));
  }

  if (!metrics || metrics.includes("temperature")) {
    result.temperature = samples.map((s) => ({
      time: toTime(s.timestamp),
      value: s.deviceTemperature ?? 0,
    }));
  }

  if (!metrics || metrics.includes("power")) {
    result.power = samples.map((s) => ({
      time: toTime(s.timestamp),
      value: s.powerConsumption ?? 0,
    }));
  }

  if (!metrics || metrics.includes("network")) {
    result.network = samples.map((s) => {
      const up = s.networkUpSpeed ?? 0;
      const down = s.networkDownSpeed ?? 0;
      // KB/s -> MB/s
      const mbps = (up + down) / 1024;
      return {
        time: toTime(s.timestamp),
        value: mbps,
      };
    });
  }
  console.log("result", result);
  return result;
}

export function Monitoring({ selectedDevice }: { selectedDevice: string }) {
  const [backendTasks, setBackendTasks] = useState<SceneTask[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, MonitorSample[]>>(
    {},
  );

  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MonitoringTask | null>(null);

  const [alertThresholds, setAlertThresholds] = useState<AlertThresholdsConfig>(
    {
      fpsWarning: 30,
      fpsCritical: 15,
      cpuWarning: 80,
      cpuCritical: 95,
      memoryWarning: 80,
      memoryCritical: 95,
      temperatureWarning: 45,
      temperatureCritical: 55,
    },
  );

  const [enableAlerts, setEnableAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const loadTasks = async () => {
    const data = await window.api.listTasks();
    setBackendTasks(data);
  };

  const tasks: MonitoringTask[] = useMemo(() => {
    return backendTasks.map((t, index) => {
      const samples = metricsMap[t.id] ?? [];
      const data = buildTaskDataFromSamples(samples, t.metrics);
      return {
        id: index + 1,
        name: t.name,
        script: t.scriptTemplateId,
        app: t.packageName,
        status: statusMap(t.status),
        createdAt: new Date(t.createdAt).toISOString().split("T")[0],
        deprecated: false,
        reportData: true,
        startTime: samples[0]
          ? new Date(samples[0].timestamp).toLocaleString()
          : undefined,
        endTime: undefined,
        backendId: t.id,
        errorMessage: t.errorMessage,
        archived: t.archived,
        data,
      };
    });
  }, [backendTasks, metricsMap]);

  useEffect(() => {
    loadTasks();

    // 监控数据
    const unsubscribeMonitorData = window.api.onMonitorData((sample) => {
      setMetricsMap((prev) => {
        const list = prev[sample.taskId] ?? [];
        return {
          ...prev,
          [sample.taskId]: [...list, sample],
        };
      });
    });

    // 告警与错误
    const unsubscribeAlert = window.api.onMonitorAlert((alert) => {
      console.info("unsubscribeAlert:", alert);
    });
    const unsubscribeError = window.api.onMonitorError((evt) => {
      console.info("unsubscribeError:", evt);
    });

    return () => {
      unsubscribeMonitorData();
      unsubscribeAlert();
      unsubscribeError();
    };
  }, []);

  useEffect(() => {
    const hasRunning = backendTasks.some((t) => t.status === "running");
    if (!hasRunning) return;

    const timer = setInterval(() => {
      void loadTasks();
    }, 1000);

    return () => clearInterval(timer);
  }, [backendTasks]);

  const handleOpenTaskDialog = () => {
    setOpenTaskDialog(true);
  };

  const handleCreateTask = async (taskData: {
    name: string;
    script: string;
    app: string;
    metrics: Omit<MonitorConfig, "interval">;
  }) => {
    if (!taskData.metrics || typeof taskData.metrics !== "object") {
      console.error("Invalid metrics data:", taskData.metrics);
      return;
    }

    const metricKeys: MonitoringMetric[] = (
      Object.keys(taskData.metrics) as MonitoringMetric[]
    ).filter(
      (k) => taskData.metrics[k as keyof Omit<MonitorConfig, "interval">],
    );

    if (metricKeys.length === 0) return;

    const id = `${Date.now()}`;
    try {
      const task = await window.api.createTask({
        id,
        name: taskData.name,
        packageName: taskData.app,
        metrics: metricKeys,
        scriptTemplateId: taskData.script,
        monitorConfig: enableAlerts
          ? {
            enableAlerts: true,
            thresholds: alertThresholds,
          }
          : undefined,
      });
      setOpenTaskDialog(false);

      // ✅ 关键改动：初始化新任务的空数据数组，防止图表无法展示
      setMetricsMap((prev) => ({
        ...prev,
        [id]: [],
      }));

      console.log("任务已创建:", task);

      // 新建任务后主动启动执行
      await window.api.startTask(id);

      await loadTasks();
      setActiveTab("dashboard");
    } catch (error) {
      console.error("创建任务失败:", error);
    }
  };

  const handleViewTask = async (task: MonitoringTask) => {
    setSelectedTask(task);
    setShowDetailSheet(true);

    // 加载任务的监控数据（如果还没有加载或需要刷新）
    if (task.backendId) {
      try {
        const history = await window.api.getTaskMetrics(task.backendId);
        setMetricsMap((prev) => ({
          ...prev,
          [task.backendId!]: history,
        }));
      } catch (error) {
        console.error("Failed to load task metrics", error);
      }
    }
  };

  // 当 metricsMap 或 selectedTask 变化时，更新 selectedTask 的数据
  useEffect(() => {
    if (selectedTask && selectedTask.backendId) {
      const backendTask = backendTasks.find(
        (t) => t.id === selectedTask.backendId,
      );
      const samples = metricsMap[selectedTask.backendId] ?? [];
      const data = buildTaskDataFromSamples(samples, backendTask?.metrics);

      // 只有当数据真正变化时才更新
      const currentDataStr = JSON.stringify(selectedTask.data);
      const newDataStr = JSON.stringify(data);
      if (currentDataStr !== newDataStr) {
        setSelectedTask((prev) => {
          if (!prev || prev.backendId !== selectedTask.backendId) return prev;
          return {
            ...prev,
            data,
          };
        });
      }
    }
  }, [metricsMap, backendTasks, selectedTask?.backendId, selectedTask]);

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col h-full"
      >
        {/* 顶部导航 */}
        <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="px-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TabsList>
                  <TabsTrigger
                    value="dashboard"
                    className="text-xs px-3 gap-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    监控面板
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs px-3  gap-1.5">
                    <ListTodo className="h-3.5 w-3.5" />
                    任务管理
                  </TabsTrigger>
                  <TabsTrigger
                    value="scripts"
                    className="text-xs px-3  gap-1.5"
                  >
                    <Package className="h-3.5 w-3.5" />
                    脚本市场
                  </TabsTrigger>
                  <TabsTrigger
                    value="comparison"
                    className="text-xs px-3 h-7 gap-1.5"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    对比分析
                  </TabsTrigger>
                  <TabsTrigger value="config" className="text-xs px-3  gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    监控配置
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button
                onClick={handleOpenTaskDialog}
                className="h-7.5 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                新建任务
              </Button>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-hidden p-1 mt-1">
          <TabsContent
            value="dashboard"
            className="mt-0 h-full overflow-hidden"
          >
            <MonitoringDashboard
              tasks={tasks}
              onCreateTask={handleOpenTaskDialog}
              onToggleTaskStatus={(id: number) => {
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
              }}
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0 h-full flex flex-col">
            <TaskManagement onViewTask={handleViewTask} />
          </TabsContent>

          <TabsContent value="scripts" className="mt-0 h-full">
            <ScriptMarket />
          </TabsContent>

          <TabsContent value="comparison" className="mt-0 h-full">
            <ComparisonAnalysis />
          </TabsContent>

          <TabsContent value="config" className="mt-0 h-full">
            <MonitoringConfigPanel
              config={{
                enableAlerts,
                thresholds: alertThresholds,
              }}
              onConfigChange={(cfg) => {
                setAlertThresholds(cfg.thresholds);
                setEnableAlerts(cfg.enableAlerts);
              }}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* 任务详情抽屉 */}
      <TaskDetailSheet
        open={showDetailSheet}
        onOpenChange={(open) => {
          setShowDetailSheet(open);
          if (!open) {
            setSelectedTask(null);
          }
        }}
        task={selectedTask}
      />
      {/* 新建任务对话框 */}
      <CreateTaskDialog
        selectedDevice={selectedDevice}
        open={openTaskDialog}
        onOpenChange={setOpenTaskDialog}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
