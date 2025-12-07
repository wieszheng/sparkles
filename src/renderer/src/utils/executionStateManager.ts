interface ExecutionState {
  isRunning: boolean;
  currentNodeId: string | null;
  nodeStatuses: Map<string, NodeExecutionStatus>;
  executionLog: ExecutionLogEntry[];
  variables: Record<string, any>;
}

export class ExecutionStateManager {
  private state: ExecutionState;
  private listeners: Set<(state: ExecutionState) => void> = new Set();
  private nodeStatusUpdater:
    | ((nodeId: string, status: NodeExecutionStatus) => void)
    | null = null;

  constructor() {
    this.state = {
      isRunning: false,
      currentNodeId: null,
      nodeStatuses: new Map(),
      executionLog: [],
      variables: {},
    };
  }

  // 获取当前状态
  getState(): ExecutionState {
    return { ...this.state };
  }

  // 订阅状态变化
  subscribe(listener: (state: ExecutionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  // 设置节点状态更新器
  setNodeStatusUpdater(
    updater: (nodeId: string, status: NodeExecutionStatus) => void,
  ): void {
    this.nodeStatusUpdater = updater;
  }

  // 重置执行状态
  reset(): void {
    this.state = {
      isRunning: false,
      currentNodeId: null,
      nodeStatuses: new Map(),
      executionLog: [],
      variables: {},
    };
    this.notifyListeners();
  }

  // 设置运行状态
  setRunning(isRunning: boolean): void {
    this.state.isRunning = isRunning;
    this.notifyListeners();
  }

  // 设置当前节点
  setCurrentNode(nodeId: string | null): void {
    this.state.currentNodeId = nodeId;
    this.notifyListeners();
  }

  // 更新节点状态
  updateNodeStatus(nodeId: string, status: NodeExecutionStatus): void {
    this.state.nodeStatuses.set(nodeId, status);

    // 如果设置了节点状态更新器，也调用它
    if (this.nodeStatusUpdater) {
      this.nodeStatusUpdater(nodeId, status);
    }

    this.notifyListeners();
  }

  // 批量更新节点状态
  updateMultipleNodeStatuses(
    statusMap: Map<string, NodeExecutionStatus>,
  ): void {
    statusMap.forEach((status, nodeId) => {
      this.state.nodeStatuses.set(nodeId, status);

      if (this.nodeStatusUpdater) {
        this.nodeStatusUpdater(nodeId, status);
      }
    });

    this.notifyListeners();
  }

  // 添加执行日志
  addExecutionLog(entry: Omit<ExecutionLogEntry, "id" | "timestamp">): void {
    const logEntry: ExecutionLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };

    this.state.executionLog.push(logEntry);
    this.notifyListeners();
  }

  // 更新变量
  updateVariables(variables: Record<string, any>): void {
    this.state.variables = { ...this.state.variables, ...variables };
    this.notifyListeners();
  }

  // 开始单节点执行
  startSingleNodeExecution(nodeId: string): void {
    this.state.isRunning = true;
    this.state.currentNodeId = nodeId;
    this.updateNodeStatus(nodeId, "running");

    this.addExecutionLog({
      nodeId,
      status: "running",
      message: `开始执行单节点: ${nodeId}`,
    });
  }

  // 完成单节点执行
  completeSingleNodeExecution(nodeId: string, result?: any): void {
    this.updateNodeStatus(nodeId, "success");

    this.addExecutionLog({
      nodeId,
      status: "success",
      message: `单节点执行完成: ${nodeId}`,
      result,
    });

    // 重置执行状态
    this.state.isRunning = false;
    this.state.currentNodeId = null;
    this.notifyListeners();
  }

  // 单节点执行失败
  failSingleNodeExecution(nodeId: string, error: string): void {
    this.updateNodeStatus(nodeId, "error");

    this.addExecutionLog({
      nodeId,
      status: "error",
      message: `单节点执行失败: ${nodeId}`,
      error,
    });

    // 重置执行状态
    this.state.isRunning = false;
    this.state.currentNodeId = null;
    this.notifyListeners();
  }

  // 根据执行上下文更新状态
  updateFromExecutionContext(context: any): void {
    const { isRunning, currentNodeId, executionLog, variables, nodeStatuses } =
      context;

    this.state.isRunning = isRunning;
    this.state.currentNodeId = currentNodeId;
    this.state.variables = variables || {};

    // 更新执行日志
    if (executionLog && Array.isArray(executionLog)) {
      this.state.executionLog = executionLog.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    }

    // 从ExecutionContext中直接获取节点状态
    if (nodeStatuses && typeof nodeStatuses === "object") {
      const nodeStatusMap = new Map<string, NodeExecutionStatus>();
      Object.entries(nodeStatuses).forEach(([nodeId, status]) => {
        nodeStatusMap.set(nodeId, status as NodeExecutionStatus);
      });
      this.updateMultipleNodeStatuses(nodeStatusMap);
    }

    // 如果工作流正在运行且有当前节点，设置当前节点为 running
    if (isRunning && currentNodeId) {
      this.updateNodeStatus(currentNodeId, "running");
    }
  }

  // 获取节点状态
  getNodeStatus(nodeId: string): NodeExecutionStatus | undefined {
    return this.state.nodeStatuses.get(nodeId);
  }

  // 获取所有节点状态
  getAllNodeStatuses(): Map<string, NodeExecutionStatus> {
    return new Map(this.state.nodeStatuses);
  }

  // 清理状态
  cleanup(): void {
    this.listeners.clear();
    this.nodeStatusUpdater = null;
  }
}
