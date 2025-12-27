import fs from "fs-extra";
import memoize from "licia/memoize";
import FileStore from "licia/FileStore";
import { app } from "electron";
import path from "path";

export interface ToolSettings {
  screenshotFormat: "jpeg" | "png" | "webp";
  saveLocation: string;
}

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

export interface MonitoringThresholds {
  fpsWarning?: number;
  fpsCritical?: number;
  cpuWarning?: number;
  cpuCritical?: number;
  memoryWarning?: number;
  memoryCritical?: number;
  temperatureWarning?: number;
  temperatureCritical?: number;
}

export interface HiLogCaptureConfig {
  enabled: boolean;
  rotationInterval?: number;
  maxFiles?: number;
}

export interface MonitoringConfig {
  interval: number;
  enableAlerts: boolean;
  thresholds: MonitoringThresholds;
  hilog: HiLogCaptureConfig;
}

interface SettingsSchema {
  language: string;
  theme: string;
  hdcPath: string;
  toolSettings: ToolSettings;
  systemSettings: SystemSettings;
  monitoring: MonitoringConfig;
}

type SettingsKey = keyof SettingsSchema;

export const DEFAULT_TOOL_SETTINGS: Readonly<ToolSettings> = {
  screenshotFormat: "jpeg",
  saveLocation: "/screenshots",
} as const;

export const DEFAULT_SYSTEM_SETTINGS: Readonly<SystemSettings> = {
  notifications: true,
  autoRun: false,
  reportEmail: "admin@example.com",
  maxConcurrent: 5,
  timeout: 30,
  retryCount: 3,
  hdcPath: "/usr/local/bin/hdc",
  hdcAutoDetect: true,
} as const;

export const DEFAULT_MONITORING_CONFIG: Readonly<MonitoringConfig> = {
  interval: 1,
  enableAlerts: false,
  thresholds: {
    fpsWarning: 50,
    fpsCritical: 50,
    cpuWarning: 50,
    cpuCritical: 50,
    memoryWarning: 50,
    memoryCritical: 50,
    temperatureWarning: 50,
    temperatureCritical: 50,
  },
  hilog: {
    enabled: true,
    rotationInterval: 3,
    maxFiles: 10,
  },
} as const;

const getUserDataPath = app.getPath("userData");
const dataDir = path.join(getUserDataPath, "data");

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.ensureDirSync(dataDir);
}

export const getSettingsStore = memoize(function () {
  return new FileStore(path.join(dataDir, "settings.json"), {
    language: "system",
    theme: "system",
    hdcPath: "",
    toolSettings: { ...DEFAULT_TOOL_SETTINGS },
    systemSettings: { ...DEFAULT_SYSTEM_SETTINGS },
    monitoring: { ...DEFAULT_MONITORING_CONFIG },
  });
});

/**
 * 安全地保存设置
 */
function saveSettings<T>(
  key: SettingsKey,
  settings: Partial<T>,
  defaultSettings: T,
): boolean {
  try {
    const store = getSettingsStore();
    const current = store.get(key) ?? defaultSettings;
    store.set(key, { ...current, ...settings });
    return true;
  } catch (error) {
    console.error(`[store] Failed to save ${key}:`, error);
    return false;
  }
}

/**
 * 安全地加载设置
 */
function loadSettingsWithDefaults<T>(key: SettingsKey, defaults: T): T {
  try {
    const store = getSettingsStore();
    const config = store.get(key);
    return config ? { ...defaults, ...config } : defaults;
  } catch (error) {
    console.error(`[store] Failed to load ${key}:`, error);
    return defaults;
  }
}

/**
 * 获取所有设置
 */
export function loadSettings(): SettingsSchema {
  try {
    return getSettingsStore().get();
  } catch (error) {
    console.error("[store] Failed to load all settings:", error);
    throw error;
  }
}

/**
 * 加载工具设置
 */
export function loadToolSettings(): ToolSettings {
  const toolSettings = loadSettingsWithDefaults(
    "toolSettings",
    DEFAULT_TOOL_SETTINGS,
  );
  console.log("loadToolSettings:", toolSettings);
  return toolSettings;
}

/**
 * 保存工具设置
 */
export function saveToolSettings(settings: Partial<ToolSettings>): boolean {
  return saveSettings("toolSettings", settings, DEFAULT_TOOL_SETTINGS);
}

/**
 * 加载系统设置
 */
export function loadSystemSettings(): SystemSettings {
  const systemSettings = loadSettingsWithDefaults(
    "systemSettings",
    DEFAULT_SYSTEM_SETTINGS,
  );
  console.log("loadSystemSettings:", systemSettings);
  return systemSettings;
}

/**
 * 保存系统设置
 */
export function saveSystemSettings(settings: Partial<SystemSettings>): boolean {
  return saveSettings("systemSettings", settings, DEFAULT_SYSTEM_SETTINGS);
}

/**
 * 加载监控配置
 */
export function loadMonitoringConfig(): MonitoringConfig {
  const monitoring = loadSettingsWithDefaults(
    "monitoring",
    DEFAULT_MONITORING_CONFIG,
  );
  console.log("loadMonitoringConfig:", monitoring);
  return monitoring;
}

/**
 * 保存监控配置
 */
export function saveMonitoringConfig(
  config: Partial<MonitoringConfig>,
): boolean {
  try {
    const store = getSettingsStore();
    const current = store.get("monitoring") ?? DEFAULT_MONITORING_CONFIG;

    const newConfig: MonitoringConfig = {
      ...current,
      ...config,
      thresholds: {
        ...current.thresholds,
        ...(config.thresholds ?? {}),
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
