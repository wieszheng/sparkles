import { getClient } from "./index";

/**
 * SPDaemon 监控配置选项
 */
export interface SPDaemonOptions {
  N: number; // 采样次数
  PKG?: string; // 包名
  cpu?: boolean;
  gpu?: boolean;
  fps?: boolean;
  temperature?: boolean;
  power?: boolean;
  ram?: boolean;
  net?: boolean;
  ddr?: boolean;
}

/**
 * 告警阈值配置
 */
export interface AlertThresholds {
  fpsWarning?: number;
  fpsCritical?: number;
  cpuWarning?: number;
  cpuCritical?: number;
  memoryWarning?: number;
  memoryCritical?: number;
  temperatureWarning?: number;
  temperatureCritical?: number;
}

/**
 * SPDaemon 原始数据解析结果
 */
export interface SPDaemonRawData {
  procAppName?: string;
  timestamp?: number;
  cpu?: {
    procCpuUsage?: number;
    totalCpuUsage?: number;
    cores?: Array<{
      coreId: number;
      frequency?: number;
      usage?: number;
    }>;
  };
  gpu?: {
    gpuLoad?: number;
    gpuFrequency?: number;
  };
  memory?: {
    pss?: number;
    memTotal?: number;
    memAvailable?: number;
  };
  fps?: {
    fps?: number;
    fpsJitters?: number[];
    refreshRate?: number;
  };
  battery?: {
    battery?: number;
    currentNow?: number;
    voltageNow?: number;
    powerConsumption?: number;
  };
  temperature?: {
    socThermal?: number;
    shellBack?: number;
  };
  network?: {
    networkDown?: number;
    networkUp?: number;
  };
  rawData: Record<string, any>;
}

/**
 * 计算后的监控指标
 */
export interface CalculatedMetrics {
  packageName: string;
  timestamp: number;
  fps: number;
  fpsStability: number;
  appCpuUsage: number;
  appMemoryUsage: number; // MB
  appMemoryPercent: number;
  gpuLoad: number;
  powerConsumption: number;
  networkUpSpeed: number; // KB/s
  networkDownSpeed: number; // KB/s
  deviceTemperature: number;
  performanceScore: {
    overall: number;
    fpsScore: number;
    cpuScore: number;
    memoryScore: number;
    temperatureScore: number;
    powerScore: number;
    grade: string;
  };
}

/**
 * 告警信息
 */
export interface Alert {
  timestamp: number;
  level: "warning" | "critical";
  type: "fps" | "cpu" | "memory" | "temperature";
  message: string;
  value: number;
  threshold: number;
}

/**
 * SPDaemon 类：封装鸿蒙 SP_daemon 性能监控
 */
export class SPDaemon {
  private lastNetworkData?: { networkUp?: number; networkDown?: number };
  private lastTimestamp?: number;

  /**
   * 构建 SP_daemon 命令
   */
  private buildCommand(options: SPDaemonOptions): string {
    const params: string[] = ["SP_daemon"];
    params.push(`-N ${options.N}`);
    if (options.PKG) params.push(`-PKG ${options.PKG}`);
    if (options.cpu) params.push("-c");
    if (options.gpu) params.push("-g");
    if (options.fps) params.push("-f");
    if (options.temperature) params.push("-t");
    if (options.power) params.push("-p");
    if (options.ram) params.push("-r");
    if (options.net) params.push("-net");
    if (options.ddr) params.push("-d");
    return params.join(" ");
  }

  /**
   * 解析 SP_daemon 输出
   */
  parseOutput(output: string): SPDaemonRawData {
    const lines = output.split("\n");
    const rawData: Record<string, any> = {};

    for (const line of lines) {
      const match = line.match(/^order:\d+\s+(.+?)=(.+)$/);
      if (match) {
        const key = match[1];
        let value: any = match[2];
        if (value !== "NA" && !isNaN(Number(value))) {
          value = Number(value);
        } else if (value === "NA") {
          value = undefined;
        }
        rawData[key] = value;
      }
    }

    // 解析CPU核心
    const cpuCores: Array<{
      coreId: number;
      frequency?: number;
      usage?: number;
    }> = [];
    let coreId = 0;
    while (rawData[`cpu${coreId}Frequency`] !== undefined) {
      cpuCores.push({
        coreId,
        frequency: rawData[`cpu${coreId}Frequency`],
        usage: rawData[`cpu${coreId}Usage`],
      });
      coreId++;
    }

    // 解析FPS抖动
    let fpsJitters: number[] | undefined;
    if (rawData.fpsJitters && typeof rawData.fpsJitters === "string") {
      fpsJitters = rawData.fpsJitters
        .split(";;")
        .map((v: string) => Number(v))
        .filter((v: number) => !isNaN(v));
    }

    // 计算功耗
    let powerConsumption: number | undefined;
    if (rawData.currentNow !== undefined && rawData.voltageNow !== undefined) {
      powerConsumption = Math.abs(
        (rawData.currentNow * rawData.voltageNow) / 1000000000000,
      );
    }

    return {
      procAppName: rawData.ProcAppName,
      timestamp: rawData.timestamp,
      cpu: {
        procCpuUsage: rawData.ProcCpuUsage,
        totalCpuUsage: rawData.TotalcpuUsage,
        cores: cpuCores.length > 0 ? cpuCores : undefined,
      },
      gpu: {
        gpuLoad: rawData.gpuLoad,
        gpuFrequency: rawData.gpuFrequency,
      },
      memory: {
        pss: rawData.pss,
        memTotal: rawData.memTotal,
        memAvailable: rawData.memAvailable,
      },
      fps: {
        fps: rawData.fps,
        fpsJitters,
        refreshRate: rawData.refreshrate,
      },
      battery: {
        battery: rawData.Battery,
        currentNow: rawData.currentNow,
        voltageNow: rawData.voltageNow,
        powerConsumption,
      },
      temperature: {
        socThermal: rawData.soc_thermal,
        shellBack: rawData.shell_back,
      },
      network: {
        networkDown: rawData.networkDown,
        networkUp: rawData.networkUp,
      },
      rawData,
    };
  }

