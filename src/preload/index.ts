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
  screencap: (connectKey: string): Promise<string> =>
    ipcRenderer.invoke("screencap", connectKey),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
