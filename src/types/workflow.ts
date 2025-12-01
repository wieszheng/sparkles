import type { Edge, Node } from "@xyflow/react";

export interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
}

export interface ExecutionContext {
  isRunning: boolean;
  currentNodeId: string | null;
  executionLog: ExecutionLogEntry[];
  variables: Record<string, any>;
  nodeStatuses: Record<string, NodeExecutionStatus>;
}

export interface ExecutionLogEntry {
  id: string;
  nodeId: string;
  timestamp: Date;
  status: "pending" | "running" | "success" | "error";
  message: string;
  duration?: number;
}

export interface NodeConfig {
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    config: NodeConfig;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// 序列化后的执行上下文（用于 IPC 传输）
export interface SerializedExecutionContext {
  isRunning: boolean;
  currentNodeId: string | null;
  executionLog: SerializedExecutionLogEntry[];
  variables: Record<string, any>;
  nodeStatuses: Record<string, NodeExecutionStatus>;
}

export interface SerializedExecutionLogEntry {
  id: string;
  nodeId: string;
  timestamp: string; // ISO 字符串格式
  status: "pending" | "running" | "success" | "error";
  message: string;
  duration?: number;
}

// 工作流执行结果
export interface WorkflowExecutionResult {
  success: boolean;
  error?: string;
  executionTime?: number;
}

// 测试用例执行结果
export interface TestCaseExecutionResult {
  success: boolean;
  testCaseId: string;
  testCaseName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  executionCount: number;
  status: "passed" | "failed" | "skipped" | "pending";
  error: string | null;
  executionLog: ExecutionLogEntry[];
  nodeResults: NodeExecutionResult[];
}

// 节点执行结果
export interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: NodeExecutionStatus;
  result: any;
}

// 节点执行状态类型
export type NodeExecutionStatus =
  | "idle"
  | "pending"
  | "running"
  | "success"
  | "error";