  /**
   * 计算监控指标
   */
  calculateMetrics(result: SPDaemonRawData): CalculatedMetrics | null {
    if (!result.procAppName || !result.timestamp) return null;

    // FPS稳定性
    let fpsStability = 0;
    if (result.fps?.fpsJitters && result.fps.fpsJitters.length > 1) {
      const jitters = result.fps.fpsJitters;
      const intervals = jitters
        .slice(1)
        .map((t: number, i: number) => t - jitters[i]);
      const mean =
        intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length;
      const variance =
        intervals.reduce(
          (sum: number, val: number) => sum + Math.pow(val - mean, 2),
          0,
        ) / intervals.length;
      fpsStability = Math.sqrt(variance) / 1000000;
    }

    // 网络速率
    let networkUpSpeed = 0;
    let networkDownSpeed = 0;
    if (this.lastNetworkData && this.lastTimestamp) {
      const timeDelta = (result.timestamp! - this.lastTimestamp) / 1000;
      if (timeDelta > 0) {
        networkUpSpeed =
          ((result.network?.networkUp || 0) -
            (this.lastNetworkData.networkUp || 0)) /
          timeDelta /
          1024;
        networkDownSpeed =
          ((result.network?.networkDown || 0) -
            (this.lastNetworkData.networkDown || 0)) /
          timeDelta /
          1024;
      }
    }
    this.lastNetworkData = result.network;
    this.lastTimestamp = result.timestamp;

    // 平均温度
    const temps = [
      result.temperature?.socThermal,
      result.temperature?.shellBack,
    ].filter((t) => t !== undefined) as number[];
    const avgTemp =
      temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;

    const memoryPercent = result.memory?.memTotal
      ? ((result.memory.pss || 0) / result.memory.memTotal) * 100
      : 0;

    const metrics: CalculatedMetrics = {
      packageName: result.procAppName,
      timestamp: result.timestamp!,
      fps: result.fps?.fps || 0,
      fpsStability,
      appCpuUsage: result.cpu?.procCpuUsage || 0,
      appMemoryUsage: (result.memory?.pss || 0) / 1024,
      appMemoryPercent: memoryPercent,
      gpuLoad: result.gpu?.gpuLoad || 0,
      powerConsumption: result.battery?.powerConsumption || 0,
      networkUpSpeed: Math.max(0, networkUpSpeed),
      networkDownSpeed: Math.max(0, networkDownSpeed),
      deviceTemperature: avgTemp,
      performanceScore: this.calculatePerformanceScore(result),
    };

    return metrics;
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(result: SPDaemonRawData): {
    overall: number;
    fpsScore: number;
    cpuScore: number;
    memoryScore: number;
    temperatureScore: number;
    powerScore: number;
    grade: string;
  } {
    const fps = result.fps?.fps || 0;
    const fpsScore = Math.min(100, (fps / 60) * 100);

    const cpuUsage = result.cpu?.procCpuUsage || 0;
    const cpuScore = Math.max(0, 100 - cpuUsage);

    const memoryPercent = result.memory?.memTotal
      ? ((result.memory.pss || 0) / result.memory.memTotal) * 100
      : 0;
    const memoryScore = Math.max(0, 100 - memoryPercent);

    const temps = [
      result.temperature?.socThermal,
      result.temperature?.shellBack,
    ].filter((t) => t !== undefined) as number[];
    const avgTemp =
      temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 30;
    const temperatureScore = Math.max(
      0,
      Math.min(100, ((45 - avgTemp) / 45) * 100 + 50),
    );

    const power = result.battery?.powerConsumption || 0;
    const powerScore = Math.max(0, Math.min(100, ((3 - power) / 3) * 100));

    const overall =
      fpsScore * 0.3 +
      cpuScore * 0.2 +
      memoryScore * 0.2 +
      temperatureScore * 0.15 +
      powerScore * 0.15;

    let grade: string;
    if (overall >= 90) grade = "Excellent";
    else if (overall >= 75) grade = "Good";
    else if (overall >= 60) grade = "Fair";
    else if (overall >= 40) grade = "Poor";
    else grade = "Critical";

    return {
      overall: Math.round(overall),
      fpsScore: Math.round(fpsScore),
      cpuScore: Math.round(cpuScore),
      memoryScore: Math.round(memoryScore),
      temperatureScore: Math.round(temperatureScore),
      powerScore: Math.round(powerScore),
      grade,
    };
  }

  /**
   * 检查告警
   */
  checkAlerts(
    metrics: CalculatedMetrics,
    thresholds: AlertThresholds,
  ): Alert[] {
    const alerts: Alert[] = [];
    const timestamp = metrics.timestamp;

    if (thresholds.fpsCritical && metrics.fps < thresholds.fpsCritical) {
      alerts.push({
        timestamp,
        level: "critical",
        type: "fps",
        message: `严重: FPS过低 (${metrics.fps.toFixed(1)})`,
        value: metrics.fps,
        threshold: thresholds.fpsCritical,
      });
    } else if (thresholds.fpsWarning && metrics.fps < thresholds.fpsWarning) {
      alerts.push({
        timestamp,
        level: "warning",
        type: "fps",
        message: `警告: FPS偏低 (${metrics.fps.toFixed(1)})`,
        value: metrics.fps,
        threshold: thresholds.fpsWarning,
      });
    }

    if (
      thresholds.cpuCritical &&
      metrics.appCpuUsage > thresholds.cpuCritical
    ) {
      alerts.push({
        timestamp,
        level: "critical",
        type: "cpu",
        message: `严重: CPU使用率过高 (${metrics.appCpuUsage.toFixed(1)}%)`,
        value: metrics.appCpuUsage,
        threshold: thresholds.cpuCritical,
      });
    } else if (
      thresholds.cpuWarning &&
      metrics.appCpuUsage > thresholds.cpuWarning
    ) {
      alerts.push({
        timestamp,
        level: "warning",
        type: "cpu",
        message: `警告: CPU使用率偏高 (${metrics.appCpuUsage.toFixed(1)}%)`,
        value: metrics.appCpuUsage,
        threshold: thresholds.cpuWarning,
      });
    }

    if (
      thresholds.memoryCritical &&
      metrics.appMemoryPercent > thresholds.memoryCritical
    ) {
      alerts.push({
        timestamp,
        level: "critical",
        type: "memory",
        message: `严重: 内存使用率过高 (${metrics.appMemoryPercent.toFixed(1)}%)`,
        value: metrics.appMemoryPercent,
        threshold: thresholds.memoryCritical,
      });
    } else if (
      thresholds.memoryWarning &&
      metrics.appMemoryPercent > thresholds.memoryWarning
    ) {
      alerts.push({
        timestamp,
        level: "warning",
        type: "memory",
        message: `警告: 内存使用率偏高 (${metrics.appMemoryPercent.toFixed(1)}%)`,
        value: metrics.appMemoryPercent,
        threshold: thresholds.memoryWarning,
      });
    }

    if (
      thresholds.temperatureCritical &&
      metrics.deviceTemperature > thresholds.temperatureCritical
    ) {
      alerts.push({
        timestamp,
        level: "critical",
        type: "temperature",
        message: `严重: 设备温度过高 (${metrics.deviceTemperature.toFixed(1)}°C)`,
        value: metrics.deviceTemperature,
        threshold: thresholds.temperatureCritical,
      });
    } else if (
      thresholds.temperatureWarning &&
      metrics.deviceTemperature > thresholds.temperatureWarning
    ) {
      alerts.push({
        timestamp,
        level: "warning",
        type: "temperature",
        message: `警告: 设备温度偏高 (${metrics.deviceTemperature.toFixed(1)}°C)`,
        value: metrics.deviceTemperature,
        threshold: thresholds.temperatureWarning,
      });
    }

    return alerts;
  }

  /**
   * 采集性能数据
   */
  async collect(
    connectKey: string,
    options: SPDaemonOptions,
  ): Promise<SPDaemonRawData> {
    const command = this.buildCommand(options);
    try {
      const connection = await getClient().getTarget(connectKey).shell(command);
      const output = await connection.readAll();
      return this.parseOutput(output.toString("utf-8"));
    } catch (error) {
      throw new Error(`SP_daemon execution failed: ${error}`);
    }
  }

  /**
   * 重置网络数据统计（用于新的监控周期）
   */
  resetNetworkStats(): void {
    this.lastNetworkData = undefined;
    this.lastTimestamp = undefined;
  }
}
