import fs from "fs-extra";
import memoize from "licia/memoize";
import FileStore from "licia/FileStore";
import { app } from "electron";
import path from "path";

const getUserDataPath = app.getPath("userData");
const dataDir = path.join(getUserDataPath, "data");

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.ensureDirSync(dataDir);
}

// ==================== Interfaces & Defaults ====================

export interface ToolSettings {
  screenshotFormat: string;
  saveLocation: string;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  screenshotFormat: "jpeg",
  saveLocation: "/screenshots/ss",
};

export interface SystemSettings {
  notifications: boolean;
  autoRun: boolean;
  reportEmail: string;
  maxConcurrent: number;
  timeout: number;
  retryCount: number;
  hdcPath: string;
  hdcAutoDetect: boolean;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  notifications: true,
  autoRun: false,
  reportEmail: "admin@example.com",
  maxConcurrent: 5,
  timeout: 30,
  retryCount: 3,
  hdcPath: "/usr/local/bin/hdc",
  hdcAutoDetect: true,
};

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

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  interval: "1",
  enableAlerts: false,
  thresholds: {},
};

// ==================== Store Initialization ====================

export const getSettingsStore = memoize(function () {
  return new FileStore(path.join(dataDir, "settings.json"), {
    language: "system",
    theme: "system",
    hdcPath: "",
    toolSettings: DEFAULT_TOOL_SETTINGS,
    systemSettings: DEFAULT_SYSTEM_SETTINGS,
    monitoring: DEFAULT_MONITORING_CONFIG,
  });
});

// ==================== Helper Functions ====================

/**
 * 获取所有设置
 */
export function loadSettings() {
  return getSettingsStore().get();
}

/**
 * 加载工具设置
 */
export function loadToolSettings(): ToolSettings {
  const store = getSettingsStore();
  const config = store.get("toolSettings");
  return config
    ? { ...DEFAULT_TOOL_SETTINGS, ...config }
    : DEFAULT_TOOL_SETTINGS;
}

/**
 * 保存工具设置
 */
export function saveToolSettings(settings: Partial<ToolSettings>): boolean {
  try {
    const store = getSettingsStore();
    const current = store.get("toolSettings") || DEFAULT_TOOL_SETTINGS;
    store.set("toolSettings", { ...current, ...settings });
    return true;
  } catch (error) {
    console.error("[store] Failed to save tool settings:", error);
    return false;
  }
}

/**
 * 重置工具设置
 */
export function resetToolSettings(): boolean {
  try {
    const store = getSettingsStore();
    store.set("toolSettings", DEFAULT_TOOL_SETTINGS);
    return true;
  } catch (error) {
    console.error("[store] Failed to reset tool settings:", error);
    return false;
  }
}

/**
 * 加载系统设置
 */
export function loadSystemSettings(): SystemSettings {
  const store = getSettingsStore();
  const config = store.get("systemSettings");
  return config
    ? { ...DEFAULT_SYSTEM_SETTINGS, ...config }
    : DEFAULT_SYSTEM_SETTINGS;
}

/**
 * 保存系统设置
 */
export function saveSystemSettings(settings: Partial<SystemSettings>): boolean {
  try {
    const store = getSettingsStore();
    const current = store.get("systemSettings") || DEFAULT_SYSTEM_SETTINGS;
    store.set("systemSettings", { ...current, ...settings });
    return true;
  } catch (error) {
    console.error("[store] Failed to save system settings:", error);
    return false;
  }
}

/**
 * 重置系统设置
 */
export function resetSystemSettings(): boolean {
  try {
    const store = getSettingsStore();
    store.set("systemSettings", DEFAULT_SYSTEM_SETTINGS);
    return true;
  } catch (error) {
    console.error("[store] Failed to reset system settings:", error);
    return false;
  }
}

/**
 * 加载监控配置
 */
export function loadMonitoringConfig(): MonitoringConfig {
  const store = getSettingsStore();
  const config = store.get("monitoring");
  // 确保返回默认值，如果配置不存在
  return config
    ? { ...DEFAULT_MONITORING_CONFIG, ...config }
    : DEFAULT_MONITORING_CONFIG;
}

/**
 * 保存监控配置
 */
export function saveMonitoringConfig(config: MonitoringConfig): boolean {
  try {
    const store = getSettingsStore();
    const current = store.get("monitoring") || DEFAULT_MONITORING_CONFIG;

    // 合并配置
    const newConfig: MonitoringConfig = {
      ...current,
      ...config,
      thresholds: {
        ...current.thresholds,
        ...(config.thresholds || {}),
      },
    };

    store.set("monitoring", newConfig);
    return true;
  } catch (error) {
    console.error("[store] Failed to save monitoring config:", error);
    return false;
  }
}

/**
 * 重置监控配置
 */
export function resetMonitoringConfig(): boolean {
  try {
    const store = getSettingsStore();
    store.set("monitoring", DEFAULT_MONITORING_CONFIG);
    return true;
  } catch (error) {
    console.error("[store] Failed to reset monitoring config:", error);
    return false;
  }
}
