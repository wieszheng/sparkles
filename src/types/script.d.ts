type MonitoringMetric =
  | "cpu"
  | "memory"
  | "gpu"
  | "fps"
  | "temperature"
  | "power"
  | "network";

type SceneTaskStatus = "idle" | "running" | "finished" | "error";

interface AlertThresholds {
  fpsWarning?: number;
  fpsCritical?: number;
  cpuWarning?: number;
  cpuCritical?: number;
  memoryWarning?: number;
  memoryCritical?: number;
  temperatureWarning?: number;
  temperatureCritical?: number;
}

interface SceneTaskConfig {
  id: string;
  name: string;
  packageName: string;
  connectKey: string;
  metrics: MonitoringMetric[];
  // 脚本模板 ID，对应注册的脚本模板函数
  scriptTemplateId: string;
  // 监控配置
  monitorConfig?: {
    interval?: number; // 采样间隔（秒），默认1秒
    enableAlerts?: boolean; // 是否启用告警
    thresholds?: AlertThresholds; // 告警阈值
  };
}

interface SceneTask extends SceneTaskConfig {
  status: SceneTaskStatus;
  createdAt: number;
}

// 性能评分
interface PerformanceScore {
  overall: number;
  fpsScore: number;
  cpuScore: number;
  memoryScore: number;
  temperatureScore: number;
  powerScore: number;
  grade: string;
}

// 监控数据样本（扩展版本，兼容基础版本）
interface MonitorSample {
  taskId: string;
  timestamp: number;
  // 基础指标（向后兼容）
  cpu?: number;
  memory?: number;
  // 扩展指标
  fps?: number;
  fpsStability?: number;
  appCpuUsage?: number;
  appMemoryUsage?: number; // MB
  appMemoryPercent?: number;
  gpuLoad?: number;
  powerConsumption?: number;
  networkUpSpeed?: number; // KB/s
  networkDownSpeed?: number; // KB/s
  deviceTemperature?: number;
  performanceScore?: PerformanceScore;
}

// 脚本执行时的辅助工具函数
interface ScriptHelpers {
  log: (message: string) => void;
  sleep: (ms: number) => Promise<void>;
  execHdcShell: (cmd: string) => Promise<string>;
  isAborted: () => boolean;
}

// 脚本模板函数类型：接收任务和辅助工具，执行场景逻辑
type ScriptTemplate = (
  task: SceneTask,
  helpers: ScriptHelpers,
) => Promise<void>;

// 脚本模板元数据
interface ScriptTemplateMeta {
  id: string;
  name: string;
  description?: string;
  template: ScriptTemplate;
}
