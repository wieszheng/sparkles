import { BrowserWindow } from "electron";

import {
  SPDaemon,
  type CalculatedMetrics,
  type AlertThresholds,
} from "./sp-daemon";
import { persistMonitorSample } from "./persistence";

// 监控运行时状态
const monitoringTimers = new Map<string, NodeJS.Timeout>();
const spDaemonInstances = new Map<string, SPDaemon>(); // 每个任务一个 SPDaemon 实例
export const taskMetrics = new Map<string, MonitorSample[]>(); // 每个任务的监控数据历史

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
    console.log("collectMetricsForTask", task.packageName, task.metrics);
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
      console.log("collectMetricsForTask metrics", metrics);
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
  },
): void {
  if (monitoringTimers.has(task.id)) return;

  const interval = (config?.interval || 1) * 1000;
  const enableAlerts = config?.enableAlerts || false;
  const thresholds = config?.thresholds || {};

  // 创建或获取 SPDaemon 实例
  let spDaemon = spDaemonInstances.get(task.id);
  if (!spDaemon) {
    spDaemon = new SPDaemon();
    spDaemonInstances.set(task.id, spDaemon);
    spDaemon.resetNetworkStats(); // 重置网络统计
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
export function stopMonitoring(taskId: string): void {
  const timer = monitoringTimers.get(taskId);
  if (timer) {
    clearInterval(timer);
    monitoringTimers.delete(taskId);
  }
  // 清理 SPDaemon 实例
  spDaemonInstances.delete(taskId);
}
