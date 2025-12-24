/**
 * HiLog 日志采集模块
 * 基于 HarmonyOS HiLog 工具实现日志采集和管理
 */

import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getSettingsStore } from "../store";
import { shell } from "./utils";
import { getClient, selectedDeviceKey } from "./index";

/**
 * HiLog 日志级别
 */
export const enum HiLogLevel {
  DEBUG = "D",
  INFO = "I",
  WARN = "W",
  ERROR = "E",
  FATAL = "F",
}

/**
 * HiLog 日志类型
 */
export const enum HiLogType {
  APP = "app", // 应用日志
  CORE = "core", // 系统日志
  INIT = "init", // 启动日志
  KMSG = "kmsg", // 内核日志
}

/**
 * HiLog 采集配置
 */
export interface HiLogCaptureConfig {
  /** 设备连接键 */
  connectKey: string;
  /** 保存路径 */
  savePath: string;
  /** 日志类型 */
  type?: HiLogType[];
  /** 日志级别过滤 */
  level?: HiLogLevel[];
  /** Domain ID 过滤 */
  domain?: string[];
  /** Tag 过滤 */
  tag?: string[];
  /** 进程 ID 过滤 */
  pid?: number[];
  /** 正则表达式过滤 */
  regex?: string;
  /** 显示格式 */
  format?: {
    color?: boolean;
    time?: "time" | "epoch" | "monotonic";
    precision?: "msec" | "usec" | "nsec";
    year?: boolean;
    zone?: boolean;
  };
  /** 是否非阻塞读取（读完退出） */
  exit?: boolean;
  /** 只显示前 n 行 */
  head?: number;
  /** 只显示后 n 行 */
  tail?: number;
  /** 日志轮转配置 */
  rotation?: {
    /** 轮转间隔（毫秒），默认 5 分钟 */
    interval?: number;
    /** 最大保留文件数，默认 10 */
    maxFiles?: number;
    /** 是否压缩旧文件，默认 false */
    compress?: boolean;
  };
}

/**
 * HiLog 落盘配置
 */
