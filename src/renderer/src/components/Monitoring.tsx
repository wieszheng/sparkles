import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  BarChart3,
  ListTodo,
  Settings,
  Package,
  GitCompare,
  Zap,
  Square,
} from "lucide-react";

import { TaskManagement } from "./monitoring/task-management";
import { ScriptMarket } from "./monitoring/script-editor";
import { MonitoringConfigPanel } from "./monitoring/monitoring-config";
import { TaskDetailSheet } from "./monitoring/task-detail-sheet";
import { CreateTaskDialog } from "./monitoring/create-task-dialog";
import { ComparisonAnalysis } from "@/components/monitoring/comparison-analysis";
import { MonitoringChart } from "./monitoring/monitoring-chart";
import { TaskStatusBadge } from "./monitoring/task-status-badge";

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

  const [activeTab, setActiveTab] = useState("dashboard");

  const loadTasks = async () => {
    console.log("[Monitoring] loadTasks 开始");
    const data = await window.api.listTasks();
    console.log("[Monitoring] loadTasks 获取到任务:", data.length, "个");
    console.log("[Monitoring] 任务详情:", data.map(t => ({ id: t.id, name: t.name, status: t.status })));
    setBackendTasks(data);
  };

  const tasks: MonitoringTask[] = useMemo(() => {
    console.log("[Monitoring] useMemo tasks 重新计算, backendTasks:", backendTasks.length, "个");
    const result = backendTasks.map((t, index) => {
      const samples = metricsMap[t.id] ?? [];
      const data = buildTaskDataFromSamples(samples, t.metrics);

      console.log(`[Monitoring] 任务 ${t.name} (${t.id}): status=${t.status}, samples=${samples.length}, hasData=${!!data}`);

      return {
        id: index + 1,
        name: t.name,
        script: t.scriptTemplateId,
        app: t.packageName,
        status: t.status,
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

    const runningCount = result.filter(t => t.status === "running").length;
    console.log(`[Monitoring] useMemo 完成, 总任务: ${result.length}, 运行中: ${runningCount}`);

    return result;
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

    // 当发现有运行中的任务时，尝试拉取其历史监控数据（防止刷新页面后丢失数据）
    backendTasks.forEach(async (task) => {
      if (task.status === "running") {
        try {
          const history = await window.api.getTaskMetrics(task.id);
          if (history && history.length > 0) {
            setMetricsMap((prev) => {
              // 简单的合并策略：如果本地没有数据，直接使用历史数据
              // 如果本地有数据，合并并去重（根据 timestamp）
              const current = prev[task.id] ?? [];
              if (current.length === 0) {
                return { ...prev, [task.id]: history };
              }
              // 如果已经有数据，这里暂不合并，依赖实时推送即可
              // 或者可以做一个更复杂的合并...但在高频刷新下可能影响性能
              // 仅当本地数据远少于历史数据时补全？
              if (history.length > current.length + 5) {
                return { ...prev, [task.id]: history };
              }
              return prev;
            });
          }
        } catch (error) {
          console.error("Failed to fetch task metrics:", error);
        }
      }
    });

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

    const id = `${selectedDevice}-${Date.now()}`;
    try {
      console.log("[Monitoring] 开始创建任务:", { id, name: taskData.name });

      const task = await window.api.createTask({
        id,
        name: taskData.name,
        packageName: taskData.app,
        metrics: metricKeys,
        scriptTemplateId: taskData.script,
      });

      console.log("[Monitoring] 任务已创建:", task);

      // ✅ 初始化新任务的空数据数组，防止图表无法展示
      setMetricsMap((prev) => {
        console.log("[Monitoring] 初始化 metricsMap for task:", id);
        return {
          ...prev,
          [id]: [],
        };
      });

      setOpenTaskDialog(false);

      // 新建任务后主动启动执行
      console.log("[Monitoring] 启动任务:", id);
      await window.api.startTask(id);
      console.log("[Monitoring] 任务已启动:", id);

      // 重新加载任务列表以获取最新状态
      console.log("[Monitoring] 重新加载任务列表");
      await loadTasks();
      console.log("[Monitoring] 任务列表已加载，backendTasks count:", backendTasks.length);

      // 切换到仪表板查看新任务
      console.log("[Monitoring] 切换到仪表板");
      setActiveTab("dashboard");
    } catch (error) {
      console.error("[Monitoring] 创建任务失败:", error);
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

  // 监控 activeTab 变化
  // useEffect(() => {
  //   console.log("[Monitoring] activeTab 变化:", activeTab);
  // }, [activeTab]);

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
            {(() => {
              console.log("[Dashboard] 渲染仪表板, tasks:", tasks.length, "个");
              const runningTasks = tasks.filter((t) => t.status === "running");
              console.log("[Dashboard] 运行中的任务:", runningTasks.length, "个");
              console.log("[Dashboard] 运行中任务详情:", runningTasks.map(t => ({
                id: t.id,
                name: t.name,
                status: t.status,
                backendId: t.backendId,
                hasData: !!t.data,
                dataKeys: t.data ? Object.keys(t.data) : []
              })));

              if (runningTasks.length === 0) {
                console.log("[Dashboard] 没有运行中的任务，显示空状态");
                return (
                  <div className="rounded-md border border-dashed border-border/40 py-12 text-center">
                    <Zap className="h-12 w-12 opacity-50 mx-auto mb-3" />
                    <h3 className="text-sm font-medium mb-1">暂无运行中的任务</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      创建一个新任务开始监控
                    </p>
                    <Button
                      onClick={handleOpenTaskDialog}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      新建任务
                    </Button>
                  </div>
                );
              }

              console.log("[Dashboard] 渲染运行中任务的图表");
              return (
                <div className="flex flex-col h-full">
                  {/* 固定控制区 */}
                  <div className="flex-shrink-0 space-y-3 pb-3 border-b border-border/40">
                    {runningTasks.map((task) => (
                      <div key={task.id}>
                        <div className="flex items-center justify-between ml-1">
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
                              onClick={() => {
                                if (!task.backendId) return;
                                void window.api.stopTask(task.backendId)
                                  .then(() => void loadTasks())
                                  .catch(console.error);
                              }}
                              className="h-7 text-xs gap-1"
                            >
                              <Square className="h-3 w-3" />
                              停止
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 可滚动内容区 */}
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 mr-2">
                        {runningTasks.map((task) => (
                          <div key={task.id} className="space-y-4">
                            {task.data &&
                              Object.keys(task.data).length > 0 &&
                              Object.values(task.data).some(
                                (data) => data && Array.isArray(data) && data.length > 0,
                              ) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {Object.entries(task.data).map(([key, data]) => {
                                  if (!data || !Array.isArray(data) || data.length === 0)
                                    return null;
                                  return (
                                    <div
                                      key={`${task.id}-${key}`}
                                      className="rounded-md border border-border/30 bg-muted/20 p-3"
                                    >
                                      <MonitoringChart metricKey={key} data={data} />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-md border border-dashed border-border/40 py-12 text-center bg-muted/10">
                                <div className="flex flex-col items-center gap-2">
                                  <Zap className="h-12 w-12 opacity-50 mx-auto mb-2 animate-pulse" />
                                  <p className="text-sm font-medium text-muted-foreground">
                                    正在等待监控数据...
                                  </p>
                                  <p className="text-xs text-muted-foreground/70">
                                    监控数据将在任务开始后自动采集
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              );
            })()}
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
            <MonitoringConfigPanel />
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
