import { promises as fs } from "fs";
import { join } from "path";
import { spawn, ChildProcess } from "child_process";
import { app, shell } from "electron";

import {
  SPDaemon,
  type SPDaemonOptions,
  type CalculatedMetrics,
} from "./sp-daemon";

import type { BrowserWindow } from "electron";
import { getClient, selectedDeviceKey } from ".";
import { loadSystemSettings } from "../store.ts";
import path from "path";

// 任务数据目录
const WUKONG_DATA_DIR = join(app.getPath("userData"), "wukong-tasks");

// Wukong 任务存储（从文件加载）
const wukongTasks = new Map<string, WukongTask>();

// 运行中的任务进程
const runningTasks = new Map<
  string,
  {
    process: ChildProcess | null;
    abortController: AbortController;
    monitoringTimer?: NodeJS.Timeout;
    outputBuffer: string;
    spDaemon?: SPDaemon;
  }
>();

const settings = loadSystemSettings();
let { hdcPath } = settings;
if (settings.hdcAutoDetect) {
  const platform = process.platform;
  const isWin = platform === "win32";
  const executableName = isWin ? "hdc.exe" : "hdc";
  if (app.isPackaged) {
    hdcPath = path.join(process.resourcesPath, "bin", executableName);
  } else {
    hdcPath = path.resolve(__dirname, "../../resources/bin", executableName);
  }
}

// 主窗口引用
let mainWindow: BrowserWindow | null = null;

/**
 * 设置主窗口引用
 */
export function setMainWindowForWukong(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * 发送实时输出到前端
 */
function sendOutputToRenderer(
  taskId: string,
  output: string,
  type: "stdout" | "stderr" = "stdout",
): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("wukong:output", {
      taskId,
      output,
      type,
      timestamp: Date.now(),
    });
  }
}

/**
 * 发送任务状态变化到前端
 */
function sendTaskStatusToRenderer(
  taskId: string,
  status: WukongTaskStatus,
): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("wukong:status", {
      taskId,
      status,
      timestamp: Date.now(),
    });
  }
}

/**
 * 确保数据目录存在
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(WUKONG_DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("[wukong] 创建数据目录失败:", error);
  }
}

/**
 * 获取任务目录路径
 */
function getTaskDir(taskId: string): string {
  return join(WUKONG_DATA_DIR, taskId);
}

/**
 * 确保任务目录存在
 */
async function ensureTaskDir(taskId: string): Promise<string> {
  const taskDir = getTaskDir(taskId);
  await fs.mkdir(taskDir, { recursive: true });
  return taskDir;
}

/**
 * 保存任务配置到文件
 */
async function saveTaskToFile(task: WukongTask): Promise<void> {
  await ensureDataDir();
  const taskDir = await ensureTaskDir(task.id);
  const configPath = join(taskDir, "task.json");
  await fs.writeFile(configPath, JSON.stringify(task, null, 2), "utf-8");
}

/**
 * 从文件加载任务
 */
async function loadTaskFromFile(taskId: string): Promise<WukongTask> {
  const taskDir = getTaskDir(taskId);
  const configPath = join(taskDir, "task.json");
  const content = await fs.readFile(configPath, "utf-8");
  return JSON.parse(content) as WukongTask;
}

/**
 * 加载所有任务
 */
async function loadAllTasks(): Promise<void> {
  try {
    await ensureDataDir();
    const entries = await fs.readdir(WUKONG_DATA_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const task = await loadTaskFromFile(entry.name);
        if (task) {
          wukongTasks.set(task.id, task);
        }
      }
    }
  } catch (error) {
    console.error("[wukong] 加载任务失败:", error);
  }
}

/**
 * 初始化：加载所有任务
 */
loadAllTasks().catch(console.error);

/**
 * 获取所有 wukong 任务
 */
