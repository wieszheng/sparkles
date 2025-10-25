import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UpdateDialog } from "@/components/UpdateDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoRun: false,
    reportEmail: "admin@example.com",
    maxConcurrent: 5,
    timeout: 30,
    retryCount: 3,
    hdcPath: "/usr/local/bin/hdc",
    hdcAutoDetect: true,
  });

  const [electronInfo, setElectronInfo] = useState({
    nodeVersion: "检测中...",
    chromeVersion: "检测中...",
    electronVersion: "检测中...",
    backendPort: "检测中...",
    apiStatus: "检测中...",
  });

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const loadSettings = async () => {
    const data = await window.api.getSystemSettings();
    if (data) {
      console.log("设置数据:", data);
      setSettings(data);
    }
  };

  // 保存设置
  const saveSettings = async () => {
    const result = await window.api.setSystemSettings(settings);
    if (result.success) {
      setSettings((prev) => ({ ...prev, ...settings }));
      toast.success("设置保存成功");
    }
    setShowUpdateDialog(false);
  };
  useEffect(() => {
    if (window.electron) {
      console.log("Electron API可用，开始测试功能");
      loadSettings();
      // 测试版本信息
      try {
        const { node, chrome, electron } = window.electron.process.versions;
        console.log("版本信息:", node);
        setElectronInfo((prev) => ({
          ...prev,
          nodeVersion: node ?? "未知",
          chromeVersion: chrome ?? "未知",
          electronVersion: electron ?? "未知",
        }));
      } catch (error) {
        console.error("获取版本信息失败:", error);
      }
    } else {
      console.warn("Electron API不可用");
      setElectronInfo({
        nodeVersion: "Electron API不可用",
        chromeVersion: "Electron API不可用",
        electronVersion: "Electron API不可用",
        backendPort: "Electron API不可用",
        apiStatus: "Electron API不可用",
      });
    }
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 space-y-5"
      >
        <div className="grid gap-3">
          <div className="p-4 bg-card border rounded-lg shadow-sm">
            <h3 className="text-lx font-semibold mb-2">HDC 配置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    自动检测 HDC 路径
                  </label>
                  <p className="text-xs text-muted-foreground">
                    系统将自动搜索并配置 HDC 工具路径
                  </p>
                </div>
                <Checkbox
                  id="hdcAutoDetect"
                  className="w-5 h-5"
                  checked={settings.hdcAutoDetect}
                  onClick={() => {
                    setSettings({
                      ...settings,
                      hdcAutoDetect: !settings.hdcAutoDetect,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">工具路径</label>
                <div className="flex gap-2  mt-1">
                  <div className="flex-1 relative">
                    <Input
                      value={settings.hdcPath}
                      onChange={(e) => {
                        setSettings({ ...settings, hdcPath: e.target.value });
                      }}
                      disabled={settings.hdcAutoDetect}
                      placeholder="/usr/local/bin/hdc"
                      className="h-8"
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm">安装指引</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl bg-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>HDC 安装指引</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="text-left space-y-4">
                            <div>
                              <h4 className="font-medium text-foreground mb-2">
                                安装步骤：
                              </h4>
                              <ol className="list-decimal list-inside space-y-2 text-sm">
                                <li>下载并安装 DevEco Studio 开发工具</li>
                                <li>
                                  安装完成后，HDC 工具位于 SDK 目录下的
                                  toolchains 文件夹
                                </li>
                                <li>将 HDC 路径添加到系统环境变量中</li>
                                <li>
                                  在终端中运行{" "}
                                  <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                                    hdc version
                                  </code>{" "}
                                  验证安装
                                </li>
                              </ol>
                            </div>

                            <div>
                              <h4 className="font-medium text-foreground mb-2">
                                常见 HDC 路径：
                              </h4>
                              <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
                                <div>
                                  <p className="font-medium">Windows:</p>
                                  <code className="text-xs font-mono break-all">
                                    C:\Users\[username]\AppData\Local\OpenHarmony\Sdk\toolchains\hdc.exe
                                  </code>
                                </div>
                                <div>
                                  <p className="font-medium">macOS:</p>
                                  <code className="text-xs font-mono break-all">
                                    /Users/[username]/Library/OpenHarmony/Sdk/toolchains/hdc
                                  </code>
                                </div>
                                <div>
                                  <p className="font-medium">Linux:</p>
                                  <code className="text-xs font-mono break-all">
                                    /home/[username]/OpenHarmony/Sdk/toolchains/hdc
                                  </code>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <p className="text-sm font-mono text-yellow-800 dark:text-yellow-200">
                                <strong>提示：</strong>如果您已经安装了 DevEco
                                Studio，可以尝试使用&#34;自动检测&#34;功能来自动配置
                                HDC 路径。
                              </p>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction className="h-8">
                          我知道了
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {/*{hdcPathValid === false && (*/}
                {/*  <p className="text-xs text-red-600 dark:text-red-400">*/}
                {/*    HDC 路径无效或工具未安装，请检查路径是否正确*/}
                {/*  </p>*/}
                {/*)}*/}
                {/*{hdcPathValid === true && (*/}
                {/*  <p className="text-xs text-green-600 dark:text-green-400">*/}
                {/*    HDC 工具验证成功，可以正常使用*/}
                {/*  </p>*/}
                {/*)}*/}
              </div>
            </div>
          </div>

          {/* 系统信息 */}
          <div className="p-4 bg-card border rounded-lg shadow-sm">
            <h3 className="text-lx font-semibold mb-2">系统信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Node.js版本:</span>
                <span>{electronInfo.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>Chrome版本:</span>
                <span>{electronInfo.chromeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>Electron版本:</span>
                <span>{electronInfo.electronVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>后端端口:</span>
                <span>{electronInfo.backendPort}</span>
              </div>
              <div className="flex justify-between">
                <span>API状态:</span>
                <span
                  className={
                    electronInfo.apiStatus === "API连接正常"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {electronInfo.apiStatus}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card border rounded-lg shadow-sm">
            <h3 className="text-lx font-semibold mb-2">系统更新</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">当前版本: v1.0.7</p>
                  <p className="text-xs text-muted-foreground">
                    最后更新: 2025-10-14 14:30
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowUpdateDialog(true)}>
                  检查更新
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="sm" onClick={() => saveSettings()}>
              保存设置
            </Button>
            <Button size="sm" variant="outline">
              重置默认
            </Button>
          </div>
        </div>
      </motion.div>
      <UpdateDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
      />
    </>
  );
}
