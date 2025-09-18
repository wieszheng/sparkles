import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type { Target } from "../types";
interface UpdateStatus {
  status:
    | "checking"
    | "update-available"
    | "downloading"
    | "progress"
    | "ready"
    | "up-to-date"
    | "error";
  message: string;
  // 可以添加版本信息
  versionInfo?: { version: string; releaseDate: string; releaseNotes?: string };
  progress?: number; // 0-100
}
// Custom APIs for renderer
const api = {
  // API请求转发
  callApi: (method: string, endpoint: string, data?: object) => {
    return ipcRenderer.invoke("call-api", { method, endpoint, data });
  },
  // 自动更新相关API
  checkForUpdate: (): Promise<void> => ipcRenderer.invoke("check-for-update"),

  // 监听更新进度事件
  onUpdateStatus: (callback: (status: UpdateStatus) => void) =>
    ipcRenderer.on("update-status", (_event, value) => callback(value)),
  removeUpdateStatusListener: (callback) =>
    ipcRenderer.removeListener("update-status", callback),
  respondToUpdatePrompt: (action) =>
    ipcRenderer.invoke("user-response-to-update", action),

  installUpdateNow: () => ipcRenderer.invoke("install-update-now"),

  getTargets: (): Promise<Target[]> => ipcRenderer.invoke("get-targets"),
  screencap: (connectKey: string, saveToLocal?: boolean): Promise<string> =>
    ipcRenderer.invoke("screencap", connectKey, saveToLocal),

  // 存储相关API
  getSettings: () => ipcRenderer.invoke("get-settings"),
  getToolSettings: () => ipcRenderer.invoke("get-tool-settings"),
  getSystemSettings: () => ipcRenderer.invoke("get-system-settings"),
  setToolSettings: (settings: object) =>
    ipcRenderer.invoke("set-tool-settings", settings),
  setSystemSettings: (settings: object) =>
    ipcRenderer.invoke("set-system-settings", settings),
};

const extendedElectronAPI = {
  ...electronAPI,
  pf: process.platform,
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", extendedElectronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = extendedElectronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
