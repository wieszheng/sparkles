import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { lazy, Suspense, useEffect, useState } from "react";
import { Project } from "@/components/Project";
import { AutomationFlow } from "@/components/Automation";
import { Dashboard } from "@/components/Dashboard";
import { Settings } from "@/components/Settings";
import { Application } from "@/components/Application";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { ScreenMirror } from "@/components/ScreenMirror";
import { Route, Routes } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Cog,
  FileOutput,
  FileText,
  FolderPlus,
  List,
  Loader2,
  Minus,
  PackagePlus,
  Square,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Api } from "@/apis";
import { toast } from "sonner";
import { Toolbar } from "@/components/Toolbar";
import { AiChat } from "@/components/Chat";
// import { Intelligence } from "@/components/Intelligence";
// import { FrameAnalyzer } from "@/components/FrameAnalyzer";
import { Monitoring } from "@/components/Monitoring";
import { QRCode } from "@/components/QRCode";
import { AiTest } from "@/components/ai-test";
import { TestCases } from "@/components/TestCase";
import { AppStep } from "@/components/ai-test/types";
import { FrameMark } from "@/components/frame-mark";

// 定义设备类型
interface Device {
  key: string;
  name: string;
  ohosVersion: string;
  sdkVersion: string;
}

function Main() {
  const [activePage, setActivePage] = useState("dashboard");
  // 设备状态管理
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // 项目选择
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    team: "",
    tags: "",
  });
  const [newProjectAction, setNewProjectAction] = useState(false);
  const [showToolSettings, setShowToolSettings] = useState(false);
  const [toolSettings, setToolSettings] = useState({
    screenshotFormat: "PNG",
    saveLocation: "/screenshots",
  });

  const [isInstalling, setIsInstalling] = useState(false);
  const [testCaseWorkflow, setTestCaseWorkflow] = useState(null);

  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const steps = [
    { id: AppStep.INPUT, label: "需求输入", icon: FileText },
    { id: AppStep.REVIEW, label: "测试点评审", icon: List },
    { id: AppStep.RESULTS, label: "用例结果", icon: FileOutput },
  ];
  // 处理测试用例工作流加载
  const handleLoadTestCaseWorkflow = (testCase) => {
    console.log("加载测试用例工作流:", testCase);
    setTestCaseWorkflow(testCase);
    // 切换到自动化页面
    setActivePage("automation");
  };

  // 加载工具设置
  useEffect(() => {
    const loadToolSettings = async () => {
      const data = await window.api.getToolSettings();
      if (data) {
        setToolSettings(data);
      }
    };
    loadToolSettings();
  }, []);

  // 保存工具设置
  const saveToolSettings = async () => {
    const result = await window.api.setToolSettings(toolSettings);
    if (result.success) {
      setToolSettings((prev) => ({ ...prev, ...toolSettings }));
      toast.success("工具设置保存成功");
    }
    setShowToolSettings(false);
  };

  useEffect(() => {
    window.electron.ipcRenderer.on("hdc", (_, args: string) => {
      if (args === "changeTarget") {
        window.api.getTargets().then((targets) => {
          console.log("Received targets:", targets);
          setDevices(targets);
          setSelectedDeviceId(targets[0]?.key || "");
        });
      }
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners("hdc");
    };
  }, []);

  // 拉取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const resp = await window.api.callApi("POST", Api.getProjectAll, {
          current: 1,
          pageSize: 100,
        });
        const items = resp?.data?.items || [];
        setProjects(items);
        if (!selectedProject && items.length > 0) setSelectedProject(items[0]);
      } catch (e) {
        console.error("获取项目列表失败", e);
      }
    };
    fetchProjects();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "projects":
        return <Project action={newProjectAction} />;
      case "test-cases":
        return (
          <TestCases onLoadTestCaseWorkflow={handleLoadTestCaseWorkflow} />
        );
      case "ai":
        return <AiChat />;
      case "ai-test":
        return <AiTest onStepChange={setStep} />;
      case "automation":
        return (
          <AutomationFlow
            selectedDevice={selectedDeviceId}
            selectedProject={selectedProject}
            testCaseWorkflow={testCaseWorkflow}
          />
        );
      case "screen-mirror":
        return <ScreenMirror selectedDevice={selectedDeviceId} />;
      case "video-frame-analyzer":
        return <FrameMark />;
      case "monitoring":
        return <Monitoring />;
      case "toolbar":
        return <Toolbar selectedDevice={selectedDeviceId} />;
      case "qrcode":
        return <QRCode />;
      case "applications":
        return (
          <Application
            selectedDevice={selectedDeviceId}
            action={isInstalling}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  function getPageTitle(activePage: string) {
    const titles = {
      dashboard: "仪表盘",
      projects: "项目管理",
      "test-cases": "测试用例",
      "test-plans": "测试计划",
      ai: "AIChat",
      "ai-test": "智能生成",
      reports: "测试报告",
      automation: "自动化",
      "video-frame-analyzer": "耗时分析",
      monitoring: "应用监控",
      "screen-mirror": "屏幕镜像",
      toolbar: "工具栏",
      qrcode: "二维码生成",
      applications: "应用列表",
      settings: "设置",
    };
    return titles[activePage as keyof typeof titles] || "项目管理";
  }

  function getPageDescription(activePage: string) {
    const descriptions = {
      dashboard: "欢迎回来，开始美好的一天",
      projects: "管理和配置测试项目",
      "test-cases": "管理和执行UI自动化测试用例",
      ai: "智能分析测试结果和性能数据",
      "ai-test": "智能生成测试用例",
      reports: "查看详细的测试报告和统计信息",
      automation: "配置自动化测试流程和规则",
      "video-frame-analyzer": "视频帧分析并统计耗时",
      monitoring: "用APP场景性能监控",
      "screen-mirror": "实时屏幕镜像和图像显示",
      toolbar: "工具栏功能",
      qrcode: "创建普通、艺术或动态二维码",
      applications: "查看和管理设备上的应用",
      settings: "系统设置和个人偏好配置",
    };
    return (
      descriptions[activePage as keyof typeof descriptions] ||
      "管理和配置测试项目"
    );
  }

  const handleCreateProject = async () => {
    const project = {
      name: newProject.name,
      description: newProject.description || "暂无",
      last_run: "从未运行",
      team: newProject.team
        ? newProject.team.split("，").map((t) => t.trim())
        : [],
      tags: newProject.tags
        ? newProject.tags.split("，").map((t) => t.trim())
        : [],
    };
    const data = await window.api.callApi("POST", Api.createProject, project);
    if (data.success) {
      setNewProject({
        name: "",
        description: "",
        team: "",
        tags: "",
      });
      setNewProjectAction(!newProjectAction);
      toast.success("项目创建成功");
    } else {
      toast.error(data.message);
    }
    setCreateDialogOpen(false);
  };

  const handleInstallApp = async () => {
    if (!selectedDeviceId) {
      toast.error("请选择设备");
      return;
    }

    // 打开文件选择对话框
    const result = await window.api.openFileDialog({
      title: "选择Hap文件",
      filters: [
        { name: "Hap Package", extensions: ["hap"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (result && !result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        setIsInstalling(true);
        await window.api.installBundle(selectedDeviceId, filePath);

        toast.success(`应用安装成功: ${filePath.split(/[/\\]/).pop()}`);
      } catch (error) {
        toast.error(`安装应用失败: ${error || ""}`);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const getPageActions = (activePage: string) => {
    switch (activePage) {
      case "projects":
        return (
          <>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">新建项目</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card">
                <DialogHeader>
                  <DialogTitle>创建新项目</DialogTitle>
                  <DialogDescription>
                    配置基本信息来创建新的测试项目
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Project Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">
                        项目名称<p className="text-red-500">*</p>
                      </Label>
                      <Input
                        id="project-name"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                        placeholder="输入项目名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-team">团队成员</Label>
                      <Input
                        id="project-team"
                        value={newProject.team}
                        onChange={(e) =>
                          setNewProject({ ...newProject, team: e.target.value })
                        }
                        placeholder="张三, 李四, 王五"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-description">项目描述</Label>
                    <Textarea
                      id="project-description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      placeholder="描述项目的测试目标和范围"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-tags">标签</Label>
                    <Input
                      id="project-tags"
                      value={newProject.tags}
                      onChange={(e) =>
                        setNewProject({ ...newProject, tags: e.target.value })
                      }
                      placeholder="UI测试, 回归测试, 性能测试"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProject.name.trim()}
                    size="sm"
                  >
                    <FolderPlus className="h-4 w-4" />
                    创建项目
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );
      case "automation":
        return (
          <Select
            value={selectedProject?.id || ""}
            onValueChange={(value) => {
              const project = projects.find((p) => p.id === value);
              setSelectedProject(project || null);
            }}
          >
            <SelectTrigger className="w-[150px] border-none dark:bg-background dark:hover:bg-background">
              <SelectValue placeholder="选择项目" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "video-frame-analyzer":
        return (
          <Select
            value={selectedProject?.id || ""}
            onValueChange={(value) => {
              const project = projects.find((p) => p.id === value);
              setSelectedProject(project || null);
            }}
          >
            <SelectTrigger className="w-[150px] border-none dark:bg-background dark:hover:bg-background">
              <SelectValue placeholder="选择项目" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "test-cases":
        return (
          <div className="flex gap-2 electron-no-drag">
            <Button size="sm">批量运行</Button>
          </div>
        );
      case "ai-test":
        return (
          <div className="flex items-center space-x-2">
            {steps.map((s, index) => {
              // Determine state
              const isCurrent =
                step === s.id ||
                (s.id === AppStep.INPUT && step === AppStep.ANALYSIS) ||
                (s.id === AppStep.REVIEW && step === AppStep.GENERATING);

              const isCompleted =
                (s.id === AppStep.INPUT &&
                  step !== AppStep.INPUT &&
                  step !== AppStep.ANALYSIS) ||
                (s.id === AppStep.REVIEW &&
                  (step === AppStep.GENERATING || step === AppStep.RESULTS));

              return (
                <div key={s.id} className="flex items-center">
                  {index > 0 && (
                    <div className="mx-1 ">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`flex rounded gap-1 font-medium ${
                      isCurrent
                        ? "animate-pulse"
                        : isCompleted
                          ? ""
                          : "text-muted-foreground/70"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                    <span className="text-xs">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "reports":
        return (
          <div className="flex gap-2 electron-no-drag">
            <Button size="sm">生成报告</Button>
            <Button size="sm" variant="outline">
              导出PDF
            </Button>
          </div>
        );
      case "toolbar":
        return (
          <>
            <Dialog open={showToolSettings} onOpenChange={setShowToolSettings}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Cog className="w-5 h-5 text-primary animate-spin" />
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl bg-card">
                <DialogHeader>
                  <DialogTitle>工具设置</DialogTitle>
                  <DialogDescription>
                    配置截图和录屏工具的参数设置
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">截图格式</label>
                    <Select
                      value={toolSettings.screenshotFormat}
                      onValueChange={(value) =>
                        setToolSettings((prev) => ({
                          ...prev,
                          screenshotFormat: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="暂无设备" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpeg">JPG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">保存位置</label>
                    <Input
                      type="text"
                      value={toolSettings.saveLocation}
                      onChange={(e) =>
                        setToolSettings((prev) => ({
                          ...prev,
                          saveLocation: e.target.value,
                        }))
                      }
                      className="w-full mt-1"
                      placeholder="/screenshots"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToolSettings(false)}
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await saveToolSettings();
                    }}
                  >
                    保存设置
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );
      case "applications":
        return (
          <Button size="sm" onClick={handleInstallApp}>
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                安装中
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4" />
                安装
              </>
            )}
          </Button>
        );
      default:
        return null;
    }
  };
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="h-4 electron-drag">
        <div className="flex justify-end electron-drag">
          {window.electron.pf === "win32" && (
            <div className="flex items-center electron-no-drag">
              <button
                className="w-10 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors electron-no-drag"
                onClick={() => {
                  window.electron.ipcRenderer.send("action", "MINIMIZE");
                }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                className="w-10 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors electron-no-drag"
                onClick={() => {
                  window.electron.ipcRenderer.send("action", "MAXIMIZE");
                }}
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                className="w-10 h-8 flex items-center justify-center hover:bg-red-500 hover:text-destructive-foreground rounded transition-colors electron-no-drag"
                onClick={() => {
                  window.electron.ipcRenderer.send("action", "CLOSE");
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 p-3 gap-4 min-h-0">
        {/* 左侧侧边栏卡片 */}
        <Sidebar onPageChange={setActivePage} activePage={activePage} />

        {/* 右侧页面区 */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex-shrink-0 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-1">
                      <h2 className="text-xl font-semibold">
                        {getPageTitle(activePage)}
                      </h2>
                      {/* 设备选择器 */}
                      {!["settings"].includes(activePage) && (
                        <>
                          <Select
                            value={selectedDeviceId}
                            onValueChange={setSelectedDeviceId}
                          >
                            <SelectTrigger className="w-[170px] border-none dark:bg-background dark:hover:bg-background">
                              <SelectValue placeholder="暂无设备" />
                            </SelectTrigger>
                            <SelectContent>
                              {devices.map((device) => (
                                <SelectItem
                                  key={device.key}
                                  value={device.key}
                                  className="w-[160px]"
                                >
                                  <AnimatedShinyText className="font-mono">
                                    <span>{device.name}</span>
                                  </AnimatedShinyText>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div
                            className={`w-2 h-2 rounded-full ${selectedDeviceId !== "" ? "bg-green-500" : "bg-gray-400"}`}
                          />
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getPageDescription(activePage)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 页面操作按钮 */}
              {getPageActions(activePage)}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full">
              <div
                className="h-full overflow-y-auto"
                style={{
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                {renderPage()}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" duration={2000} />
    </div>
  );
}

const LoaderPage = lazy(() => import("@/components/StartupLoader"));
function App() {
  return (
    <Suspense fallback={<LoaderPage />}>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/loading" element={<LoaderPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
