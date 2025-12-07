import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {
  // API请求转发
  callApi: (
    method: string,
    endpoint: string,
    data?: object,
    contentType?: "json" | "form-data",
  ) => {
    return ipcRenderer.invoke("call-api", {
      method,
      endpoint,
      data,
      contentType,
    });
  },

  request: (options: RequestOptions) => {
    return ipcRenderer.invoke("call-api-request", options);
  },

  uploadFile: (options: UploadFileOptions) => {
    return ipcRenderer.invoke("call-api-upload", options);
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

  // Bundle 相关 API
  getBundles: (connectKey: string, system?: boolean): Promise<string[]> =>
    ipcRenderer.invoke("get-bundles", connectKey, system),
  getBundleInfos: (connectKey: string, bundleNames: string[]): Promise<any[]> =>
    ipcRenderer.invoke("get-bundle-infos", connectKey, bundleNames),
  installBundle: (connectKey: string, hap: string): Promise<void> =>
    ipcRenderer.invoke("install-bundle", connectKey, hap),
  startBundle: (
    connectKey: string,
    bundleName: string,
    ability?: string,
  ): Promise<void> =>
    ipcRenderer.invoke("start-bundle", connectKey, bundleName, ability),
  stopBundle: (connectKey: string, bundleName: string): Promise<void> =>
    ipcRenderer.invoke("stop-bundle", connectKey, bundleName),
  cleanBundleData: (connectKey: string, bundleName: string): Promise<void> =>
    ipcRenderer.invoke("clean-bundle-data", connectKey, bundleName),
  cleanBundleCache: (connectKey: string, bundleName: string): Promise<void> =>
    ipcRenderer.invoke("clean-bundle-cache", connectKey, bundleName),
  uninstallBundle: (connectKey: string, bundleName: string): Promise<void> =>
    ipcRenderer.invoke("uninstall-bundle", connectKey, bundleName),
  getTopBundle: (connectKey: string): Promise<{ name: string; pid: number }> =>
    ipcRenderer.invoke("get-top-bundle", connectKey),
  hdcCommand: (
    commandType: string,
    connectKey: string,
    saveToLocal?: boolean,
    packageName?: string,
  ): Promise<Record<string, string | boolean>> =>
    ipcRenderer.invoke(
      "hdc-command",
      commandType,
      connectKey,
      saveToLocal,
      packageName,
    ),

  // 存储相关API
  getSettings: () => ipcRenderer.invoke("get-settings"),
  getToolSettings: () => ipcRenderer.invoke("get-tool-settings"),
  getSystemSettings: () => ipcRenderer.invoke("get-system-settings"),
  setToolSettings: (settings: object) =>
    ipcRenderer.invoke("set-tool-settings", settings),
  setSystemSettings: (settings: object) =>
    ipcRenderer.invoke("set-system-settings", settings),

  // 文件对话框API
  getDirectoryFiles: (directoryPath: string, extension?: string) =>
    ipcRenderer.invoke("get-directory-files", directoryPath, extension),
  openFileDialog: (options: any) =>
    ipcRenderer.invoke("open-file-dialog", options),
  showSaveDialog: (options: any) =>
    ipcRenderer.invoke("show-save-dialog", options),

  // 文件操作API
  saveFile: (filePath: string, data: ArrayBuffer) =>
    ipcRenderer.invoke("save-file", filePath, Array.from(new Uint8Array(data))),

  // 读取本地文件API
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),

  // 工作流执行相关API
  executeWorkflow: (nodes: any[], edges: any[], connectKey: string) =>
    ipcRenderer.invoke("execute-workflow", nodes, edges, connectKey),

  stopWorkflow: () => ipcRenderer.invoke("stop-workflow"),

  getWorkflowContext: () => ipcRenderer.invoke("get-workflow-context"),
  // 监听工作流上下文更新
  onWorkflowContextUpdate: (callback: (context: any) => void) =>
    ipcRenderer.on("workflow-context-update", (_event, context) =>
      callback(context),
    ),

  removeWorkflowContextListener: (callback) =>
    ipcRenderer.removeListener("workflow-context-update", callback),
  // 单节点执行API
  executeSingleNode: (node: any, connectKey: string) =>
    ipcRenderer.invoke("execute-single-node", node, connectKey),

  // 测试用例执行API
  executeTestCase: (testCase: any, connectKey: string) =>
    ipcRenderer.invoke("execute-test-case", testCase, connectKey),

  // 批量执行测试用例API
  executeBatchTestCases: (
    testCases: any[],
    connectKey: string,
    options?: any,
  ) =>
    ipcRenderer.invoke(
      "execute-batch-test-cases",
      testCases,
      connectKey,
      options,
    ),

  // 屏幕镜像相关API
  startCaptureScreen: (
    connectKey: string,
    scale: number,
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("startCaptureScreen", connectKey, scale),

  stopCaptureScreen: (
    connectKey: string,
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("stopCaptureScreen", connectKey),

  // 监听屏幕镜像事件
  onScreencast: (
    callback: (
      event: any,
      type: string,
      key: string,
      image: Uint8Array,
    ) => void,
  ) => ipcRenderer.on("screencast", callback),

  offScreencast: (
    callback: (
      event: any,
      type: string,
      key: string,
      image: Uint8Array,
    ) => void,
  ) => ipcRenderer.removeListener("screencast", callback),
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
