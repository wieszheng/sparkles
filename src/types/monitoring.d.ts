type TaskStatus = "pending" | "running" | "completed" | "stopped" | "error";

interface MonitoringTask {
  id: number;
  name: string;
  script: string;
  app: string;
  status: TaskStatus;
  createdAt: string;
  deprecated: boolean;
  reportData: boolean;
  startTime?: string;
  endTime?: string;
  data?: {
    cpu: Array<{ time: string; value: number }>;
    memory: Array<{ time: string; value: number }>;
    temperature: Array<{ time: string; value: number }>;
    battery: Array<{ time: string; value: number }>;
    traffic: Array<{ time: string; value: number }>;
  };
}

interface ScriptFile {
  id: number;
  name: string;
  label: string;
  content: string;
  lastModified: string;
}

interface MonitorConfig {
  cpu: boolean;
  memory: boolean;
  temperature: boolean;
  battery: boolean;
  traffic: boolean;
  interval: string;
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
