import { BrowserWindow } from "electron";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import {
  SPDaemon,
  type CalculatedMetrics,
  type AlertThresholds,
} from "./sp-daemon";
import { persistMonitorSample } from "./persistence";
import {
  startHiLogCapture,
  stopHiLogCapture,
  HiLogType,
  HiLogLevel,
  type HiLogCaptureConfig,
} from "./hilog";
import { getClient, getDeviceKey } from "./index";

// 监控运行时状态
const monitoringTimers = new Map<string, NodeJS.Timeout>();
const spDaemonInstances = new Map<string, SPDaemon>(); // 每个任务一个 SPDaemon 实例
export const taskMetrics = new Map<string, MonitorSample[]>(); // 每个任务的监控数据历史
const hilogTaskIds = new Map<string, string>(); // 任务ID到HiLog任务ID的映射

let mainWindow: BrowserWindow | null = null;

/**
 * 设置主窗口引用（用于推送监控数据）
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * 采集指定任务的监控指标（使用 SP_daemon）
 * 如果采集失败，回退到模拟数据
 */
export async function collectMetricsForTask(
  task: SceneTask,
): Promise<Omit<MonitorSample, "taskId">> {
  const now = Date.now();

  // 获取或创建该任务的 SPDaemon 实例
  let spDaemon = spDaemonInstances.get(task.id);
  if (!spDaemon) {
    spDaemon = new SPDaemon();
    spDaemonInstances.set(task.id, spDaemon);
  }

  try {
    // 使用 SP_daemon 采集性能数据
    const rawData = await spDaemon.collect({
      N: 1,
      PKG: task.packageName,
      cpu: task.metrics.includes("cpu"),
      gpu: task.metrics.includes("gpu"),
      fps: task.metrics.includes("fps"),
      temperature: task.metrics.includes("temperature"),
      power: task.metrics.includes("power"),
      ram: task.metrics.includes("memory"),
      net: task.metrics.includes("network"),
    });

    const metrics = spDaemon.calculateMetrics(rawData);
    if (metrics) {
      // 转换为 MonitorSample 格式（兼容基础格式）
      return {
        timestamp: metrics.timestamp,
        // 基础字段（向后兼容）
        cpu: metrics.appCpuUsage,
        memory: metrics.appMemoryUsage,
        // 扩展字段
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
    }

    // 如果解析失败，使用回退数据
    return createFallbackMetrics(now);
  } catch (error) {
    console.error("collectMetricsForTask error", error);
    // 采集失败时使用回退数据
    return createFallbackMetrics(now);
  }
}

/**
 * 创建回退监控数据（当 SP_daemon 不可用时使用）
 */
function createFallbackMetrics(
  timestamp: number,
): Omit<MonitorSample, "taskId"> {
  const fallbackCpu = 10 + Math.random() * 60;
  const fallbackMem = 150 + Math.random() * 350;
  return {
    timestamp,
    cpu: fallbackCpu,
    memory: fallbackMem,
    appCpuUsage: fallbackCpu,
    appMemoryUsage: fallbackMem,
  };
}

/**
 * 开始监控指定任务
 */
export function startMonitoring(
  task: SceneTask,
  config?: {
    interval?: number; // 采样间隔（秒），默认1秒
    thresholds?: AlertThresholds; // 告警阈值
    enableAlerts?: boolean; // 是否启用告警，默认false
    enableHiLog?: boolean; // 是否启用HiLog采集，默认true
    hilogConfig?: Partial<HiLogCaptureConfig>; // HiLog配置
  },
): void {
  if (monitoringTimers.has(task.id)) return;

  const interval = (config?.interval || 1) * 1000;
  const enableAlerts = config?.enableAlerts || false;
  const thresholds = config?.thresholds || {};
  const enableHiLog = config?.enableHiLog !== false; // 默认启用

  // 创建或获取 SPDaemon 实例
  let spDaemon = spDaemonInstances.get(task.id);
  if (!spDaemon) {
    spDaemon = new SPDaemon();
    spDaemonInstances.set(task.id, spDaemon);
    spDaemon.resetNetworkStats(); // 重置网络统计
  }

  // 启动 HiLog 采集
  if (enableHiLog) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // 使用任务ID创建独立子目录，方便管理和查看
    const logDir = path.join(os.tmpdir(), "sparkles-logs", task.id);
    // 确保目录存在
    fs.mkdirSync(logDir, { recursive: true });

    const logFileName = `hilog_${task.packageName}_${timestamp}.log`;
    const logPath = path.join(logDir, logFileName);

    const hilogTaskId = `hilog-${task.id}`;
    const hilogConfig: HiLogCaptureConfig = {
      connectKey: task.id.split("-")[0] || "default", // 从任务ID提取设备key
      savePath: logPath,
      type: [HiLogType.APP, HiLogType.CORE],
      level: [HiLogLevel.DEBUG, HiLogLevel.INFO, HiLogLevel.WARN, HiLogLevel.ERROR, HiLogLevel.FATAL],
      format: {
        time: "time",
        precision: "msec",
        year: true,
        zone: true,
      },
      rotation: {
        interval: 5 * 60 * 1000, // 5 分钟
        maxFiles: 10,            // 最多保留 10 个文件
        compress: false,         // 不压缩（可选）
      },
      ...config?.hilogConfig,
    };

    const result = startHiLogCapture(hilogTaskId, hilogConfig);
    if (result.success) {
      hilogTaskIds.set(task.id, hilogTaskId);
      console.log(`[Monitor] HiLog capture started for task ${task.id}, log file: ${logPath}`);
    } else {
      console.error(`[Monitor] Failed to start HiLog capture: ${result.message}`);
    }
  }

  const timer = setInterval(async () => {
    try {
      const metrics = await collectMetricsForTask(task);

      const sample: MonitorSample = {
        taskId: task.id,
        ...metrics,
      };

      // 持久化当前任务的监控样本，支持任务执行完成后的数据回显
      // 按需求：不再采样/裁剪，保留全部数据（注意：长时间运行会占用更多内存）
      const list = taskMetrics.get(task.id) ?? [];
      taskMetrics.set(task.id, [...list, sample]);

      if (mainWindow) {
        mainWindow.webContents.send("monitor:data", sample);

        // 如果启用告警，检查并发送告警
        if (enableAlerts && metrics.performanceScore) {
          const calculatedMetrics: CalculatedMetrics = {
            packageName: task.packageName,
            timestamp: sample.timestamp,
            fps: metrics.fps || 0,
            fpsStability: metrics.fpsStability || 0,
            appCpuUsage: metrics.appCpuUsage || metrics.cpu || 0,
            appMemoryUsage: metrics.appMemoryUsage || metrics.memory || 0,
            appMemoryPercent: metrics.appMemoryPercent || 0,
            gpuLoad: metrics.gpuLoad || 0,
            powerConsumption: metrics.powerConsumption || 0,
            networkUpSpeed: metrics.networkUpSpeed || 0,
            networkDownSpeed: metrics.networkDownSpeed || 0,
            deviceTemperature: metrics.deviceTemperature || 0,
            performanceScore: metrics.performanceScore,
          };
          const alerts = spDaemon.checkAlerts(calculatedMetrics, thresholds);
          alerts.forEach((alert) => {
            mainWindow?.webContents.send("monitor:alert", alert);
          });
        }
      }

      // 异步持久化到 FastAPI（不阻塞采样循环）
      void persistMonitorSample(task, sample);
    } catch (error) {
      console.error("collect metrics error", error);
      if (mainWindow) {
        mainWindow.webContents.send("monitor:error", {
          taskId: task.id,
          error: String(error),
        });
      }
    }
  }, interval);

  monitoringTimers.set(task.id, timer);
}

