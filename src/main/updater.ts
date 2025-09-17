import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain, app } from "electron";
import log from "electron-log";

// --- 类型定义 ---
export interface UpdateStatus {
  status:
    | "checking"
    | "update-available"
    | "downloading"
    | "progress"
    | "ready"
    | "up-to-date"
    | "error";
  message: string;
  // 可以添加版本信息
  versionInfo?: { version: string; releaseDate: string; releaseNotes?: string };
  progress?: number; // 0-100
}

// --- 状态发送函数 ---
let mainWindow: BrowserWindow;

function sendStatusToWindow(status: UpdateStatus) {
  log.info("🚢 ~ 主进程检测更新 Updater Status:", status);
  mainWindow?.webContents.send("update-status", status);
}

// --- 初始化函数 ---
export function initializeAutoUpdater(win: BrowserWindow) {
  mainWindow = win;

  // --- 日志配置 ---
  log.transports.file.level = "info";
  autoUpdater.logger = log;

  // 是否自动下载更新
  autoUpdater.autoDownload = false;
  // 允许降级更新（应付回滚的情况）
  autoUpdater.allowDowngrade = true;
  // 开启开发环境调试，后边会有说明
  autoUpdater.forceDevUpdateConfig = true;

  // 监听升级失败事件
  autoUpdater.on("error", (err) => {
    log.error("🚢 ~ 主进程检测更新 ~ 监听升级失败事件:", err);
    sendStatusToWindow({
      status: "error",
      message: `更新出错: ${err.message || err.toString()}`,
    });
  });

  // 监听发现可用更新事件
  autoUpdater.on("update-available", (info) => {
    log.info(
      `🚢 ~ 主进程检测更新 ~ 监听发现可用更新事件 Update available: ${info}`,
    );
    sendStatusToWindow({
      status: "update-available",
      message: `发现新版本 v${info.version}！`,
      versionInfo: {
        version: info.version,
        releaseDate: info.releaseDate,
      },
    });
  });

  // 监听没有可用更新事件
  autoUpdater.on("update-not-available", (info) => {
    log.info("🚢 ~ 主进程检测更新 ~ 监听没有可用更新事件:", info);
    sendStatusToWindow({
      status: "up-to-date",
      message: `当前已是最新版本 (v${app.getVersion()})`,
      versionInfo: {
        version: app.getVersion(),
        releaseDate: info.releaseDate,
      },
    });
  });

  // 更新下载进度事件
  autoUpdater.on("download-progress", (progressObj) => {
    log.info("🚀 ~ 主进程检测更新 ~ 更新下载进度事件:", progressObj);
    const progress = Math.round(progressObj.percent);
    sendStatusToWindow({
      status: "progress",
      message: `下载进度: ${progress}%`,
      progress,
    });
  });

  // 监听下载完成事件
  autoUpdater.on("update-downloaded", (info) => {
    log.info("🚀 ~ 主进程检测更新 ~ 监听更新下载完成事件:", info);
    sendStatusToWindow({
      status: "ready",
      message: `新版本 v${info.version} 已下载完成`,
    });
  });

  // --- 事件监听 ---
  autoUpdater.on("checking-for-update", () => {
    sendStatusToWindow({ status: "checking", message: "正在检查更新..." });
  });

  // --- 获取应用版本 ---
  ipcMain.handle("app-version", () => {
    return app.getVersion();
  });

  // --- IPC 监听：处理用户对更新提示的响应 ---
  ipcMain.handle(
    "user-response-to-update",
    async (_event, action: "download" | "cancel") => {
      log.info("🚀 ~ 主进程检测更新 ~ 用户对更新提示的响应:", action);
      if (action === "download") {
        try {
          // 用户选择下载，开始下载更新
          await autoUpdater.downloadUpdate();
        } catch (error) {
          log.error("Error starting download:", error);
          sendStatusToWindow({
            status: "error",
            message: `启动下载失败: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      } else {
        // 用户选择取消，可以记录日志或发送确认消息
        log.info("User cancelled the update.");
        // 可以选择发送一个状态确认取消，或者不做任何事
        // 这里我们简单地发一个 up-to-date 状态来关闭提示
        sendStatusToWindow({ status: "up-to-date", message: "已取消本次更新" });
      }
    },
  );

  // --- IPC 监听：处理用户选择立即安装 (下载完成后) ---
  ipcMain.handle("install-update-now", async () => {
    log.info("User chose to install update now.");
    // 确保在安装前保存任何用户数据
    // 可以添加一个短暂的延迟，让UI有时间显示"正在安装"消息
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 500);
  });

  // 接收渲染进程消息，开始检查更新
  ipcMain.handle("check-for-update", async () => {
    log.info("🚀 ~ 主进程检测更新 ~ 手动检查更新");
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error("Error during manual check:", error);
      sendStatusToWindow({
        status: "error",
        message: `检查更新失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  });

  // --- 启动时自动检查 ---
  // setTimeout(() => {
  //   autoUpdater.checkForUpdates();
  // }, 5000);
}
