type NodeExecutionStatus = "idle" | "pending" | "running" | "success" | "error";

type Status = "pending" | "running" | "success" | "error" | "idle";
type Operator =
  | "equals"
  | "contains"
  | "exists"
  | "not_exists"
  | "greater"
  | "less"
  | "visible"
  | "enabled";

type LoopType = "count" | "condition" | "foreach";

type ScreenshotFormat = "png" | "jpg";

type SwipeDirection = "up" | "down" | "left" | "right";

interface ClickNode {
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  selectedDevice: string;
  config: {
    selector?: string;
    x?: number;
    y?: number;
    clickType?: string;
    waitTime?: string;
    retryCount?: string;
  };
}

interface NodeConfig {
  [key: string]: any;
}

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    config: NodeConfig;
  };
}

interface ExecutionLogEntry {
  id: string;
  nodeId: string;
  timestamp: Date;
  status: "pending" | "running" | "success" | "error";
  message: string;
  duration?: number;
  result?: any;
  error?: string;
}

interface ExecutionContext {
  isRunning: boolean;
  currentNodeId: string | null;
  executionLog: ExecutionLogEntry[];
  variables: Record<string, any>;
  nodeStatuses: Record<string, NodeExecutionStatus>;
}

interface SerializedExecutionLogEntry {
  id: string;
  nodeId: string;
  timestamp: string; // ISO 字符串格式
  status: "pending" | "running" | "success" | "error";
  message: string;
  duration?: number;
}

// 序列化后的执行上下文（用于 IPC 传输）
interface SerializedExecutionContext {
  isRunning: boolean;
  currentNodeId: string | null;
  executionLog: SerializedExecutionLogEntry[];
  variables: Record<string, any>;
  nodeStatuses: Record<string, NodeExecutionStatus>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}
