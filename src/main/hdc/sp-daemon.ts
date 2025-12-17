import { BrowserWindow } from "electron";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// SPDaemon 类 (从之前的封装移植)
export class SPDaemon {
  private shellCommand: string = "hdc shell";
  private isMonitoring: boolean = false;
  private monitorTimer?: NodeJS.Timeout;
  private mainWindow?: BrowserWindow;
  private lastNetworkData?: any;
  private lastTimestamp?: number;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  private buildCommand(options: any): string {
    const params: string[] = [`${this.shellCommand} SP_daemon`];
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

  private parseOutput(output: string): any {
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
    const cpuCores: any[] = [];
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
        cores: cpuCores,
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

  private calculateMetrics(result: any): any {
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
      const timeDelta = (result.timestamp - this.lastTimestamp) / 1000;
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

    const metrics = {
      packageName: result.procAppName,
      timestamp: result.timestamp,
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

  private calculatePerformanceScore(result: any): any {
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
    ].filter((t: any) => t !== undefined) as number[];
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

  private checkAlerts(metrics: any, thresholds: any): any[] {
    const alerts: any[] = [];
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

    return alerts;
  }

  async collect(options: any): Promise<any> {
    const command = this.buildCommand(options);
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr) console.warn("SP_daemon stderr:", stderr);
      return this.parseOutput(stdout);
    } catch (error) {
      throw new Error(`SP_daemon execution failed: ${error}`);
    }
  }

  async startMonitor(packageName: string, config: any): Promise<void> {
    if (this.isMonitoring) {
      throw new Error("Monitor is already running");
    }

    const { interval = 1, thresholds = {}, enableAlerts = true } = config;

    this.isMonitoring = true;
    this.lastNetworkData = undefined;
    this.lastTimestamp = undefined;

    const monitor = async () => {
      if (!this.isMonitoring) return;

      try {
        const result = await this.collect({
          N: 1,
          PKG: packageName,
          cpu: true,
          gpu: true,
          fps: true,
          temperature: true,
          power: true,
          ram: true,
          net: true,
        });

        const metrics = this.calculateMetrics(result);
        if (metrics) {
          this.mainWindow?.webContents.send("monitor:data", metrics);

          if (enableAlerts) {
            const alerts = this.checkAlerts(metrics, thresholds);
            alerts.forEach((alert) => {
              this.mainWindow?.webContents.send("monitor:alert", alert);
            });
          }
        }
      } catch (error) {
        this.mainWindow?.webContents.send("monitor:error", {
          error: String(error),
        });
      }

      this.monitorTimer = setTimeout(monitor, interval * 1000);
    };

    monitor();
  }

  stopMonitor(): void {
    this.isMonitoring = false;
    if (this.monitorTimer) {
      clearTimeout(this.monitorTimer);
      this.monitorTimer = undefined;
    }
  }
}
