import { ElectronAPI } from "@electron-toolkit/preload";

interface FileFilter {
  name: string;
  extensions: string[];
}

interface OpenFileDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  properties?: Array<"openFile" | "openDirectory" | "multiSelections" | "showHiddenFiles">;
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
}

interface OpenFileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface BundleInfo {
  bundleName: string;
  versionName: string;
  icon: string;
  label: string;
  system: boolean;
  apiTargetVersion: number;
  vendor: string;
  installTime: number;
  releaseType: string;
  mainAbility?: string;
}

interface MonitorConfig {
  interval?: number;
  thresholds?: {
    fpsWarning?: number;
    fpsCritical?: number;
    cpuWarning?: number;
    cpuCritical?: number;
    memoryWarning?: number;
    memoryCritical?: number;
    temperatureWarning?: number;
    temperatureCritical?: number;
    powerWarning?: number;
    powerCritical?: number;
  };
  enableAlerts?: boolean;
}

interface CollectOptions {
  N: number;
  PKG?: string;
  cpu?: boolean;
  gpu?: boolean;
  fps?: boolean;
  temperature?: boolean;
  power?: boolean;
  ram?: boolean;
  net?: boolean;
}

interface Api {
  callApi: (method: string, endpoint: string, data?: object, contentType?: "json" | "form-data") => Promise<any>;
  request: <T = any>(options: RequestOptions) => Promise<any>;
  uploadFile: (options: UploadFileOptions) => Promise<any>;
  checkForUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
  removeUpdateStatusListener: (callback: (status: UpdateStatus) => void) => void;
  respondToUpdatePrompt: (action: string) => void;
  installUpdateNow: () => Promise<void>;
  getTargets: () => Promise<Target[]>;
  screencap: (connectKey: string, saveToLocal?: boolean) => Promise<string>;
  hdcCommand: (commandType: string, connectKey: string, saveToLocal?: boolean, packageName?: string) => Promise<Record<string, string | boolean>>;

  // Bundle 相关 API
  getBundles: (connectKey: string, system?: boolean) => Promise<string[]>;
  getBundleInfos: (connectKey: string, bundleNames: string[]) => Promise<BundleInfo[]>;
  installBundle: (connectKey: string, hap: string) => Promise<void>;
  startBundle: (connectKey: string, bundleName: string, ability?: string) => Promise<void>;
  stopBundle: (connectKey: string, bundleName: string) => Promise<void>;
  cleanBundleData: (connectKey: string, bundleName: string) => Promise<void>;
  cleanBundleCache: (connectKey: string, bundleName: string) => Promise<void>;
  uninstallBundle: (connectKey: string, bundleName: string) => Promise<void>;
  getTopBundle: (connectKey: string) => Promise<{ name: string, pid: number }>;

  getToolSettings: () => Promise<any>;
  setToolSettings: (settings: object) => Promise<any>;
  getSystemSettings: () => Promise<any>;
  setSystemSettings: (settings: object) => Promise<any>;

  // 文件对话框API
  getDirectoryFiles: (directoryPath: string, extension?: string) => Promise<string[]>;
  openFileDialog: (options: OpenFileDialogOptions) => Promise<OpenFileDialogResult>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogResult>;

  // 文件操作API
  saveFile: (filePath: string, data: number[]) => Promise<{ success: boolean }>;

  // 读取本地文件API
  readFile: (filePath: string) => Promise<{ success: boolean; data?: number[]; fileName?: string; mimeType?: string }>;

  // 工作流执行相关API
  executeWorkflow: (nodes: any[], edges: any[], connectKey: string) => Promise<{ success: boolean; error?: string }>;
  stopWorkflow: () => Promise<{ success: boolean; error?: string }>;
  getWorkflowContext: () => Promise<any>;
  executeSingleNode: (node: any, connectKey: string) => Promise<{ success: boolean; error?: string }>;

  // 测试用例执行API
  onWorkflowContextUpdate: (callback: (context: any) => void) => void;
  removeWorkflowContextListener: (callback: any) => void;
  executeTestCase: (testCase: any, connectKey: string) => Promise<{ success: boolean; data?: any; error?: string }>;

  // 批量执行测试用例API
  executeBatchTestCases: (testCases: any[], connectKey: string, options?: any) => Promise<{
    success: boolean;
    data?: any;
    error?: string
  }>;


  // 屏幕镜像相关API
  startCaptureScreen: (connectKey: string, scale: number) => Promise<{ success: boolean; error?: string }>;
  stopCaptureScreen: (connectKey: string) => Promise<{ success: boolean; error?: string }>;

  // 屏幕镜像事件监听
  onScreencast: (callback: (event: any, type: string, key: string, image: Uint8Array) => void) => void;
  offScreencast: (callback: (event: any, type: string, key: string, image: Uint8Array) => void) => void;


  startMonitor: (packageName: string, config: MonitorConfig) => Promise<{ success: boolean; error?: string }>;
  stopMonitor: () => Promise<{ success: boolean; error?: string }>;
  collectOnce: (options: CollectOptions) => Promise<{ success: boolean; data?: any; error?: string }>;

  onData: (callback: (data: any) => void) => void;
  onAlert: (callback: (alert: any) => void) => void;
  onError: (callback: (error: any) => void) => void;
  removeListener: (channel: string) => void;
}

declare global {

  interface IElectronAPI extends ElectronAPI {
    pf: string;
  }

  interface Window {
    electron: IElectronAPI;
    api: Api;
  }
}
