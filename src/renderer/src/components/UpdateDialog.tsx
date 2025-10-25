import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { X, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface UpdateStatus {
  status:
    | "checking"
    | "update-available"
    | "downloading"
    | "progress"
    | "ready"
    | "up-to-date"
    | "error";
  message: string;
  versionInfo?: { version: string; releaseDate: string; releaseNotes?: string };
  progress?: number;
}

export function UpdateDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // 状态管理
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

  // 当对话框打开时自动检查更新
  useEffect(() => {
    if (isOpen) {
      handleCheckUpdate();
    }
  }, [isOpen]);

  // 监听更新状态变化
  useEffect(() => {
    const handleUpdateStatus = (status: UpdateStatus) => {
      console.log("Received update status:", status);

      // 防止状态回退的保护逻辑
      // if (updateStatus?.status === "ready" && status.status === "downloading") {
      //   console.log("Ignoring downloading status after ready state");
      //   return;
      // }

      // 当进度达到100%时，自动转换为ready状态
      // if (status.status === "progress" && status.progress === 100) {
      //   setUpdateStatus({
      //     ...status,
      //     status: "ready",
      //     message: "更新下载完成，准备安装...",
      //   });
      //   return;
      // }

      setUpdateStatus(status);
    };

    if (window.api?.onUpdateStatus) {
      window.api.onUpdateStatus(handleUpdateStatus);
    }

    return () => {
      if (window.api?.removeUpdateStatusListener) {
        window.api.removeUpdateStatusListener(handleUpdateStatus);
      }
    };
  }, []);

  // 检查更新函数 - 增加防抖和错误处理
  const handleCheckUpdate = async () => {
    if (updateStatus?.status === "checking") {
      console.log("Update check already in progress");
      return;
    }

    setUpdateStatus({ status: "checking", message: "正在检查更新..." });

    try {
      await window.api.checkForUpdate();
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setUpdateStatus({
        status: "error",
        message: `检查更新失败：${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  // 处理用户对更新提示的响应
  const handlePromptResponse = async (action: "download" | "cancel") => {
    try {
      if (action === "download" && updateStatus?.versionInfo) {
        setUpdateStatus({
          status: "downloading",
          message: `开始下载新版本 v${updateStatus.versionInfo.version}...`,
          versionInfo: updateStatus.versionInfo,
        });
      } else {
        onClose();
        setUpdateStatus({ status: "up-to-date", message: "已取消本次更新" });
      }

      window.api.respondToUpdatePrompt(action);
    } catch (error) {
      console.error(`Failed to send ${action} response:`, error);
      setUpdateStatus({
        status: "error",
        message: `操作失败：${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };
  // 处理立即安装更新
  const handleInstallNow = async () => {
    try {
      setUpdateStatus((prev) =>
        prev
          ? {
              ...prev,
              message: "正在安装更新，请稍候...",
            }
          : null,
      );

      await window.api.installUpdateNow();
    } catch (error) {
      console.error("Failed to install update now:", error);
      setUpdateStatus({
        status: "error",
        message: `安装更新失败：${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "checking":
        return <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />;
      case "update-available":
        return <Download className="w-8 h-8 text-green-500" />;
      case "downloading":
      case "progress":
        return <Download className="w-8 h-8 text-blue-500" />;
      case "ready":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "up-to-date":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <RefreshCw className="w-8 h-8 text-gray-500" />;
    }
  };

  // 统一的错误处理UI
  const renderErrorUI = () => (
    <div className="text-center py-2">
      <div className="flex justify-center mb-3">
        {getStatusIcon(updateStatus?.status || "error")}
      </div>
      <p className="font-medium mb-2">操作失败</p>
      <p className="text-sm text-muted-foreground mb-4 min-h-[3rem] flex items-center justify-center">
        {updateStatus?.message}
      </p>
      <div className="flex gap-2 justify-center">
        <Button onClick={handleCheckUpdate} size="sm">
          重新检查
        </Button>
      </div>
    </div>
  );
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-[28rem] max-w-[90vw] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">系统更新</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 检查更新状态 */}
        {updateStatus?.status === "checking" && (
          <div className="text-center py-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground mb-2">
              {updateStatus.message}
            </p>
          </div>
        )}

        {/* 发现更新状态 */}
        {updateStatus?.status === "update-available" &&
          updateStatus.versionInfo && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {getStatusIcon("update-available")}
                </div>
                <p className="text-sm text-muted-foreground mb-1">发现新版本</p>
                <p className="text-xl font-bold text-green-600">
                  v{updateStatus.versionInfo.version}
                </p>
                {/*<div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">*/}
                {/*  {updateStatus.versionInfo.releaseDate && (*/}
                {/*    <span>发布: {updateStatus.versionInfo.releaseDate}</span>*/}
                {/*  )}*/}
                {/*</div>*/}
              </div>

              {/* 更新内容显示 */}
              {updateStatus.versionInfo.releaseNotes && (
                <div className="max-h-40 overflow-y-auto p-3 bg-muted/30 rounded-lg border">
                  <h4 className="font-medium mb-2">更新内容：</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {updateStatus.versionInfo.releaseNotes}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => handlePromptResponse("download")}
                  className="w-40"
                  size="sm"
                >
                  立即更新
                </Button>
                <Button
                  onClick={() => handlePromptResponse("cancel")}
                  variant="outline"
                  size="sm"
                >
                  稍后提醒
                </Button>
              </div>
            </div>
          )}

        {/* 下载进度状态 */}
        {(updateStatus?.status === "downloading" ||
          updateStatus?.status === "progress") && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                {getStatusIcon("downloading")}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                正在下载更新包...
              </p>

              <div className="space-y-3">
                <div className="w-full">
                  <Progress
                    value={updateStatus.progress || 0}
                    className="h-2 bg-muted"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  <span>{Math.round(updateStatus.progress || 0)}% 完成</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 更新准备就绪状态 */}
        {updateStatus?.status === "ready" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-3">
              {getStatusIcon("ready")}
            </div>
            <div>
              <p className="font-medium mb-2">更新下载完成</p>
              <p className="text-sm text-muted-foreground mb-4">
                点击下方按钮安装更新，应用将自动重启
              </p>
            </div>
            <Button onClick={handleInstallNow} size="sm">
              安装并重启
            </Button>
          </div>
        )}

        {/* 已是最新版本状态 */}
        {updateStatus?.status === "up-to-date" && (
          <div className="text-center py-4">
            <div className="flex justify-center mb-2">
              {getStatusIcon("up-to-date")}
            </div>
            <p className="font-medium mb-2">已是最新版本</p>
            <p className="text-sm text-muted-foreground">
              当前版本: {updateStatus.versionInfo?.version || "未知"}
            </p>
          </div>
        )}

        {/* 取消状态 */}
        {/*{updateStatus?.status === "cancelled" && (*/}
        {/*  <div className="text-center py-6">*/}
        {/*    <div className="flex justify-center mb-3">*/}
        {/*      <X className="w-5 h-5 text-orange-500" />*/}
        {/*    </div>*/}
        {/*    <p className="font-medium mb-2">更新已取消</p>*/}
        {/*    <p className="text-sm text-muted-foreground mb-4">*/}
        {/*      {updateStatus.message}*/}
        {/*    </p>*/}
        {/*    <Button onClick={handleCheckUpdate} variant="outline" size="sm">*/}
        {/*      重新检查更新*/}
        {/*    </Button>*/}
        {/*  </div>*/}
        {/*)}*/}

        {/* 错误状态 */}
        {updateStatus?.status === "error" && renderErrorUI()}
      </Card>
    </div>
  );
}