export interface HiLogPersistConfig {
  /** 文件名 */
  filename: string;
  /** 单文件大小（字节），最小 64K */
  fileSize: number;
  /** 文件数量 */
  fileCount: number;
  /** 压缩算法 */
  compression?: "none" | "zlib";
  /** 任务 ID */
  jobId?: number;
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
 * 构建 hilog 命令参数
 */
function buildHiLogArgs(config: HiLogCaptureConfig): string[] {
  const args: string[] = [];

  // 非阻塞读取
  if (config.exit) {
    args.push("-x");
  }

  // 只显示前 n 行
  if (config.head !== undefined) {
    args.push("-a", config.head.toString());
  }

  // 只显示后 n 行
  if (config.tail !== undefined) {
    args.push("-z", config.tail.toString());
  }

  // 日志类型
  if (config.type && config.type.length > 0) {
    config.type.forEach((type) => {
      args.push("-t", type);
    });
  }

  // 日志级别
  if (config.level && config.level.length > 0) {
    args.push("-L", config.level.join("/"));
  }

  // Domain 过滤
  if (config.domain && config.domain.length > 0) {
    config.domain.forEach((domain) => {
      args.push("-D", domain);
    });
  }

  // Tag 过滤
  if (config.tag && config.tag.length > 0) {
    config.tag.forEach((tag) => {
      args.push("-T", tag);
    });
  }

  // PID 过滤
  if (config.pid && config.pid.length > 0) {
    config.pid.forEach((pid) => {
      args.push("-P", pid.toString());
    });
  }

  // 正则表达式过滤
  if (config.regex) {
    args.push("-e", config.regex);
  }

  // 显示格式
  if (config.format) {
    const formatArgs: string[] = [];
    if (config.format.color) formatArgs.push("color");
    if (config.format.time) formatArgs.push(config.format.time);
    if (config.format.precision) formatArgs.push(config.format.precision);
    if (config.format.year) formatArgs.push("year");
    if (config.format.zone) formatArgs.push("zone");

    if (formatArgs.length > 0) {
      formatArgs.forEach((fmt) => {
        args.push("-v", fmt);
      });
    }
  }

  return args;
}

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
 * 压缩日志文件（可选）
 */
async function compressLogFile(filePath: string): Promise<void> {
  try {
    const zlib = require("zlib");
    const gzip = zlib.createGzip();
    const source = fs.createReadStream(filePath);
    const destination = fs.createWriteStream(`${filePath}.gz`);

    await new Promise((resolve, reject) => {
      source
        .pipe(gzip)
        .pipe(destination)
        .on("finish", resolve)
        .on("error", reject);
    });

    // 删除原文件
    fs.unlinkSync(filePath);
    console.log(`[HiLog] Compressed log file: ${filePath}.gz`);
  } catch (error) {
    console.error("[HiLog] Failed to compress log file:", error);
  }
}

/**
 * 执行日志轮转
 */
function rotateLogFile(task: HiLogCaptureTask): void {
  try {
    console.log(`[HiLog] Rotating log file for task: ${task.taskId}`);

    // 关闭当前文件流
    if (task.fileStream) {
      task.fileStream.end();
    }

    // 可选：压缩旧文件
    if (task.config.rotation?.compress) {
      const currentFile = getRotatedFilePath(
        task.baseFilePath,
        task.currentFileIndex,
      );
      void compressLogFile(currentFile);
    }

    // 增加文件索引
    task.currentFileIndex++;

    // 创建新文件流
    const newFilePath = getRotatedFilePath(
      task.baseFilePath,
      task.currentFileIndex,
    );
    task.fileStream = fs.createWriteStream(newFilePath, { flags: "a" });

    // 重新连接进程输出到新文件
    task.process.stdout?.unpipe();
    task.process.stdout?.pipe(task.fileStream);

    console.log(`[HiLog] Rotated to new log file: ${newFilePath}`);

    // 清理旧文件
    const maxFiles = task.config.rotation?.maxFiles || 10;
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
  config: HiLogCaptureConfig,
): { success: boolean; message?: string } {
  // 检查是否已存在相同任务
  if (activeTasks.has(taskId)) {
    return { success: false, message: "任务已存在" };
  }

  try {
    const store = getSettingsStore();
    const settings = store.get("systemSettings");
    const { hdcPath } = settings;

    // 确保保存目录存在
    const saveDir = path.dirname(config.savePath);
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // 日志轮转配置
    const rotationInterval = config.rotation?.interval || 5 * 60 * 1000; // 默认 5 分钟
    const useRotation = !config.exit && rotationInterval > 0; // 非阻塞模式才启用轮转

    // 初始文件路径（如果启用轮转，使用带索引的文件名）
    const baseFilePath = config.savePath;
    const initialFilePath = useRotation
      ? getRotatedFilePath(baseFilePath, 0)
      : baseFilePath;

    // 构建命令参数
    const hilogArgs = buildHiLogArgs(config);
    const args = ["-t", selectedDeviceKey, "shell", "hilog"];

    console.log("[HiLog] Starting capture:", args.join(" "));
    if (useRotation) {
      console.log(
        `[HiLog] Log rotation enabled: interval=${rotationInterval}ms, maxFiles=${config.rotation?.maxFiles || 10}`,
      );
    }

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
    if (useRotation) {
      task.rotationTimer = setInterval(() => {
        rotateLogFile(task);
      }, rotationInterval);

      console.log(
        `[HiLog] Rotation timer set for task ${taskId}, interval: ${rotationInterval}ms`,
      );
    }

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

/**
 * 获取 HiLog 采集状态
 */
export function getHiLogCaptureStatus(taskId: string): {
  isRunning: boolean;
  pid?: number;
  startTime?: number;
  duration?: number;
} {
  const task = activeTasks.get(taskId);
  if (!task) {
    return { isRunning: false };
  }

  return {
    isRunning: true,
    pid: task.process.pid,
    startTime: task.startTime,
    duration: Date.now() - task.startTime,
  };
}

/**
 * 获取所有活动的 HiLog 采集任务
 */
export function getAllHiLogCaptureTasks(): string[] {
  return Array.from(activeTasks.keys());
}

/**
 * 清除 HiLog buffer
 */
export async function clearHiLogBuffer(
  connectKey: string,
  type?: HiLogType[],
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const args = ["-r"];

    if (type && type.length > 0) {
      type.forEach((t) => {
        args.push("-t", t);
      });
    }

    const cmd = `hilog ${args.join(" ")}`;
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 查询 HiLog buffer 大小
 */
export async function getHiLogBufferSize(
  connectKey: string,
  type?: HiLogType[],
): Promise<{ success: boolean; size?: string; message?: string }> {
  try {
    const client = getClient();
    const args = ["-g"];

    if (type && type.length > 0) {
      type.forEach((t) => {
        args.push("-t", t);
      });
    }

    const cmd = `hilog ${args.join(" ")}`;
    const result = await shell(client, connectKey, cmd);

    return { success: true, size: String(result) };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 设置 HiLog buffer 大小
 */
export async function setHiLogBufferSize(
  connectKey: string,
  size: string,
  type?: HiLogType[],
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const args = ["-G", size];

    if (type && type.length > 0) {
      type.forEach((t) => {
        args.push("-t", t);
      });
    }

    const cmd = `hilog ${args.join(" ")}`;
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 查询 HiLog 落盘任务
 */
export async function queryHiLogPersist(connectKey: string): Promise<{
  success: boolean;
  tasks?: string;
  message?: string;
}> {
  try {
    const client = getClient();
    const cmd = "hilog -w query";
    const result = await shell(client, connectKey, cmd);

    return { success: true, tasks: String(result) };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 启动 HiLog 落盘任务
 */
export async function startHiLogPersist(
  connectKey: string,
  config: HiLogPersistConfig,
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const args = ["-w", "start"];

    // 文件名
    args.push("-f", config.filename);

    // 文件大小
    args.push("-l", config.fileSize.toString());

    // 文件数量
    args.push("-n", config.fileCount.toString());

    // 压缩算法
    if (config.compression) {
      args.push("-m", config.compression);
    }

    // 任务 ID
    if (config.jobId !== undefined) {
      args.push("-j", config.jobId.toString());
    }

    const cmd = `hilog ${args.join(" ")}`;
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 停止 HiLog 落盘任务
 */
export async function stopHiLogPersist(
  connectKey: string,
  jobId?: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const args = ["-w", "stop"];

    if (jobId !== undefined) {
      args.push("-j", jobId.toString());
    }

    const cmd = `hilog ${args.join(" ")}`;
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 刷新 HiLog 缓冲区到落盘文件
 */
export async function refreshHiLogPersist(
  connectKey: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const cmd = "hilog -w refresh";
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 清除已落盘的日志文件
 */
export async function clearHiLogPersistFiles(
  connectKey: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const cmd = "hilog -w clear";
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 设置日志基础级别
 */
export async function setHiLogBaseLevel(
  connectKey: string,
  level: HiLogLevel,
  options?: {
    domain?: string;
    tag?: string;
    persist?: boolean;
  },
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const args = ["-b", level];

    if (options?.domain) {
      args.push("-D", options.domain);
    }

    if (options?.tag) {
      args.push("-T", options.tag);
    }

    if (options?.persist) {
      args.push("--persist");
    }

    const cmd = `hilog ${args.join(" ")}`;
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 获取 HiLog 统计信息
 */
export async function getHiLogStatistics(
  connectKey: string,
  type?: HiLogType[],
  domain?: string[],
): Promise<{ success: boolean; stats?: string; message?: string }> {
  try {
    const client = getClient();
    const args = ["-s"];

    if (type && type.length > 0) {
      type.forEach((t) => {
        args.push("-t", t);
      });
    }

    if (domain && domain.length > 0) {
      domain.forEach((d) => {
        args.push("-D", d);
      });
    }

    const cmd = `hilog ${args.join(" ")}`;
    const result = await shell(client, connectKey, cmd);

    return { success: true, stats: String(result) };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 清除 HiLog 统计信息
 */
export async function clearHiLogStatistics(
  connectKey: string,
  type?: HiLogType[],
  domain?: string[],
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = getClient();
    const args = ["-S"];

    if (type && type.length > 0) {
      type.forEach((t) => {
        args.push("-t", t);
      });
    }

    if (domain && domain.length > 0) {
      domain.forEach((d) => {
        args.push("-D", d);
      });
    }

    const cmd = `hilog ${args.join(" ")}`;
    await shell(client, connectKey, cmd);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// 导出旧版本兼容接口
export const startCapture = (connectKey: string, savePath: string) => {
  return startHiLogCapture(`legacy-${Date.now()}`, {
    connectKey,
    savePath,
  });
};

export const stopCapture = () => {
  // 停止所有任务
  activeTasks.forEach((_, taskId) => {
    stopHiLogCapture(taskId);
  });
};

export const getStatus = () => {
  const tasks = Array.from(activeTasks.values());
  return {
    isRunning: tasks.length > 0,
    pid: tasks[0]?.process.pid,
  };
};
