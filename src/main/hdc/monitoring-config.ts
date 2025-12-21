/**
 * 监控配置本地 JSON 文件管理
 */
import { app } from "electron";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface MonitoringConfig {
  interval?: string;
  enableAlerts: boolean;
  thresholds: {
    fpsWarning?: number;
    fpsCritical?: number;
    cpuWarning?: number;
    cpuCritical?: number;
    memoryWarning?: number;
    memoryCritical?: number;
    temperatureWarning?: number;
    temperatureCritical?: number;
  };
}

const CONFIG_FILE_NAME = "monitoring-config.json";
const DEFAULT_CONFIG: MonitoringConfig = {
  interval: "1",
  enableAlerts: false,
  thresholds: {},
};

/**
 * 获取配置文件的完整路径
 */
function getConfigFilePath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, CONFIG_FILE_NAME);
}

/**
 * 确保配置文件目录存在
 */
function ensureConfigDir(): void {
  const userDataPath = app.getPath("userData");
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true });
  }
}

/**
 * 加载监控配置
 */
export function loadMonitoringConfig(): MonitoringConfig {
  try {
    const configPath = getConfigFilePath();
    if (!existsSync(configPath)) {
      // 如果配置文件不存在，返回默认配置并保存
      saveMonitoringConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    const fileContent = readFileSync(configPath, "utf-8");
    const config = JSON.parse(fileContent) as MonitoringConfig;

    // 合并默认配置，确保所有字段都存在
    return {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_CONFIG.thresholds,
        ...config.thresholds,
      },
    };
  } catch (error) {
    console.error("[monitoring-config] Failed to load config:", error);
    // 出错时返回默认配置
    return DEFAULT_CONFIG;
  }
}

/**
 * 保存监控配置
 */
export function saveMonitoringConfig(config: MonitoringConfig): boolean {
  try {
    ensureConfigDir();
    const configPath = getConfigFilePath();

    // 验证配置格式
    const validatedConfig: MonitoringConfig = {
      interval: config.interval || DEFAULT_CONFIG.interval,
      enableAlerts: config.enableAlerts ?? DEFAULT_CONFIG.enableAlerts,
      thresholds: {
        ...DEFAULT_CONFIG.thresholds,
        ...config.thresholds,
      },
    };

    writeFileSync(
      configPath,
      JSON.stringify(validatedConfig, null, 2),
      "utf-8",
    );
    console.log("[monitoring-config] Config saved successfully:", configPath);
    return true;
  } catch (error) {
    console.error("[monitoring-config] Failed to save config:", error);
    return false;
  }
}

/**
 * 重置监控配置为默认值
 */
export function resetMonitoringConfig(): boolean {
  return saveMonitoringConfig(DEFAULT_CONFIG);
}
