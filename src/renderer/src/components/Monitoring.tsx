import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Activity,
  Plus,
  Trash2,
  Edit2,
  MoreHorizontal,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Square,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type TaskStatus = "pending" | "running" | "completed" | "stopped" | "error";

interface MonitoringTask {
  id: number;
  name: string;
  script: string;
  app: string;
  status: TaskStatus;
  createdAt: string;
  deprecated: boolean;
  reportData: boolean;
  startTime?: string;
  endTime?: string;
  data?: {
    cpu: Array<{ time: string; value: number }>;
    memory: Array<{ time: string; value: number }>;
    temperature: Array<{ time: string; value: number }>;
    battery: Array<{ time: string; value: number }>;
    traffic: Array<{ time: string; value: number }>;
  };
}

const mockScripts = [
  { id: 1, name: "login-flow.ts", label: "登录流程" },
  { id: 2, name: "payment-flow.ts", label: "支付功能" },
  { id: 3, name: "cart-flow.ts", label: "购物车流程" },
  { id: 4, name: "checkout-flow.ts", label: "结账流程" },
];

const mockApps = [
  { id: 1, name: "Web App", label: "Web App" },
  { id: 2, name: "Mobile App", label: "Mobile App" },
  { id: 3, name: "Admin Panel", label: "Admin Panel" },
];

const generateChartData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 100) + 20,
  }));
};

const mockMonitoringTasks: MonitoringTask[] = [
  {
    id: 1,
    name: "登录流程监控",
    script: "login-flow.ts",
    app: "Web App",
    status: "completed",
    createdAt: "2024-11-15",
    deprecated: false,
    reportData: true,
    startTime: "2024-11-15 10:00",
    endTime: "2024-11-15 12:00",
    data: {
      cpu: generateChartData(),
      memory: generateChartData(),
      temperature: generateChartData(),
      battery: generateChartData(),
      traffic: generateChartData(),
    },
  },
];

