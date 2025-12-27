import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { loadSystemSettings } from "../store.ts";
import { app } from "electron";

/**
 * HiLog 采集配置
 */
export interface HiLogCaptureConfig {
  /** 是否开启 */
  enabled?: boolean;
  /** 轮转间隔（毫秒），默认 5 分钟 */
  rotationInterval?: number;
  /** 最大保留文件数，默认 10 */
  maxFiles?: number;
}

/**
 * HiLog 采集任务
 */
interface HiLogCaptureTask {
  taskId: string;
  process: ChildProcess;
  fileStream: fs.WriteStream;
  config: HiLogCaptureConfig;
  startTime: number;
  // 日志轮转相关
  rotationTimer?: NodeJS.Timeout;
  currentFileIndex: number;
  baseFilePath: string;
}

// 活动的日志采集任务
const activeTasks = new Map<string, HiLogCaptureTask>();

/**
 * 生成轮转后的文件路径
 */
function getRotatedFilePath(baseFilePath: string, index: number): string {
  const ext = path.extname(baseFilePath);
  const nameWithoutExt = baseFilePath.slice(0, -ext.length);
  return `${nameWithoutExt}.${index}${ext}`;
}

/**
 * 清理旧的日志文件
 */
function cleanupOldLogFiles(
  baseFilePath: string,
  currentIndex: number,
  maxFiles: number,
): void {
  try {
    const dir = path.dirname(baseFilePath);
    const ext = path.extname(baseFilePath);
    const baseName = path.basename(baseFilePath, ext);

    // 删除超过最大数量的文件
    for (let i = currentIndex - maxFiles; i >= 0; i--) {
      const oldFile = path.join(dir, `${baseName}.${i}${ext}`);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log(`[HiLog] Deleted old log file: ${oldFile}`);
      }
    }
  } catch (error) {
    console.error("[HiLog] Failed to cleanup old log files:", error);
  }
}

/**
 * 执行日志轮转
 */
function rotateLogFile(task: HiLogCaptureTask): void {
  try {
    console.log(`[HiLog] Rotating log file for task: ${task.taskId}`);

    // 保存当前文件流的引用
    const oldFileStream = task.fileStream;

    // 创建新文件流
    task.currentFileIndex++;
    const newFilePath = getRotatedFilePath(
      task.baseFilePath,
      task.currentFileIndex,
    );
    const newFileStream = fs.createWriteStream(newFilePath, { flags: "a" });

    // 先切换到新流，再结束旧流
    task.process.stdout?.unpipe(oldFileStream);
    task.process.stdout?.pipe(newFileStream);

    // 更新任务中的文件流引用
    task.fileStream = newFileStream;

    // 安全地结束旧流
    if (!oldFileStream.writableEnded) {
      oldFileStream.end();
    }

    console.log(`[HiLog] Rotated to new log file: ${newFilePath}`);

    // 清理旧文件
    const maxFiles = task.config?.maxFiles || 10;
    cleanupOldLogFiles(task.baseFilePath, task.currentFileIndex, maxFiles);
  } catch (error) {
    console.error("[HiLog] Failed to rotate log file:", error);
  }
}

/**
 * 开始 HiLog 采集
 */
export function startHiLogCapture(
  taskId: string,
  config: {
    enabled?: boolean;
    rotationInterval?: number;
    maxFiles?: number;
    connectKey: string;
    savePath: string;
  },
): { success: boolean; message?: string } {
  // 检查是否已存在相同任务
  if (activeTasks.has(taskId)) {
    return { success: false, message: "任务已存在" };
  }

  try {
    const settings = loadSystemSettings();
    let { hdcPath } = settings;
    if (settings.hdcAutoDetect) {
      const platform = process.platform;
      const isWin = platform === "win32";
      const executableName = isWin ? "hdc.exe" : "hdc";
      if (app.isPackaged) {
        hdcPath = path.join(process.resourcesPath, "bin", executableName);
      } else {
        hdcPath = path.resolve(
          __dirname,
          "../../resources/bin",
          executableName,
        );
      }
    }

    // 确保保存目录存在
    const saveDir = path.dirname(config.savePath);
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // 日志轮转配置
    const rotationInterval = (config?.rotationInterval || 5) * 60 * 1000; // 默认 5 分钟
    console.log("[HiLog] Starting rotationInterval:", config?.rotationInterval);
    // 初始文件路径（如果启用轮转，使用带索引的文件名）
    const baseFilePath = config.savePath;
    const initialFilePath = getRotatedFilePath(baseFilePath, 0);

    // 构建命令参数
    const args = ["-t", config.connectKey, "shell", "hilog"];

    console.log("[HiLog] Starting capture:", args.join(" "));

    // 启动进程
    const logProcess = spawn(hdcPath, args);
    const fileStream = fs.createWriteStream(initialFilePath, { flags: "a" });

    // 将输出写入文件
    logProcess.stdout?.pipe(fileStream);

    // 错误处理
    logProcess.stderr?.on("data", (data) => {
      console.error("[HiLog] Error:", data.toString());
    });

    logProcess.on("error", (err) => {
      console.error("[HiLog] Process error:", err);
      stopHiLogCapture(taskId);
    });

    logProcess.on("exit", (code) => {
      console.log(`[HiLog] Process exited with code ${code}`);
      stopHiLogCapture(taskId);
    });

    // 创建任务对象
    const task: HiLogCaptureTask = {
      taskId,
      process: logProcess,
      fileStream,
      config,
      startTime: Date.now(),
      currentFileIndex: 0,
      baseFilePath,
    };

    // 设置日志轮转定时器
    task.rotationTimer = setInterval(() => {
      rotateLogFile(task);
    }, rotationInterval);

    console.log(
      `[HiLog] Rotation timer set for task ${taskId}, interval: ${rotationInterval}ms`,
    );

    // 保存任务信息
    activeTasks.set(taskId, task);

    return { success: true };
  } catch (error) {
    console.error("[HiLog] Start capture error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 停止 HiLog 采集
 */
export function stopHiLogCapture(taskId: string): {
  success: boolean;
  message?: string;
} {
  const task = activeTasks.get(taskId);
  if (!task) {
    return { success: false, message: "任务不存在" };
  }

  try {
    // 清除轮转定时器
    if (task.rotationTimer) {
      clearInterval(task.rotationTimer);
      console.log(`[HiLog] Cleared rotation timer for task: ${taskId}`);
    }

    // 终止进程
    if (task.process && !task.process.killed) {
      task.process.kill();
    }

    // 关闭文件流
    if (task.fileStream) {
      task.fileStream.end();
    }

    activeTasks.delete(taskId);
    console.log(`[HiLog] Stopped capture for task: ${taskId}`);

    return { success: true };
  } catch (error) {
    console.error("[HiLog] Stop capture error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
