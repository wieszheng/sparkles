import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, BarChart3, ListTodo, Settings, Package } from "lucide-react";

// 子组件
import { MonitoringDashboard } from "./monitoring/monitoring-dashboard";
import { TaskManagement } from "./monitoring/task-management";
import { ScriptMarket } from "./monitoring/script-editor";
import { MonitoringConfigPanel } from "./monitoring/monitoring-config";
import { TaskDetailSheet } from "./monitoring/task-detail-sheet";
import { CreateTaskDialog } from "./monitoring/create-task-dialog";

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
  const [formData, setFormData] = useState({
    name: "",
    script: "",
    app: "",
    metrics: {
      cpu: true,
      memory: true,
      gpu: false,
      fps: false,
      temperature: false,
      power: false,
      network: false,
    } as Omit<MonitorConfig, "interval">,
  });

  const [monitorConfig, setMonitorConfig] = useState<{ interval?: string }>({
    interval: "1",
  });
  const [backendTasks, setBackendTasks] = useState<SceneTask[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, MonitorSample[]>>(
    {},
  );

  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MonitoringTask | null>(null);
  // const [, setScriptTemplates] = useState<ScriptTemplateSummary[]>([])
  const [apps, setApps] = useState<Application[]>([]);
  const [scripts, setScripts] = useState<ScriptFile[]>([]);

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
        data,
      };
    });
  }, [backendTasks, metricsMap]);

  useEffect(() => {
    const hasRunning = backendTasks.some((t) => t.status === "running");
    if (!hasRunning) return;

    const timer = setInterval(() => {
      void loadTasks();
    }, 1000);

    return () => clearInterval(timer);
  }, [backendTasks]);

  const loadApps = async () => {
    try {
      const bundleNames = await window.api.getBundles(selectedDevice, false);

      if (bundleNames.length > 0) {
        // 获取应用详细信息
        const bundleInfos = await window.api.getBundleInfos(
          selectedDevice,
          bundleNames,
        );
        setApps(bundleInfos);
      } else {
        setApps([]);
      }
    } catch (error) {
      console.error("加载应用列表失败:", error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadApps();
    // 脚本模板
    window.api
      .listScriptTemplates()
      .then((templates) => {
        const mappedScripts: ScriptFile[] = templates.map((t, idx) => ({
          id: idx + 1,
          name: t.id, // 这里存放真实的 scriptTemplateId，创建任务时直接使用
          label: t.name,
          description: t.description ?? "",
          content: "// 脚本模板在主进程中以函数形式定义，此处仅展示元信息",
          lastModified: "",
          category: "other",
          difficulty: "beginner",
          downloads: 0,
          rating: 5,
          author: "内置模板",
          tags: [],
        }));

        setScripts(mappedScripts);
      })
      .catch(console.error);

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
      // setAlerts((prev) => [alert, ...prev].slice(0, 100));

      console.log("alert", alert.type);
    });
    const unsubscribeError = window.api.onMonitorError((evt) => {
      // setErrors((prev) => [evt, ...prev].slice(0, 100));
      console.log("error", evt);
    });

    return () => {
      unsubscribeMonitorData();
      unsubscribeAlert();
      unsubscribeError();
    };
  }, []);

  const handleOpenTaskDialog = () => {
    setFormData({
      name: "",
      script: "",
      app: "",
      metrics: {
        cpu: true,
        memory: true,
        gpu: false,
        fps: false,
        temperature: false,
        power: false,
        network: false,
      } as Omit<MonitorConfig, "interval">,
    });
    setOpenTaskDialog(true);
  };
  const loadTasks = async () => {
    const data = await window.api.listTasks();
    setBackendTasks(data);
  };
  const handleCreateTask = () => {
    if (!formData.name || !formData.script || !formData.app) return;

    const metricKeys: MonitoringMetric[] = (
      Object.keys(formData.metrics) as MonitoringMetric[]
    ).filter(
      (k) => formData.metrics[k as keyof Omit<MonitorConfig, "interval">],
    );

    if (metricKeys.length === 0) return;

    const id = `${Date.now()}`;

    void window.api
      .createTask({
        id,
        name: formData.name,
        packageName: formData.app,
        connectKey: selectedDevice,
        metrics: metricKeys,
        scriptTemplateId: formData.script,
        monitorConfig: enableAlerts
          ? {
              enableAlerts: true,
              thresholds: alertThresholds,
            }
          : undefined,
      })
      .then(async () => {
        setOpenTaskDialog(false);
        setFormData({
          name: "",
          script: "",
          app: "",
          metrics: {
            cpu: true,
            memory: true,
            gpu: false,
            fps: false,
            temperature: false,
            power: false,
            network: false,
          } as Omit<MonitorConfig, "interval">,
        });
        await loadTasks();
        // 新建任务后主动启动执行
        await window.api.startTask(id);
        await loadTasks();
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

  const handleViewTask = (task: MonitoringTask) => {
    setSelectedTask(task);
    setShowDetailSheet(true);
  };

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

  const handleSaveScript = (id: number, content: string) => {
    setScripts(
      scripts.map((s) =>
        s.id === id
          ? {
              ...s,
              content,
              lastModified: new Date().toISOString().split("T")[0],
            }
          : s,
      ),
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col h-full">
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
                  <TabsTrigger value="config" className="text-xs px-3  gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    监控配置
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button
                onClick={handleOpenTaskDialog}
                size="sm"
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                新建任务
              </Button>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-hidden p-1 mt-1">
          <TabsContent value="dashboard" className="mt-0 h-full overflow-hidden">
            <MonitoringDashboard
              tasks={tasks}
              onCreateTask={handleOpenTaskDialog}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <TaskManagement
              tasks={tasks}
              onViewTask={handleViewTask}
              onToggleTaskStatus={handleToggleTaskStatus}
              onDeleteTask={handleDeleteTask}
            />
          </TabsContent>

          <TabsContent value="scripts" className="mt-0 h-full">
            <ScriptMarket scripts={scripts} onSaveScript={handleSaveScript} />
          </TabsContent>

          <TabsContent value="config" className="mt-0 flex-1 overflow-auto">
            <MonitoringConfigPanel
              config={{
                interval: monitorConfig.interval,
                enableAlerts,
                thresholds: alertThresholds,
              }}
              onConfigChange={(cfg) => {
                setMonitorConfig({ interval: cfg.interval });
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
        onOpenChange={setShowDetailSheet}
        task={selectedTask}
      />

      {/* 新建任务对话框 */}
      <CreateTaskDialog
        open={openTaskDialog}
        onOpenChange={setOpenTaskDialog}
        scripts={scripts}
        apps={apps}
        formData={formData}
        onFormDataChange={setFormData}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