export function getAllWukongTasks(): WukongTask[] {
  return Array.from(wukongTasks.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

/**
 * 获取单个 wukong 任务
 */
export function getWukongTask(taskId: string): WukongTask | undefined {
  return wukongTasks.get(taskId);
}

/**
 * 创建 wukong 任务
 */
export async function createWukongTask(config: {
  id: string;
  name: string;
  testType: WukongTestType;
  config: WukongExecConfig | WukongSpecialConfig | WukongFocusConfig;
  command?: string;
  packageName?: string;
  metrics?: string[];
}): Promise<WukongTask> {
  const task: WukongTask = {
    id: config.id,
    name: config.name,
    testType: config.testType,
    config: config.config,
    command: config.command,
    status: "idle",
    createdAt: Date.now(),
    reportPath: undefined,
    errorMessage: undefined,
    packageName: config.packageName,
    metrics: config.metrics || [],
  };

  wukongTasks.set(task.id, task);
  await saveTaskToFile(task);

  return task;
}

/**
 * 删除 wukong 任务
 */
export async function removeWukongTask(taskId: string): Promise<boolean> {
  const task = wukongTasks.get(taskId);
  if (task && task.status === "running") {
    await stopWukongTask(taskId);
  }

  wukongTasks.delete(taskId);

  // 删除任务目录
  try {
    const taskDir = getTaskDir(taskId);
    await fs.rm(taskDir, { recursive: true, force: true });
  } catch (error) {
    console.error("[wukong] 删除任务目录失败:", error);
  }

  return true;
}

/**
 * 保存性能监控数据到文件
 */
async function saveMetricsToFile(
  taskId: string,
  metrics: CalculatedMetrics,
): Promise<void> {
  try {
    const taskDir = await ensureTaskDir(taskId);
    const metricsFile = join(taskDir, "metrics.jsonl");

    // 转换为 MonitorSample 格式
    const sample: MonitorSample = {
      taskId,
      timestamp: metrics.timestamp,
      cpu: metrics.appCpuUsage,
      memory: metrics.appMemoryUsage,
      fps: metrics.fps,
      fpsStability: metrics.fpsStability,
      appCpuUsage: metrics.appCpuUsage,
      appMemoryUsage: metrics.appMemoryUsage,
      appMemoryPercent: metrics.appMemoryPercent,
      gpuLoad: metrics.gpuLoad,
      powerConsumption: metrics.powerConsumption,
      networkUpSpeed: metrics.networkUpSpeed,
      networkDownSpeed: metrics.networkDownSpeed,
      deviceTemperature: metrics.deviceTemperature,
      performanceScore: metrics.performanceScore,
    };

    const line = JSON.stringify(sample) + "\n";
    await fs.appendFile(metricsFile, line, "utf-8");
  } catch (error) {
    console.error("[wukong] 保存性能数据失败:", error);
  }
}

/**
 * 启动性能监控（直接使用 SPDaemon）
 */
function startPerformanceMonitoring(
  taskId: string,
  packageName: string,
  metrics: string[],
): void {
  const runningTask = runningTasks.get(taskId);
  if (!runningTask || runningTask.monitoringTimer) {
    return; // 已经在监控中
  }

  // 创建 SPDaemon 实例
  const spDaemon = new SPDaemon();
  spDaemon.resetNetworkStats();
  runningTask.spDaemon = spDaemon;

  // 构建监控选项
  const options: SPDaemonOptions = {
    N: 1, // 每次采样1次
    PKG: packageName,
    cpu: metrics.includes("cpu"),
    gpu: metrics.includes("gpu"),
    fps: metrics.includes("fps"),
    temperature: metrics.includes("temperature"),
    power: metrics.includes("power"),
    ram: metrics.includes("memory"),
    net: metrics.includes("network"),
  };

  // 定时采集性能数据（每秒一次）
  const timer = setInterval(async () => {
    if (runningTask.abortController.signal.aborted) {
      clearInterval(timer);
      return;
    }

    try {
      // 采集数据
      const rawData = await spDaemon.collect(options);

      // 计算指标
      const calculatedMetrics = spDaemon.calculateMetrics(rawData);

      if (calculatedMetrics) {
        // 保存到文件
        await saveMetricsToFile(taskId, calculatedMetrics);

        // 发送到前端
        if (mainWindow && !mainWindow.isDestroyed()) {
          const sample: MonitorSample = {
            taskId,
            timestamp: calculatedMetrics.timestamp,
            cpu: calculatedMetrics.appCpuUsage,
            memory: calculatedMetrics.appMemoryUsage,
            fps: calculatedMetrics.fps,
            fpsStability: calculatedMetrics.fpsStability,
            appCpuUsage: calculatedMetrics.appCpuUsage,
            appMemoryUsage: calculatedMetrics.appMemoryUsage,
            appMemoryPercent: calculatedMetrics.appMemoryPercent,
            gpuLoad: calculatedMetrics.gpuLoad,
            powerConsumption: calculatedMetrics.powerConsumption,
            networkUpSpeed: calculatedMetrics.networkUpSpeed,
            networkDownSpeed: calculatedMetrics.networkDownSpeed,
            deviceTemperature: calculatedMetrics.deviceTemperature,
            performanceScore: calculatedMetrics.performanceScore,
          };
          mainWindow.webContents.send("monitor:data", sample);
        }
      }
    } catch (error) {
      console.error("[wukong] 性能监控采集失败:", error);
    }
  }, 1000); // 每秒采集一次

  runningTask.monitoringTimer = timer;
}

/**
 * 停止性能监控
 */
function stopPerformanceMonitoring(taskId: string): void {
  const runningTask = runningTasks.get(taskId);
  if (runningTask?.monitoringTimer) {
    clearInterval(runningTask.monitoringTimer);
    runningTask.monitoringTimer = undefined;
    runningTask.spDaemon = undefined;
  }
}

/**
 * 启动 wukong 任务
 */
export async function startWukongTask(
  taskId: string,
): Promise<{ success: boolean; message?: string }> {
  const task = wukongTasks.get(taskId);
  if (!task) {
    return { success: false, message: "任务不存在" };
  }

  if (task.status === "running") {
    return { success: false, message: "任务正在运行中" };
  }

  try {
    const command = task.command;
    if (!command) {
      throw new Error("无法执行任务：任务命令为空，请重新创建任务");
    }
    console.log("[wukong] 执行命令:", command);

    const abortController = new AbortController();
    const taskDir = await ensureTaskDir(taskId);
    const outputFile = join(taskDir, "output.log");

    // 更新任务状态
    task.status = "running";
    task.errorMessage = undefined;
    task.startedAt = Date.now();
    wukongTasks.set(task.id, task);
    await saveTaskToFile(task);
    sendTaskStatusToRenderer(taskId, "running");

    // 保存运行中的任务信息
    runningTasks.set(taskId, {
      process: null,
      abortController,
      outputBuffer: "",
    });

    // 执行前清空设备上的报告目录
    sendOutputToRenderer(
      taskId,
      `[${new Date().toLocaleTimeString()}] 清空设备报告目录...\n`,
    );
    await clearReportDirectories();
    sendOutputToRenderer(
      taskId,
      `[${new Date().toLocaleTimeString()}] 报告目录已清空\n`,
    );

    sendOutputToRenderer(
      taskId,
      `[${new Date().toLocaleTimeString()}] 开始执行任务: ${task.name}\n`,
    );
    sendOutputToRenderer(
      taskId,
      `[${new Date().toLocaleTimeString()}] 执行命令: ${command}\n`,
    );

    // 启动性能监控
    if (task.packageName && task.metrics && task.metrics.length > 0) {
      startPerformanceMonitoring(taskId, task.packageName, task.metrics);
      sendOutputToRenderer(
        taskId,
        `[${new Date().toLocaleTimeString()}] 性能监控已启动\n`,
      );
    }

    // 执行命令（使用命令行方式）
    const executeCommand = async () => {
      let childProcess: ChildProcess | null = null;
      const runningTask = runningTasks.get(taskId)!;

      try {
        // 构建 hdc shell 命令
        // 格式: hdc [-t device] shell "command"
        const hdcArgs: string[] = [];

        // 如果有选中的设备，添加 -t 参数
        if (selectedDeviceKey) {
          hdcArgs.push("-t", selectedDeviceKey);
        }

        hdcArgs.push("shell", command);

        // 创建输出文件写入流
        const outputStream = await fs.open(outputFile, "w");

        // 使用 spawn 执行 hdc 命令
        childProcess = spawn(hdcPath, hdcArgs, {
          stdio: ["ignore", "pipe", "pipe"],
          shell: true,
        });

        runningTask.process = childProcess;

        // 实时读取 stdout
        childProcess.stdout?.on("data", (data: Buffer) => {
          const text = data.toString("utf-8");
          runningTask.outputBuffer += text;

          // 写入文件
          outputStream.write(text).catch(console.error);

          // 发送到前端
          sendOutputToRenderer(taskId, text);
        });

        // 实时读取 stderr
        childProcess.stderr?.on("data", (data: Buffer) => {
          const text = data.toString("utf-8");
          runningTask.outputBuffer += text;

          // 写入文件
          outputStream.write(text).catch(console.error);

          // 发送到前端（作为错误输出）
          sendOutputToRenderer(taskId, text, "stderr");
        });

        // 监听进程退出
        childProcess.on("exit", (code) => {
          outputStream.close().catch(console.error);

          if (abortController.signal.aborted) {
            // 主动停止，不抛出错误
            return;
          }

          if (code !== 0 && code !== null) {
            throw new Error(`进程退出，代码: ${code}`);
          }
        });

        // 监听进程错误
        childProcess.on("error", (error) => {
          outputStream.close().catch(console.error);
          if (!abortController.signal.aborted) {
            throw error;
          }
        });

        // 等待进程完成
        await new Promise<void>((resolve, reject) => {
          if (!childProcess) {
            reject(new Error("进程未创建"));
            return;
          }

          const onExit = () => {
            cleanup();
            resolve();
          };

          const onError = (error: Error) => {
            cleanup();
            if (!abortController.signal.aborted) {
              reject(error);
            } else {
              resolve();
            }
          };

          const cleanup = () => {
            childProcess?.removeListener("exit", onExit);
            childProcess?.removeListener("error", onError);
          };

          childProcess.once("exit", onExit);
          childProcess.once("error", onError);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("[wukong] 执行命令失败:", errorMessage);
        if (!abortController.signal.aborted) {
          throw new Error(errorMessage);
        }
      } finally {
        if (childProcess) {
          // 确保进程已终止
          if (!childProcess.killed) {
            try {
              childProcess.kill("SIGTERM");
              // 如果 3 秒后还没终止，强制杀死
              setTimeout(() => {
                if (childProcess && !childProcess.killed) {
                  childProcess.kill("SIGKILL");
                }
              }, 3000);
            } catch (e) {
              console.error("[wukong] 终止进程失败:", e);
            }
          }
        }
      }
    };

    // 异步执行命令
    executeCommand()
      .then(async () => {
        const updatedTask = wukongTasks.get(taskId);
        if (updatedTask && updatedTask.status === "running") {
          updatedTask.status = "finished";
          updatedTask.finishedAt = Date.now();

          wukongTasks.set(updatedTask.id, updatedTask);
          await saveTaskToFile(updatedTask);
          sendTaskStatusToRenderer(taskId, "finished");
          sendOutputToRenderer(
            taskId,
            `[${new Date().toLocaleTimeString()}] 任务执行完成\n`,
          );

          // 自动导出测试结果
          sendOutputToRenderer(
            taskId,
            `[${new Date().toLocaleTimeString()}] 开始导出测试结果...\n`,
          );
          try {
            const taskDir = await ensureTaskDir(taskId);
            const reportDir = join(taskDir, "report");
            const exportResult = await exportWukongReport(taskId, reportDir);
            if (exportResult.success) {
              sendOutputToRenderer(
                taskId,
                `[${new Date().toLocaleTimeString()}] 测试结果已导出: ${exportResult.message}\n`,
              );
              // 更新报告路径到任务目录
              updatedTask.reportPath = reportDir;
              wukongTasks.set(updatedTask.id, updatedTask);
              await saveTaskToFile(updatedTask);
            } else {
              sendOutputToRenderer(
                taskId,
                `[${new Date().toLocaleTimeString()}] 导出失败: ${exportResult.message}\n`,
                "stderr",
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            sendOutputToRenderer(
              taskId,
              `[${new Date().toLocaleTimeString()}] 导出失败: ${errorMessage}\n`,
              "stderr",
            );
          }
        }
      })
      .catch(async (error) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const updatedTask = wukongTasks.get(taskId);
        if (updatedTask) {
          if (
            errorMessage.includes("aborted") ||
            abortController.signal.aborted
          ) {
            updatedTask.status = "finished";
            updatedTask.errorMessage = undefined;
            sendTaskStatusToRenderer(taskId, "finished");
            sendOutputToRenderer(
              taskId,
              `[${new Date().toLocaleTimeString()}] 任务已停止\n`,
            );
          } else {
            updatedTask.status = "error";
            updatedTask.errorMessage = errorMessage;
            sendTaskStatusToRenderer(taskId, "error");
            sendOutputToRenderer(
              taskId,
              `[${new Date().toLocaleTimeString()}] 任务执行失败: ${errorMessage}\n`,
              "stderr",
            );
          }
          updatedTask.finishedAt = Date.now();
          wukongTasks.set(updatedTask.id, updatedTask);
          await saveTaskToFile(updatedTask);
        }
      })
      .finally(() => {
        // 停止性能监控
        stopPerformanceMonitoring(taskId);

        runningTasks.delete(taskId);
      });

    return { success: true };
  } catch (error) {
    task.status = "error";
    task.errorMessage = error instanceof Error ? error.message : String(error);
    task.finishedAt = Date.now();
    wukongTasks.set(task.id, task);
    await saveTaskToFile(task);
    sendTaskStatusToRenderer(taskId, "error");
    return { success: false, message: task.errorMessage };
  }
}

/**
 * 停止 wukong 任务
 */
export async function stopWukongTask(
  taskId: string,
): Promise<{ success: boolean; message?: string }> {
  const task = wukongTasks.get(taskId);
  if (!task) {
    return { success: false, message: "任务不存在" };
  }

  if (task.status !== "running") {
    return { success: false, message: "任务未在运行" };
  }

  try {
    const runningTask = runningTasks.get(taskId);
    if (runningTask) {
      runningTask.abortController.abort();

      // 终止子进程
      if (runningTask.process && !runningTask.process.killed) {
        try {
          runningTask.process.kill("SIGTERM");
          // 如果 3 秒后还没终止，强制杀死
          setTimeout(() => {
            if (runningTask.process && !runningTask.process.killed) {
              runningTask.process.kill("SIGKILL");
            }
          }, 3000);
        } catch (e) {
          console.error("[wukong] 终止进程失败:", e);
        }
      }

      // 停止性能监控
      stopPerformanceMonitoring(taskId);

      // 尝试通过 kill 命令停止 wukong 进程（设备端）
      try {
        await getClient()
          .getTarget(selectedDeviceKey!)
          .shell("pkill -f wukong");
      } catch (error) {
        console.warn("[wukong] 停止 wukong 进程失败:", error);
      }
    }

    task.status = "finished";
    task.errorMessage = undefined;
    task.finishedAt = Date.now();
    wukongTasks.set(task.id, task);
    await saveTaskToFile(task);
    runningTasks.delete(taskId);

    sendOutputToRenderer(
      taskId,
      `[${new Date().toLocaleTimeString()}] 任务已手动停止\n`,
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    task.status = "error";
    task.errorMessage = errorMessage;
    wukongTasks.set(task.id, task);
    await saveTaskToFile(task);
    return { success: false, message: errorMessage };
  }
}

/**
 * 打开任务目录
 */
export async function openTaskDirectory(
  taskId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const taskDir = getTaskDir(taskId);
    await shell.openPath(taskDir);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 获取任务性能数据
 */
export async function getTaskMetrics(taskId: string): Promise<MonitorSample[]> {
  try {
    const taskDir = getTaskDir(taskId);
    const metricsFile = join(taskDir, "metrics.jsonl");
    const content = await fs.readFile(metricsFile, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as MonitorSample);
  } catch (error) {
    console.error("[wukong] <UNK>:", error);
    return [];
  }
}

/**
 * 获取任务输出日志
 */
export async function getTaskOutput(taskId: string): Promise<string> {
  try {
    const taskDir = getTaskDir(taskId);
    const outputFile = join(taskDir, "output.log");
    const content = await fs.readFile(outputFile, "utf-8");
    return content;
  } catch (error) {
    console.error("[wukong] <UNK>:", error);
    return "";
  }
}

/**
 * 清空设备上的报告目录
 */
async function clearReportDirectories(): Promise<void> {
  try {
    const baseReportPath = "/data/local/tmp/wukong/report";

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      // 直接删除 report 目录下的所有内容
      const clearCmd = `rm -rf "${baseReportPath}"/*`;
      const hdcArgs: string[] = [];
      if (selectedDeviceKey) {
        hdcArgs.push("-t", selectedDeviceKey);
      }
      hdcArgs.push("shell", clearCmd);

      await execAsync(
        `${hdcPath} ${hdcArgs.map((arg) => `"${arg}"`).join(" ")}`,
      );
      console.log(`[wukong] 已清空报告目录: ${baseReportPath}`);
    } catch (error) {
      console.warn(`[wukong] 清空报告目录 ${baseReportPath} 失败:`, error);
    }
  } catch (error) {
    console.error("[wukong] 清空报告目录失败:", error);
  }
}

/**
 * 导出测试结果（从设备拉取报告文件）
 */
export async function exportWukongReport(
  taskId: string,
  targetDir: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const task = wukongTasks.get(taskId);
    if (!task) {
      return { success: false, message: "任务不存在" };
    }

    const baseReportPath = "/data/local/tmp/wukong/report";
    let reportPath: string | null = null;

    try {
      // 获取 report 目录下的所有子目录，按时间排序，取最新的
      const listCmd = `ls -td "${baseReportPath}"/* 2>/dev/null | head -1`;
      const hdcArgs: string[] = [];
      if (selectedDeviceKey) {
        hdcArgs.push("-t", selectedDeviceKey);
      }
      hdcArgs.push("shell", listCmd);

      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const result = await execAsync(
        `${hdcPath} ${hdcArgs.map((arg) => `"${arg}"`).join(" ")}`,
      );
      if (result.stdout && result.stdout.trim()) {
        const foundPath = result.stdout.trim();
        // 验证路径格式（时间戳格式：YYYYMMDD_HHMMSS）
        if (
          foundPath.includes(baseReportPath) &&
          /\/\d{8}_\d{6}$/.test(foundPath)
        ) {
          reportPath = foundPath;
        }
      }
    } catch (e) {
      console.warn(`[wukong] 查找时间戳目录失败:`, e);
    }

    if (!reportPath) {
      return {
        success: false,
        message: "未找到测试报告路径，请确认任务已执行完成",
      };
    }

    // 确保目标目录存在
    await fs.mkdir(targetDir, { recursive: true });

    // 使用 hdc file recv 拉取文件
    const filesToDownload = [
      { remote: `${reportPath}/wukong.log`, local: "wukong.log", isDir: false },
      {
        remote: `${reportPath}/wukong_report.csv`,
        local: "wukong_report.csv",
        isDir: false,
      },
      { remote: `${reportPath}/exception`, local: "exception", isDir: true },
      { remote: `${reportPath}/screenshot`, local: "screenshot", isDir: true },
    ];

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const exportedFiles: string[] = [];
    for (const file of filesToDownload) {
      try {
        const hdcArgs: string[] = [];
        if (selectedDeviceKey) {
          hdcArgs.push("-t", selectedDeviceKey);
        }
        hdcArgs.push("file", "recv", file.remote, join(targetDir, file.local));

        await execAsync(
          `${hdcPath} ${hdcArgs.map((arg) => `"${arg}"`).join(" ")}`,
        );
        exportedFiles.push(file.local);
        console.log(`[wukong] 已导出: ${file.local}`);
      } catch (error) {
        console.warn(`[wukong] 导出 ${file.local} 失败:`, error);
        // 继续导出其他文件
      }
    }

    if (exportedFiles.length === 0) {
      return {
        success: false,
        message: "未能导出任何文件，请检查设备连接和报告路径",
      };
    }

    return {
      success: true,
      message: `测试结果已导出到: ${targetDir}\n已导出文件: ${exportedFiles.join(", ")}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `导出失败: ${errorMessage}` };
  }
}
