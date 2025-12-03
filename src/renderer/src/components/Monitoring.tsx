import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, BarChart3, ListTodo, FileCode, Settings } from "lucide-react";

// 类型和数据
import type {
  MonitoringTask,
  ScriptFile,
  MonitorConfig,
} from "@/components/monitoring/types";
import {
  mockMonitoringTasks,
  mockScripts,
  generateChartData,
} from "@/components/monitoring/mock-data";

// 子组件
import { MonitoringDashboard } from "@/components/monitoring/monitoring-dashboard";
import { TaskManagement } from "@/components/monitoring/task-management";
import { ScriptEditor } from "@/components/monitoring/script-editor";
import { MonitoringConfigPanel } from "@/components/monitoring/monitoring-config";
import { TaskDetailSheet } from "@/components/monitoring/task-detail-sheet";
import { CreateTaskDialog } from "@/components/monitoring/create-task-dialog";

export function Monitoring() {
  const [tasks, setTasks] = useState<MonitoringTask[]>(mockMonitoringTasks);
  const [scripts, setScripts] = useState<ScriptFile[]>(mockScripts);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MonitoringTask | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    script: "",
    app: "",
  });

  const [monitorConfig, setMonitorConfig] = useState<MonitorConfig>({
    cpu: true,
    memory: true,
    temperature: false,
    battery: false,
    traffic: false,
    interval: "1m",
  });

  const handleOpenTaskDialog = () => {
    setFormData({ name: "", script: "", app: "" });
    setOpenTaskDialog(true);
  };

  const handleCreateTask = () => {
    if (!formData.name || !formData.script || !formData.app) return;

    const newTask: MonitoringTask = {
      id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      name: formData.name,
      script: formData.script,
      app: formData.app,
      status: "running",
      createdAt: new Date().toISOString().split("T")[0],
      deprecated: false,
      reportData: true,
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
    setOpenTaskDialog(false);
    setFormData({ name: "", script: "", app: "" });
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleViewTask = (task: MonitoringTask) => {
    setSelectedTask(task);
    setShowDetailSheet(true);
  };

  const handleToggleTaskStatus = (id: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          if (task.status === "running") {
            return {
              ...task,
              status: "stopped" as const,
              endTime: new Date().toLocaleString(),
            };
          } else if (task.status === "pending" || task.status === "stopped") {
            return {
              ...task,
              status: "running" as const,
              startTime: new Date().toLocaleString(),
              data: {
                cpu: generateChartData(),
                memory: generateChartData(),
                temperature: generateChartData(),
                battery: generateChartData(),
                traffic: generateChartData(),
              },
            };
          }
        }
        return task;
      }),
    );
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
    <div className="flex flex-col h-full bg-background/50">
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col h-full">
        {/* 顶部导航 */}
        <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TabsList className="h-8">
                  <TabsTrigger
                    value="dashboard"
                    className="text-xs px-3 h-7 gap-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    监控面板
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="text-xs px-3 h-7 gap-1.5"
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                    任务管理
                  </TabsTrigger>
                  <TabsTrigger
                    value="scripts"
                    className="text-xs px-3 h-7 gap-1.5"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    场景脚本
                  </TabsTrigger>
                  <TabsTrigger
                    value="config"
                    className="text-xs px-3 h-7 gap-1.5"
                  >
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
        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="dashboard" className="mt-0 h-full">
            <MonitoringDashboard
              tasks={tasks}
              monitorConfig={monitorConfig}
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

          <TabsContent value="scripts" className="mt-0">
            <ScriptEditor scripts={scripts} onSaveScript={handleSaveScript} />
          </TabsContent>

          <TabsContent value="config" className="mt-0 flex-1 overflow-auto">
            <MonitoringConfigPanel
              config={monitorConfig}
              onConfigChange={setMonitorConfig}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* 任务详情抽屉 */}
      <TaskDetailSheet
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        task={selectedTask}
        monitorConfig={monitorConfig}
      />

      {/* 新建任务对话框 */}
      <CreateTaskDialog
        open={openTaskDialog}
        onOpenChange={setOpenTaskDialog}
        scripts={scripts}
        formData={formData}
        onFormDataChange={setFormData}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
