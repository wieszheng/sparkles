import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Info,
  Loader2,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import defaultIcon from "../assets/icon.png";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Application {
  bundleName: string;
  versionName: string;
  icon: string;
  label: string;
  system: boolean;
  apiTargetVersion: number;
  vendor: string;
  installTime: number;
  releaseType: string;
  mainAbility?: string;
}

export function Application({
  selectedDevice,
  action,
}: {
  selectedDevice: string;
  action: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false);
  const [appToUninstall, setAppToUninstall] = useState<Application | null>(
    null,
  );

  // 加载应用数据
  const loadApplications = async () => {
    if (!selectedDevice) {
      setApplications([]);
      return;
    }

    setLoading(true);
    try {
      // 根据选择的分类获取应用包列表
      // const system =
      //   selectedCategory === "system"
      //     ? true
      //     : selectedCategory === "user"
      //       ? false
      //       : undefined;

      const bundleNames = await window.api.getBundles(selectedDevice, false);

      if (bundleNames.length > 0) {
        // 获取应用详细信息
        const bundleInfos = await window.api.getBundleInfos(
          selectedDevice,
          bundleNames,
        );
        setApplications(bundleInfos);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("加载应用数据失败:", error);
      toast.error("加载应用数据失败");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDevice) {
      loadApplications();
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (!action) {
      loadApplications();
    }
  }, [action]);

  const filteredApplications = applications.filter((app) => {
    return (
      app.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.bundleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAppInfo = (app: Application) => {
    console.log("查看应用信息:", app);
    toast.info(`应用信息: ${app.label} (${app.bundleName})`);
  };

  const handleStartApp = async (app: Application) => {
    if (!selectedDevice) {
      toast.error("请先选择设备");
      return;
    }

    try {
      await window.api.startBundle(
        selectedDevice,
        app.bundleName,
        app.mainAbility,
      );
      toast.success(`应用 ${app.label} 启动成功`);
    } catch (error) {
      console.error("启动应用失败:", error);
      toast.error(`启动应用失败: ${error}`);
    }
  };

  const handleStopApp = async (app: Application) => {
    if (!selectedDevice) {
      toast.error("请先选择设备");
      return;
    }

    try {
      await window.api.stopBundle(selectedDevice, app.bundleName);
      toast.success(`应用 ${app.label} 停止成功`);
    } catch (error) {
      console.error("停止应用失败:", error);
      toast.error(`停止应用失败: ${error}`);
    }
  };

  const handleUninstallApp = (app: Application) => {
    setAppToUninstall(app);
    setUninstallDialogOpen(true);
  };

  const confirmUninstallApp = async () => {
    if (!selectedDevice || !appToUninstall) {
      toast.error("请先选择设备");
      return;
    }
    try {
      await window.api.uninstallBundle(
        selectedDevice,
        appToUninstall.bundleName,
      );
      toast.success(`应用 ${appToUninstall.label} 卸载成功`);
      // 重新加载应用列表
      await loadApplications();
    } catch (error) {
      console.error("卸载应用失败:", error);
      toast.error(`卸载应用失败: ${error}`);
    } finally {
      setUninstallDialogOpen(false);
      setAppToUninstall(null);
    }
  };

  const cancelUninstallApp = () => {
    setUninstallDialogOpen(false);
    setAppToUninstall(null);
  };

  const handleCleanData = async (app: Application) => {
    if (!selectedDevice) {
      toast.error("请先选择设备");
      return;
    }

    try {
      await window.api.cleanBundleData(selectedDevice, app.bundleName);
      toast.success(`应用 ${app.label} 数据清理成功`);
    } catch (error) {
      console.error("清理应用数据失败:", error);
      toast.error(`清理应用数据失败: ${error}`);
    }
  };

  const handleCleanCache = async (app: Application) => {
    if (!selectedDevice) {
      toast.error("请先选择设备");
      return;
    }

    try {
      await window.api.cleanBundleCache(selectedDevice, app.bundleName);
      toast.success(`应用 ${app.label} 缓存清理成功`);
    } catch (error) {
      console.error("清理应用缓存失败:", error);
      toast.error(`清理应用缓存失败: ${error}`);
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 space-y-5"
      >
        {/* 设备选择和操作区域 */}
        <div className="space-y-4">
          {/* 搜索和筛选区域 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索应用名称或包名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-80"
              />
            </div>
            <div className="flex gap-2">
              {/*<Select*/}
              {/*  value={selectedCategory}*/}
              {/*  onValueChange={setSelectedCategory}*/}
              {/*>*/}
              {/*  <SelectTrigger className="w-[120px]">*/}
              {/*    <SelectValue placeholder="筛选" />*/}
              {/*  </SelectTrigger>*/}
              {/*  <SelectContent>*/}
              {/*    {categories.map((category) => (*/}
              {/*      <SelectItem key={category.value} value={category.value}>*/}
              {/*        {category.label}*/}
              {/*      </SelectItem>*/}
              {/*    ))}*/}
              {/*  </SelectContent>*/}
              {/*</Select>*/}
            </div>
          </div>
        </div>

        {/* 应用网格列表 */}
        {loading ? (
          <div className="text-center py-24 text-muted-foreground">
            <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm mb-2">正在加载应用...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {filteredApplications.map((app) => (
              <div key={app.bundleName} className="relative group">
                <div className="bg-card rounded-lg p-3">
                  {/* 右上角设置菜单 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleStartApp(app)}>
                        <Play className="h-4 w-4" />
                        启动应用
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStopApp(app)}>
                        <Square className="h-4 w-4" />
                        停止应用
                      </DropdownMenuItem>
                      <Separator className="my-1" />
                      <DropdownMenuItem onClick={() => handleAppInfo(app)}>
                        <Info className="h-4 w-4" />
                        应用信息
                      </DropdownMenuItem>
                      <Separator className="my-1" />
                      <DropdownMenuItem onClick={() => handleCleanData(app)}>
                        <RefreshCw className="h-4 w-4" />
                        清理数据
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCleanCache(app)}>
                        <RefreshCw className="h-4 w-4" />
                        清理缓存
                      </DropdownMenuItem>
                      <Separator className="my-1" />
                      <DropdownMenuItem
                        onClick={() => handleUninstallApp(app)}
                        className="text-destructive focus:text-destructiv"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        卸载应用
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* 应用图标和名称 */}
                  <div className="flex flex-col items-center space-y-2">
                    {/* 应用图标 */}
                    <img
                      src={app.icon || defaultIcon}
                      alt={app.label}
                      className="w-12 h-12 "
                    />
                    {/* 应用名称 */}
                    <div className="text-center">
                      <div className="font-medium text-sm truncate max-w-[110px]">
                        {app.label}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs text-muted-foreground truncate max-w-[110px] cursor-help">
                            {app.bundleName}
                          </div>
                        </TooltipTrigger>

                        <TooltipContent side="bottom">
                          <p>{app.bundleName}</p>
                        </TooltipContent>
                      </Tooltip>
                      <div className="text-xs text-muted-foreground">
                        v{app.versionName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && filteredApplications.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-muted-foreground text-lg mb-2">
              未找到匹配的应用
            </div>
            <div className="text-sm text-muted-foreground">
              尝试调整搜索条件
            </div>
          </div>
        )}

        {/* 卸载应用确认对话框 */}
        <AlertDialog
          open={uninstallDialogOpen}
          onOpenChange={setUninstallDialogOpen}
        >
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>确认卸载应用</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要卸载应用 &#34;{appToUninstall?.label}&#34; (
                {appToUninstall?.bundleName}) 吗？
                此操作不可逆，将删除应用及其所有数据。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8" onClick={cancelUninstallApp}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmUninstallApp} className="h-8">
                确认
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </TooltipProvider>
  );
}
