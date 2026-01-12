// 统一使用后端的 SceneTaskStatus
// "idle" | "running" | "finished" | "error"

interface MonitoringTask {
  id: number;
  name: string;
  script: string;
  app: string;
  status: SceneTaskStatus;
  createdAt: string;
  deprecated: boolean;
  reportData: boolean;
  startTime?: string;
  endTime?: string;
  /** 对应主进程中的真实任务 id，用于 start/stop/remove 等操作 */
  backendId?: string;
  /** 错误信息（当 status 为 error 时使用） */
  errorMessage?: string;
  /** 是否已归档 */
  archived?: boolean;
  data?: {
    cpu: Array<{ time: string; value: number }>;
    memory: Array<{ time: string; value: number }>;
    gpu: Array<{ time: string; value: number }>;
    fps: Array<{ time: string; value: number }>;
    temperature: Array<{ time: string; value: number }>;
    power: Array<{ time: string; value: number }>;
    network: Array<{ time: string; value: number }>;
  };
}

interface ScriptFile {
  id: number;
  name: string;
  label: string;
  description: string;
  content: string;
  lastModified: string;
  category: "auth" | "payment" | "cart" | "search" | "form" | "other";
  difficulty: "beginner" | "intermediate" | "advanced";
  downloads: number;
  rating: number;
  author: string;
  tags: string[];
  isCustom?: boolean;
}

interface MonitorConfig {
  cpu: boolean;
  memory: boolean;
  gpu: boolean;
  fps: boolean;
  temperature: boolean;
  power: boolean;
  network: boolean;
  interval?: string;
}

interface AlertThresholdsConfig {
  fpsWarning?: number;
  fpsCritical?: number;
  cpuWarning?: number;
  cpuCritical?: number;
  memoryWarning?: number;
  memoryCritical?: number;
  temperatureWarning?: number;
  temperatureCritical?: number;
}

interface MonitorMetric {
  key: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  color: string;
  unit: string;
}

interface MonitorAlert {
  timestamp: number;
  level: "warning" | "critical";
  type: "fps" | "cpu" | "memory" | "temperature";
  message: string;
  value: number;
  threshold: number;
}
