import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  Shuffle,
  Target,
  Focus,
  Plus,
  Trash2,
  Clock,
  MoreVertical,
  Smartphone,
  Monitor,
  Search,
  Filter,
  BarChart3,
  ScrollText,
  Rocket,
  LineChart,
  Square,
} from "lucide-react";
import { WukongConfigSheet } from "./config-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MonitoringChart } from "@/components/monitoring/monitoring-chart";

// 监控指标配置（与 monitoring-chart.tsx 中的定义保持一致）
const monitorMetricsConfig = [
  { key: "cpu", label: "CPU 使用率" },
  { key: "memory", label: "内存占用" },
  { key: "gpu", label: "GPU 负载" },
  { key: "fps", label: "FPS 帧率" },
  { key: "temperature", label: "温度" },
  { key: "power", label: "功耗" },
  { key: "network", label: "网络流量" },
];
import { toast } from "sonner";
// 类型定义已在全局声明，直接使用

const taskTypeIcons: Record<WukongTestType, typeof Shuffle> = {
  exec: Shuffle,
  special: Target,
  focus: Focus,
};

const statusLabels: Record<WukongTaskStatus, string> = {
  idle: "待执行",
  running: "执行中",
  finished: "已完成",
  error: "失败",
};

export function WukongTest({ selectedDevice }: { selectedDevice: string }) {
  const [tasks, setTasks] = useState<WukongTask[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskForChart, setSelectedTaskForChart] = useState<
    string | null
  >(null);
  const [taskOutputs, setTaskOutputs] = useState<Record<string, string>>({});
  const [taskMetrics, setTaskMetrics] = useState<
    Record<string, MonitorSample[]>
  >({});
  const outputScrollRef = useRef<HTMLDivElement>(null);

  // 加载任务列表
  const loadTasks = async () => {
    try {
      const backendTasks = await window.api.listWukongTasks();
      // 直接使用后端任务，无需转换
      setTasks(backendTasks);
    } catch (error) {
      console.error("加载任务列表失败:", error);
      toast.error("加载任务列表失败");
    }
  };

  // 加载任务列表
  useEffect(() => {
    loadTasks();
  }, []);

  // 监听任务输出和状态变化
  useEffect(() => {
    const handleOutput = (data: {
      taskId: string;
      output: string;
      type: "stdout" | "stderr";
      timestamp: number;
    }) => {
      if (!data || !data.taskId) {
        console.warn("[wukong] 收到无效的输出数据:", data);
        return;
      }

      setTaskOutputs((prev) => {
        const current = prev[data.taskId] || "";
        return {
          ...prev,
          [data.taskId]: current + data.output,
        };
      });
    };

    // 监听任务状态变化
    const handleStatusChange = (data: {
      taskId: string;
      status: "idle" | "running" | "finished" | "error";
      timestamp: number;
    }) => {
      if (!data || !data.taskId) {
        console.warn("[wukong] 收到无效的状态数据:", data);
        return;
      }

      // 状态变化时刷新任务列表
      loadTasks();
    };

    // 监听性能监控数据
    const handleMonitorData = (sample: MonitorSample) => {
      if (sample.taskId) {
        setTaskMetrics((prev) => {
          const current = prev[sample.taskId] || [];
          return {
            ...prev,
            [sample.taskId]: [...current, sample],
          };
        });
      }
    };

    const removeOutputListener =
      window.api.onWukongOutput?.(handleOutput) || (() => {});
    const removeStatusListener =
      window.api.onWukongStatus?.(handleStatusChange) || (() => {});
    const removeMonitorListener =
      window.api.onMonitorData?.(handleMonitorData) || (() => {});

    return () => {
      if (typeof removeOutputListener === "function") {
        removeOutputListener();
      }
      if (typeof removeStatusListener === "function") {
        removeStatusListener();
      }
      if (typeof removeMonitorListener === "function") {
        removeMonitorListener();
      }
    };
  }, []);

  // 当选择任务查看输出时，加载历史输出
  useEffect(() => {
    if (selectedTaskId) {
      loadTaskOutput(selectedTaskId);
    }
  }, [selectedTaskId]);

  // 自动滚动到输出底部
  useEffect(() => {
    if (selectedTaskId && outputScrollRef.current) {
      // 使用 setTimeout 确保 DOM 更新后再滚动
      const timer = setTimeout(() => {
        const scrollContainer = outputScrollRef.current;
        if (scrollContainer) {
          // 查找 ScrollArea 内部的滚动容器
          // Radix UI ScrollArea 会创建一个带有 data-radix-scroll-area-viewport 的元素
          const scrollViewport = scrollContainer.querySelector(
            "[data-radix-scroll-area-viewport]",
          ) as HTMLElement;
          if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
          } else {
            // 如果找不到 viewport，尝试查找其他可能的滚动容器
            const possibleScrollContainer =
              scrollContainer.querySelector(".overflow-auto") ||
              scrollContainer.querySelector(".overflow-y-auto") ||
              scrollContainer;
            if (possibleScrollContainer instanceof HTMLElement) {
              possibleScrollContainer.scrollTop =
                possibleScrollContainer.scrollHeight;
            }
          }
        }
      }, 10); // 稍微增加延迟，确保 DOM 完全更新
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [taskOutputs, selectedTaskId]);

  // 当选择任务查看图表时，加载性能数据
  useEffect(() => {
    if (selectedTaskForChart) {
      loadTaskMetrics(selectedTaskForChart);
      // 如果任务正在运行，定期刷新性能数据
      const currentTask = tasks.find((t) => t.id === selectedTaskForChart);
      if (currentTask?.status === "running") {
        const interval = setInterval(() => {
          loadTaskMetrics(selectedTaskForChart);
        }, 2000);
        return () => clearInterval(interval);
      }
    }
    return undefined;
  }, [selectedTaskForChart, tasks]);

  // 加载任务历史输出
  const loadTaskOutput = async (taskId: string) => {
    try {
      const output = (await window.api.getWukongTaskOutput?.(taskId)) || "";
      if (output) {
        setTaskOutputs((prev) => ({
          ...prev,
          [taskId]: output,
        }));
      }
    } catch (error) {
      console.error("加载任务输出失败:", error);
    }
  };

  // 加载任务性能数据
  const loadTaskMetrics = async (taskId: string) => {
    try {
      const metrics = (await window.api.getWukongTaskMetrics?.(taskId)) || [];
      setTaskMetrics((prev) => ({
        ...prev,
        [taskId]: metrics,
      }));
    } catch (error) {
      console.error("加载任务性能数据失败:", error);
    }
  };

  // 创建新任务
  const handleCreateTask = async (
    name: string,
    config: WukongExecConfig | WukongSpecialConfig | WukongFocusConfig,
    command: string,
    type: WukongTestType,
    packageName?: string,
    metrics?: string[],
  ) => {
    try {
      if (!packageName) {
        toast.error("请选择监控应用");
        return;
      }

      const taskId = `wukong-${Date.now()}`;
      const testType = type; // 直接使用，无需映射

      // 直接使用前端生成的命令和配置，不需要转换
      // 后端会优先使用command字段，如果没有则从config构建
      const backendTask = await window.api.createWukongTask({
        id: taskId,
        name,
        testType,
        config: config, // 直接传递前端配置，后端会保存但优先使用command
        command: command, // 传递前端生成的命令字符串
        packageName: packageName,
        metrics: metrics || [],
      });

      // 直接使用后端返回的任务
      setTasks([...tasks, backendTask]);
      setIsSheetOpen(false);
      toast.success("任务创建成功");
      await loadTasks(); // 重新加载确保同步
    } catch (error) {
      console.error("创建任务失败:", error);
      toast.error("创建任务失败");
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await window.api.removeWukongTask(taskId);
      if (result.success) {
        setTasks(tasks.filter((task) => task.id !== taskId));
        toast.success("任务删除成功");
      } else {
        toast.error("删除任务失败");
      }
    } catch (error) {
      console.error("删除任务失败:", error);
      toast.error("删除任务失败");
    }
  };

  // 执行任务
  const handleExecuteTask = async (taskId: string) => {
    try {
      const result = await window.api.startWukongTask(taskId);
      if (result.success) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId ? { ...task, status: "running" } : task,
          ),
        );
        toast.success(result.message || "任务启动成功");
        await loadTasks(); // 重新加载确保状态同步
      } else {
        toast.error(result.message || "启动任务失败");
      }
    } catch (error) {
      console.error("启动任务失败:", error);
      toast.error("启动任务失败");
    }
  };

  // 停止任务
  const handleStopTask = async (taskId: string) => {
    try {
      const result = await window.api.stopWukongTask(taskId);
      if (result.success) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId ? { ...task, status: "finished" } : task,
          ),
        );
        toast.success(result.message || "任务已停止");
        await loadTasks(); // 重新加载确保状态同步
      } else {
        toast.error(result.message || "停止任务失败");
      }
    } catch (error) {
      console.error("停止任务失败:", error);
      toast.error("停止任务失败");
    }
  };

  // 查看输出
  const handleViewOutput = (task: WukongTask) => {
    setSelectedTaskId(task.id);
  };

  // 图表性能
  const handleViewPerformance = (task: WukongTask) => {
    if (!task.packageName || !task.metrics || task.metrics.length === 0) {
      toast.warning("该任务未配置监控应用或监控指标");
      return;
    }
    setSelectedTaskForChart(task.id);
  };

  // 日志详情
  const handleViewLogs = async (task: WukongTask) => {
    try {
      // 打开任务目录
      await window.api.openWukongTaskDirectory(task.id);
    } catch (error) {
      console.error("打开任务目录失败:", error);
      toast.error("打开任务目录失败");
    }
  };

  // 启动任务
  const handleStartTask = (task: WukongTask) => {
    if (task.status === "idle") {
      handleExecuteTask(task.id);
    }
  };

  // 打开创建任务Sheet
  const handleOpenCreateSheet = () => {
    setIsSheetOpen(true);
  };

  // 关闭Sheet
  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "running":
        return "bg-primary text-primary-foreground";
      case "finished":
        return "bg-emerald-600 text-white";
      case "error":
        return "bg-destructive text-destructive-foreground";
      case "stopped":
        return "bg-yellow-600 text-white";
      case "idle":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // 筛选和搜索任务
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          task.name.toLowerCase().includes(query) ||
          (task.command?.toLowerCase().includes(query) ?? false) ||
          task.packageName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 类型过滤
      if (filterType !== "all" && task.testType !== filterType) {
        return false;
      }

      // 状态过滤
      if (filterStatus !== "all" && task.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterType, filterStatus]);

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选栏 */}
      <div className="flex-shrink-0 p-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索任务名称、监控应用..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] ">
              <SelectValue placeholder="任务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="exec">随机测试</SelectItem>
              <SelectItem value="special">专项测试</SelectItem>
              <SelectItem value="focus">专注测试</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="任务状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="idle">待执行</SelectItem>
              <SelectItem value="running">执行中</SelectItem>
              <SelectItem value="finished">已完成</SelectItem>
              <SelectItem value="error">失败</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleOpenCreateSheet} size="sm">
            <Plus className="w-4 h-4" />
            创建任务
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          共 {filteredTasks.length} / {tasks.length} 个任务
        </div>
      </div>

      {/* 任务列表 */}
      <ScrollArea className="flex-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Terminal className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              暂无任务
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              点击&#34;创建任务&#34;按钮开始创建你的第一个测试任务
            </p>
            <Button onClick={handleOpenCreateSheet} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              创建任务
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              未找到匹配的任务
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              尝试调整搜索条件或筛选器
            </p>
          </div>
        ) : (
          <div className="p-1 grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
            {filteredTasks.map((task) => {
              const TaskIcon = taskTypeIcons[task.testType];
              return (
                <div key={task.id} className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TaskIcon className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold truncate">
                        {task.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${getStatusStyle(
                          task.status,
                        )}`}
                      >
                        {statusLabels[task.status]}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleStartTask(task)}
                            disabled={task.status !== "idle"}
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            启动任务
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStopTask(task.id)}
                            disabled={task.status !== "running"}
                          >
                            <Square className="w-3.5 h-3.5" />
                            停止任务
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewOutput(task)}
                            disabled={task.status === "idle"}
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            查看输出
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewPerformance(task)}
                            disabled={
                              task.status === "idle" || !task.packageName
                            }
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            图表性能
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewLogs(task)}
                            disabled={task.status === "idle"}
                          >
                            <ScrollText className="w-3.5 h-3.5" />
                            日志详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {task.packageName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Smartphone className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="truncate">
                          监控：{task.packageName}
                        </span>
                      </div>
                    )}
                    {task.metrics && task.metrics.length > 0 && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Monitor className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          指标：
                          {task.metrics
                            .map((key) => {
                              const metricMap: Record<string, string> = {
                                cpu: "CPU",
                                memory: "内存",
                                gpu: "GPU",
                                fps: "FPS",
                                temperature: "温度",
                                power: "功耗",
                                network: "网络",
                              };
                              return metricMap[key] || key;
                            })
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {task.command ? (
                      <div className="bg-muted/50 rounded-md p-2 font-mono text-xs">
                        <div className="flex items-start gap-1">
                          <span className="text-muted-foreground select-none flex-shrink-0">
                            $
                          </span>
                          <code className="break-all whitespace-pre-wrap text-[10px] line-clamp-3">
                            {task.command}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground">
                        命令信息不可用
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* 配置Sheet */}
      <WukongConfigSheet
        open={isSheetOpen}
        onOpenChange={handleCloseSheet}
        onSave={handleCreateTask}
        selectedDevice={selectedDevice}
      />

      {/* 实时输出面板 */}
      <Sheet
        open={selectedTaskId !== null}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl bg-card flex flex-col p-0">
          <SheetHeader className="flex-shrink-0 pb-4">
            <SheetTitle>任务输出</SheetTitle>
            <SheetDescription>
              {selectedTaskId &&
                tasks.find((t) => t.id === selectedTaskId)?.name}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 flex flex-col min-h-0 px-6 mb-4 gap-3">
            <div className="flex-1 min-h-0" ref={outputScrollRef}>
              <ScrollArea className="h-full rounded-lg ">
                <div className="p-4 font-mono text-xs">
                  <pre className="whitespace-pre-wrap break-words ">
                    {selectedTaskId
                      ? taskOutputs[selectedTaskId] || "等待输出..."
                      : ""}
                  </pre>
                </div>
              </ScrollArea>
            </div>
            {selectedTaskId && (
              <div className="flex items-center justify-between mt-3 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTaskOutputs((prev) => ({
                      ...prev,
                      [selectedTaskId]: "",
                    }));
                  }}
                  className="h-7 text-xs"
                >
                  清空
                </Button>
                <span className="text-xs text-muted-foreground">
                  {taskOutputs[selectedTaskId]?.length || 0} 字符
                </span>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 性能监控图表面板 */}
      <Sheet
        open={selectedTaskForChart !== null}
        onOpenChange={(open) => !open && setSelectedTaskForChart(null)}
      >
        <SheetContent className="w-full bg-card sm:max-w-2xl flex flex-col p-0">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>性能监控图表</SheetTitle>
            <SheetDescription>
              {selectedTaskForChart &&
                tasks.find((t) => t.id === selectedTaskForChart)?.name}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 mb-4">
              {selectedTaskForChart &&
                (() => {
                  const task = tasks.find((t) => t.id === selectedTaskForChart);
                  if (
                    !task ||
                    !task.packageName ||
                    !task.metrics ||
                    task.metrics.length === 0
                  ) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">
                          该任务未配置性能监控
                        </p>
                      </div>
                    );
                  }

                  const metrics = taskMetrics[selectedTaskForChart] || [];

                  // 转换数据格式为图表需要的格式
                  const convertMetricsToChartData = (metricKey: string) => {
                    return metrics
                      .map((sample) => {
                        let value: number | undefined;
                        switch (metricKey) {
                          case "cpu":
                            value = sample.appCpuUsage || sample.cpu;
                            break;
                          case "memory":
                            value = sample.appMemoryUsage || sample.memory;
                            break;
                          case "gpu":
                            value = sample.gpuLoad;
                            break;
                          case "fps":
                            value = sample.fps;
                            break;
                          case "temperature":
                            value = sample.deviceTemperature;
                            break;
                          case "power":
                            value = sample.powerConsumption;
                            break;
                          case "network":
                            value =
                              (sample.networkUpSpeed || 0) +
                              (sample.networkDownSpeed || 0);
                            break;
                        }

                        if (value === undefined || isNaN(value)) return null;

                        const date = new Date(sample.timestamp);
                        return {
                          time: `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`,
                          value: Number(value.toFixed(2)),
                        };
                      })
                      .filter(
                        (item): item is { time: string; value: number } =>
                          item !== null,
                      );
                  };

                  const enabledMetrics = (task.metrics || []).filter((m) =>
                    monitorMetricsConfig.some((mm) => mm.key === m),
                  );

                  if (metrics.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground font-medium">
                          暂无性能数据
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.status === "running"
                            ? "性能数据正在收集中..."
                            : "任务未运行或未配置性能监控"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 gap-2">
                      {enabledMetrics.map((metricKey, index) => {
                        const chartData = convertMetricsToChartData(metricKey);
                        if (chartData.length === 0) return null;

                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-border/50 p-3 shadow-sm bg-background/30"
                          >
                            <MonitoringChart
                              metricKey={metricKey}
                              data={chartData}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