/**
 * 停止监控指定任务
 */
export async function stopMonitoring(taskId: string): Promise<void> {
  const timer = monitoringTimers.get(taskId);
  if (timer) {
    clearInterval(timer);
    monitoringTimers.delete(taskId);
  }

  // 停止 HiLog 采集
  const hilogTaskId = hilogTaskIds.get(taskId);
  if (hilogTaskId) {
    const result = stopHiLogCapture(hilogTaskId);
    if (result.success) {
      console.log(`[Monitor] HiLog capture stopped for task ${taskId}`);
    } else {
      console.error(`[Monitor] Failed to stop HiLog capture: ${result.message}`);
    }
    hilogTaskIds.delete(taskId);
  }

  // 清理 SPDaemon 实例
  spDaemonInstances.delete(taskId);

  // 导出崩溃日志 /data/log/faultlog/faultlogger
  const deviceKey = getDeviceKey();
  if (deviceKey) {
    try {
      const client = getClient();
      const remotePath = "/data/log/faultlog/faultlogger";
      // 目标目录：temp/sparkles-logs/{taskId}
      // hdc file recv 会在目标目录下创建 faultlogger 文件夹
      const localParentDir = path.join(os.tmpdir(), "sparkles-logs", taskId);

      if (!fs.existsSync(localParentDir)) {
        fs.mkdirSync(localParentDir, { recursive: true });
      }

      console.log(`[Monitor] Exporting fault logs to ${localParentDir}...`);
      await client.getTarget(deviceKey).recvFile(remotePath, localParentDir);
      console.log(`[Monitor] Fault logs exported successfully.`);
    } catch (error) {
      console.error(`[Monitor] Failed to export fault logs:`, error);
    }
  }
}
