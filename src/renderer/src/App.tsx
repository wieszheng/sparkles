import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { lazy, Suspense, useEffect, useState } from "react";
import { Project } from "@/components/Project";
import { TestCases } from "@/components/TestCase";
import { AutomationFlow } from "@/components/Automation";
import { Dashboard } from "@/components/Dashboard";
import { Settings } from "@/components/Settings";
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
import { Minus, Square, X } from "lucide-react";

function AIAnalysisPage() {
  return null;
}

function ReportsPage() {
  return null;
}

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

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "projects":
        return <Project />;
      case "test-cases":
        return <TestCases />;
      case "ai-analysis":
        return <AIAnalysisPage />;
      case "reports":
        return <ReportsPage />;
      case "automation":
        return <AutomationFlow />;
      case "screen-mirror":
        return <ScreenMirror selectedDevice={selectedDeviceId} />;
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
      "ai-analysis": "AI 分析",
      reports: "测试报告",
      automation: "自动化",
      "screen-mirror": "屏幕镜像",
      settings: "设置",
    };
    return titles[activePage as keyof typeof titles] || "项目管理";
  }

  function getPageDescription(activePage: string) {
    const descriptions = {
      dashboard: "查看系统概览和关键指标",
      projects: "管理和配置测试项目",
      "test-cases": "管理和执行UI自动化测试用例",
      "ai-analysis": "智能分析测试结果和性能数据",
      reports: "查看详细的测试报告和统计信息",
      automation: "配置自动化测试流程和规则",
      "screen-mirror": "实时屏幕镜像和图像显示",
      settings: "系统设置和个人偏好配置",
    };
    return (
      descriptions[activePage as keyof typeof descriptions] ||
      "管理和配置测试项目"
    );
  }

  const getPageActions = (activePage: string) => {
    switch (activePage) {
      case "projects":
        return (
          <div className="flex gap-2 electron-no-drag">
            <Button size="sm">新建项目</Button>
            <Button size="sm" variant="outline">
              导入项目
            </Button>
          </div>
        );
      case "test-cases":
        return (
          <div className="flex gap-2 electron-no-drag">
            <Button size="sm">批量运行</Button>
          </div>
        );
      case "ai-analysis":
        return (
          <div className="flex gap-2 electron-no-drag">
            <Button size="sm">开始分析</Button>
            <Button size="sm" variant="outline">
              历史分析
            </Button>
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
      default:
        return null;
    }
  };
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="h-4 electron-drag">
        <div className="flex justify-end electron-drag">
          {window.electron.process.platform === "win32" && (
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
          <div className="flex-shrink-0 p-2 ">
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