export function Monitoring() {
  const [activeTab, setActiveTab] = useState("monitoring");
  const [tasks, setTasks] = useState<MonitoringTask[]>(mockMonitoringTasks);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [showCompletedDrawer, setShowCompletedDrawer] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [activeTask, setActiveTask] = useState<MonitoringTask | null>(null);
  const [selectedCompletedTask, setSelectedCompletedTask] =
    useState<MonitoringTask | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    script: "",
    app: "",
  });

  const [monitorConfig, setMonitorConfig] = useState({
    cpu: true,
    memory: true,
    temperature: false,
    battery: false,
    traffic: false,
    interval: "1m",
  });

  const handleOpenDialog = (task?: MonitoringTask) => {
    if (task) {
      setEditingId(task.id);
      setFormData({
        name: task.name,
        script: task.script,
        app: task.app,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", script: "", app: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({ name: "", script: "", app: "" });
  };

  const handleSaveTask = () => {
    if (!formData.name || !formData.script || !formData.app) {
      return;
    }

    if (editingId) {
      setTasks(
        tasks.map((task) =>
          task.id === editingId ? { ...task, name: formData.name } : task,
        ),
      );
    } else {
      const newTask: MonitoringTask = {
        id: Math.max(...tasks.map((t) => t.id), 0) + 1,
        name: formData.name,
        script: formData.script,
        app: formData.app,
        status: "running",
        createdAt: new Date().toISOString().split("T")[0],
        deprecated: false,
        reportData: true, // Default to true for new tasks
        startTime: new Date().toLocaleString(),
        data: {
          cpu: generateChartData(),
          memory: generateChartData(),
          temperature: generateChartData(),
          battery: generateChartData(),
          traffic: generateChartData(),
        },
      };
      setTasks([...tasks, newTask]);
      setActiveTask(newTask);
    }

    handleCloseDialog();
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
    if (activeTask?.id === id) {
      setActiveTask(null);
    }
  };

  const handleToggleDeprecated = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, deprecated: !task.deprecated } : task,
      ),
    );
  };

  const handleEditName = (task: MonitoringTask) => {
    setEditingId(task.id);
    setEditingName(task.name);
  };

  const handleSaveName = () => {
    if (editingName.trim()) {
      setTasks(
        tasks.map((task) =>
          task.id === editingId ? { ...task, name: editingName } : task,
        ),
      );
      if (activeTask?.id === editingId) {
        setActiveTask({ ...activeTask, name: editingName });
      }
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCompleteTask = () => {
    if (activeTask) {
      const updatedTask = {
        ...activeTask,
        status: "completed" as TaskStatus,
        endTime: new Date().toLocaleString(),
      };
      setTasks(tasks.map((t) => (t.id === activeTask.id ? updatedTask : t)));
      setActiveTask(null);
    }
  };

  const handleStopTask = () => {
    if (activeTask) {
      const updatedTask = {
        ...activeTask,
        status: "stopped" as TaskStatus,
        endTime: new Date().toLocaleString(),
      };
      setTasks(tasks.map((t) => (t.id === activeTask.id ? updatedTask : t)));
      setActiveTask(null);
    }
  };

  const handleSimulateError = () => {
    if (activeTask) {
      const updatedTask = {
        ...activeTask,
        status: "error" as TaskStatus,
        endTime: new Date().toLocaleString(),
      };
      setTasks(tasks.map((t) => (t.id === activeTask.id ? updatedTask : t)));
      setActiveTask(null);
    }
  };

  const handleViewCompletedTask = (task: MonitoringTask) => {
    setSelectedCompletedTask(task);
    setShowCompletedDrawer(true);
  };

  const handleStartMonitoring = (task: MonitoringTask) => {
    setActiveTask(task);
    setActiveTab("monitoring");
  };

  const chartData = generateChartData();

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-600">运行中</Badge>;
      case "completed":
        return <Badge className="bg-blue-600">已完成</Badge>;
      case "stopped":
        return <Badge className="bg-gray-600">已停止</Badge>;
      case "error":
        return <Badge className="bg-red-600">异常</Badge>;
      default:
        return <Badge>待处理</Badge>;
    }
  };

  const handleToggleReportData = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, reportData: !task.reportData } : task,
      ),
    );
  };

  const chartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Desktop",
      color: "var(--chart-1)",
    },
    mobile: {
      label: "Mobile",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex-1 space-y-5">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        {/* Sticky Header with TabsList */}
        <div className="sticky top-0 z-10 bg-background p-1">
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="monitoring" className="gap-2">
                <Activity className="h-4 w-4" />
                监控
              </TabsTrigger>
              <TabsTrigger value="management" className="gap-2">
                <Edit2 className="h-4 w-4" />
                管理
              </TabsTrigger>
            </TabsList>

            {activeTab === "monitoring" && (
              <div className="flex items-center gap-4">
                {activeTask && activeTask.status === "running" ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-3 w-3">
                        <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></div>
                        <div className="absolute inset-0 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium text-foreground">
                          {activeTask.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          监控中...
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setOpenConfigDialog(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      配置
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenDialog()} size="sm">
                      <Plus className="h-4 w-4" />
                      新建
                    </Button>
                    <Button
                      onClick={() => setOpenConfigDialog(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-2 p-1.5">
            <TabsContent value="monitoring" className="space-y-6 mt-0">
              {activeTask && activeTask.status === "running" ? (
                <div className="space-y-6">
                  <div className="ml-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {activeTask.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTask.app} · {activeTask.script}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCompleteTask}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      任务完成
                    </Button>
                    <Button
                      onClick={handleStopTask}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      停止任务
                    </Button>
                    <Button
                      onClick={handleSimulateError}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      模拟异常
                    </Button>
                  </div>

                  {/* Monitoring Charts Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {monitorConfig.cpu && (
                      <div className="pt-0">
                        <CardHeader className="flex items-center gap-2 space-y-0 py-5">
                          <CardTitle>CPU 使用率</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={chartConfig}
                            className="aspect-auto h-[250px] w-full"
                          >
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient
                                  id="colorCpu"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} />
                              <XAxis
                                dataKey="time"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                              />

                              <ChartTooltip
                                cursor={false}
                                content={
                                  <ChartTooltipContent
                                    labelFormatter={(value) => {
                                      return new Date(value).toLocaleDateString(
                                        "zh_CN",
                                        {
                                          month: "short",
                                          day: "numeric",
                                        },
                                      );
                                    }}
                                    indicator="dot"
                                  />
                                }
                              />

                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                fill="url(#colorCpu)"
                              />

                              {/*<ChartLegend content={<ChartLegendContent />} />*/}
                            </AreaChart>
                          </ChartContainer>
                        </CardContent>
                      </div>
                    )}

                    {monitorConfig.memory && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            内存使用率
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient
                                  id="colorMemory"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#10b981"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#10b981"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorMemory)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {monitorConfig.temperature && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">温度</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient
                                  id="colorTemp"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#f59e0b"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#f59e0b"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorTemp)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {monitorConfig.battery && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">电量</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient
                                  id="colorBattery"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#8b5cf6"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#8b5cf6"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8b5cf6"
                                fillOpacity={1}
                                fill="url(#colorBattery)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {monitorConfig.traffic && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">流量</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient
                                  id="colorTraffic"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#ec4899"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#ec4899"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#ec4899"
                                fillOpacity={1}
                                fill="url(#colorTraffic)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 py-20">
                  <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">还没有开启监控</h3>
                  <p className="text-muted-foreground">赶快新建任务吧！</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="management" className="space-y-4 mt-0">
              {tasks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        task.deprecated ? "opacity-60" : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            {editingId === task.id ? (
                              <Input
                                autoFocus
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveName();
                                  if (e.key === "Escape") {
                                    setEditingId(null);
                                    setEditingName("");
                                  }
                                }}
                                placeholder="输入任务名称"
                                className="h-7"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <>
                                <CardTitle
                                  className={`text-base cursor-pointer ${
                                    task.deprecated
                                      ? "line-through text-muted-foreground"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (task.status === "running") {
                                      handleStartMonitoring(task);
                                    } else if (task.status === "completed") {
                                      handleViewCompletedTask(task);
                                    }
                                  }}
                                >
                                  {task.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {task.script}
                                </CardDescription>
                              </>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditName(task);
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                修改名称
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleDeprecated(task.id);
                                }}
                              >
                                标记{task.deprecated ? "为正常" : "废弃"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          {getStatusBadge(task.status)}
                          {task.deprecated && (
                            <Badge variant="outline" className="text-xs">
                              已废弃
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">脚本</span>
                            <span className="font-medium">{task.script}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">应用</span>
                            <span className="font-medium">{task.app}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              创建时间
                            </span>
                            <span className="font-medium text-xs">
                              {task.createdAt}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-muted-foreground">
                              数据上报
                            </span>
                            <div
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReportData(task.id);
                              }}
                            >
                              <Badge
                                variant={
                                  task.reportData ? "default" : "secondary"
                                }
                              >
                                {task.reportData ? "已启用" : "未启用"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      暂无监控任务
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Create/Edit Task Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "编辑监控任务" : "新建监控任务"}
            </DialogTitle>
            <DialogDescription>
              创建一个新的监控任务来实时监控应用性能
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">任务名称</label>
              <Input
                placeholder="例如: 登录流程监控"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">选择脚本</label>
              <Select
                value={formData.script}
                onValueChange={(value) =>
                  setFormData({ ...formData, script: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个脚本" />
                </SelectTrigger>
                <SelectContent>
                  {mockScripts.map((script) => (
                    <SelectItem key={script.id} value={script.name}>
                      {script.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">选择应用</label>
              <Select
                value={formData.app}
                onValueChange={(value) =>
                  setFormData({ ...formData, app: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个应用" />
                </SelectTrigger>
                <SelectContent>
                  {mockApps.map((app) => (
                    <SelectItem key={app.id} value={app.name}>
                      {app.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSaveTask}>
              {editingId ? "保存更改" : "创建任务"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Monitor Configuration Dialog */}
      <Dialog open={openConfigDialog} onOpenChange={setOpenConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>监控配置</DialogTitle>
            <DialogDescription>
              选择要监控的项目和设置监控间隔
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">监控项</h4>
              <div className="space-y-3">
                {[
                  { key: "cpu", label: "CPU 使用率" },
                  { key: "memory", label: "内存使用率" },
                  { key: "temperature", label: "温度" },
                  { key: "battery", label: "电量" },
                  { key: "traffic", label: "流量" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={
                        monitorConfig[
                          item.key as keyof typeof monitorConfig
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setMonitorConfig({
                          ...monitorConfig,
                          [item.key]: checked,
                        })
                      }
                    />
                    <label
                      htmlFor={item.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">监控间隔</label>
              <Select
                value={monitorConfig.interval}
                onValueChange={(value) =>
                  setMonitorConfig({ ...monitorConfig, interval: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30s">30秒</SelectItem>
                  <SelectItem value="1m">1分钟</SelectItem>
                  <SelectItem value="5m">5分钟</SelectItem>
                  <SelectItem value="10m">10分钟</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenConfigDialog(false)}
            >
              取消
            </Button>
            <Button onClick={() => setOpenConfigDialog(false)}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer
        open={showCompletedDrawer}
        onOpenChange={setShowCompletedDrawer}
        direction="right"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {selectedCompletedTask?.name} - 监控数据详情
            </DrawerTitle>
            <DrawerDescription>
              执行时间: {selectedCompletedTask?.startTime} 至{" "}
              {selectedCompletedTask?.endTime}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-2">
            <div className="grid gap-6 md:grid-cols-2">
              {selectedCompletedTask?.data?.cpu && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CPU 使用率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={selectedCompletedTask.data.cpu}>
                        <defs>
                          <linearGradient
                            id="colorCpuDetail"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorCpuDetail)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {selectedCompletedTask?.data?.memory && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">内存使用率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={selectedCompletedTask.data.memory}>
                        <defs>
                          <linearGradient
                            id="colorMemoryDetail"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorMemoryDetail)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {selectedCompletedTask?.data?.temperature && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">温度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={selectedCompletedTask.data.temperature}>
                        <defs>
                          <linearGradient
                            id="colorTempDetail"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f59e0b"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f59e0b"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorTempDetail)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {selectedCompletedTask?.data?.battery && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">电量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={selectedCompletedTask.data.battery}>
                        <defs>
                          <linearGradient
                            id="colorBatteryDetail"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8b5cf6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8b5cf6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8b5cf6"
                          fillOpacity={1}
                          fill="url(#colorBatteryDetail)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {selectedCompletedTask?.data?.traffic && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">流量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={selectedCompletedTask.data.traffic}>
                        <defs>
                          <linearGradient
                            id="colorTrafficDetail"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ec4899"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ec4899"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#ec4899"
                          fillOpacity={1}
                          fill="url(#colorTrafficDetail)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
