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
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
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

interface Api {
  callApi: (method: string, endpoint: string, data?: object, contentType?: "json" | "form-data") => Promise<any>;
  checkForUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
  removeUpdateStatusListener: (callback: (status: UpdateStatus) => void) => void;
  respondToUpdatePrompt: (action: string) => void;
  installUpdateNow: () => Promise<void>;
  getTargets: () => Promise<Target[]>;
  screencap: (connectKey: string,saveToLocal?:boolean) => Promise<string>;
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
  getTopBundle: (connectKey: string) => Promise<{name: string, pid: number}>;

  getToolSettings: () => Promise<any>;
  setToolSettings: (settings: object) => Promise<any>;
  getSystemSettings: () => Promise<any>;
  setSystemSettings: (settings: object) => Promise<any>;

  // 文件对话框API
  getDirectoryFiles: (directoryPath: string, extension?: string) => Promise<string[]>;
  openFileDialog: (options: OpenFileDialogOptions) => Promise<OpenFileDialogResult>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogResult>;

  // 工作流执行相关API
  executeWorkflow: (nodes: any[], edges: any[], connectKey: string) => Promise<{ success: boolean; error?: string }>;
  stopWorkflow: () => Promise<{ success: boolean; error?: string }>;
  getWorkflowContext: () => Promise<any>;
  executeSingleNode: (node: any, connectKey: string) => Promise<{ success: boolean; error?: string }>;
  
  // 测试用例执行API
  executeTestCase: (testCase: any, connectKey: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // 批量执行测试用例API
  executeBatchTestCases: (testCases: any[], connectKey: string, options?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // 测试计划相关API
  createTestPlan: (request: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateTestPlan: (request: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteTestPlan: (testPlanId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getTestPlans: (projectId?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  executeTestPlan: (request: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  getTestPlanExecutions: (testPlanId?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  generateTestReport: (executionId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getTestReports: (executionId?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  onWorkflowContextUpdate: (callback: (context: any) => void) => void;
  removeWorkflowContextListener: (callback: any) => void;
  onTestPlanExecutionUpdate: (callback: (execution: any) => void) => void;
  removeTestPlanExecutionListener: (callback: any) => void;

  // 屏幕镜像相关API
  startCaptureScreen: (connectKey: string, scale: number) => Promise<{ success: boolean; error?: string }>;
  stopCaptureScreen: (connectKey: string) => Promise<{ success: boolean; error?: string }>;

  // 屏幕镜像事件监听
  onScreencast: (callback: (event: any, type: string, key: string, image: Uint8Array) => void) => void;
  offScreencast: (callback: (event: any, type: string, key: string, image: Uint8Array) => void) => void;
}

declare global {

  interface IElectronAPI extends ElectronAPI {
    pf: string
  }
  interface Window {
    electron: IElectronAPI;
    api: Api;
  }
}
