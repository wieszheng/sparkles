import type { Node, Edge } from "@xyflow/react";

export interface ExecutionContext {
  isRunning: boolean;
  currentNodeId: string | null;
  executionLog: ExecutionLogEntry[];
  variables: Record<string, any>;
}

export interface ExecutionLogEntry {
  id: string;
  nodeId: string;
  timestamp: Date;
  status: "pending" | "running" | "success" | "error";
  message: string;
  duration?: number;
}

export class WorkflowExecutor {
  private context: ExecutionContext = {
    isRunning: false,
    currentNodeId: null,
    executionLog: [],
    variables: {},
  };

  private readonly onContextUpdate?: (context: ExecutionContext) => void;
  private nodeStatusUpdater?: (
    nodeId: string,
    status: "idle" | "pending" | "running" | "success" | "error",
  ) => void;
  private shouldStop = false;

  constructor(onContextUpdate?: (context: ExecutionContext) => void) {
    this.onContextUpdate = onContextUpdate;
  }

  setNodeStatusUpdater(
    updater: (
      nodeId: string,
      status: "idle" | "pending" | "running" | "success" | "error",
    ) => void,
  ) {
    this.nodeStatusUpdater = updater;
  }

  private updateContext(updates: Partial<ExecutionContext>) {
    this.context = { ...this.context, ...updates };
    this.onContextUpdate?.(this.context);
  }

  private addLog(
    nodeId: string,
    status: ExecutionLogEntry["status"],
    message: string,
    duration?: number,
  ) {
    const logEntry: ExecutionLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      nodeId,
      timestamp: new Date(),
      status,
      message,
      duration,
    };

    this.updateContext({
      executionLog: [...this.context.executionLog, logEntry],
    });
  }

  async executeWorkflow(nodes: Node[], edges: Edge[]): Promise<void> {
    if (this.context.isRunning) {
      console.log("[v0] 工作流已在执行中，忽略重复执行请求");
      return;
    }

    this.shouldStop = false;

    nodes.forEach((node) => {
      this.nodeStatusUpdater?.(node.id, "idle");
    });

    this.updateContext({
      isRunning: true,
      currentNodeId: null,
      executionLog: [],
      variables: {},
    });

    try {
      const startNode = nodes.find((node) => node.type === "start");
      if (!startNode) {
        throw new Error("未找到开始节点");
      }

      const executionGraph = this.buildExecutionGraph(nodes, edges);

      await this.executeNode(startNode, executionGraph);

      if (!this.shouldStop) {
        this.addLog("workflow", "success", "工作流执行完成");
      }
    } catch (error) {
      if (!this.shouldStop) {
        this.addLog(
          "workflow",
          "error",
          `工作流执行失败: ${error instanceof Error ? error.message : "未知错误"}`,
        );
      }
    } finally {
      this.updateContext({
        isRunning: false,
        currentNodeId: null,
      });
    }
  }

  private buildExecutionGraph(
    nodes: Node[],
    edges: Edge[],
  ): Map<
    string,
    { node: Node; sourceHandle?: string; targetHandle?: string }[]
  > {
    const graph = new Map<
      string,
      { node: Node; sourceHandle?: string; targetHandle?: string }[]
    >();

    nodes.forEach((node) => {
      graph.set(node.id, []);
    });

    edges.forEach((edge) => {
      const targetNode = nodes.find((node) => node.id === edge.target);
      if (targetNode) {
        const sourceConnections = graph.get(edge.source) || [];
        sourceConnections.push({
          node: targetNode,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
        });
        graph.set(edge.source, sourceConnections);
      }
    });

    return graph;
  }

  private async executeNode(
    node: Node,
    graph: Map<
      string,
      { node: Node; sourceHandle?: string; targetHandle?: string }[]
    >,
  ): Promise<void> {
    if (this.shouldStop) {
      return;
    }

    this.nodeStatusUpdater?.(node.id, "running");
    this.updateContext({ currentNodeId: node.id });
    this.addLog(node.id, "running", `开始执行节点: ${node.data.label}`);

    const startTime = Date.now();

    try {
      const conditionResult = await this.executeNodeLogic(node);

      if (this.shouldStop) {
        return;
      }

      const duration = Date.now() - startTime;
      this.nodeStatusUpdater?.(node.id, "success");
      this.addLog(
        node.id,
        "success",
        `节点执行成功: ${node.data.label}`,
        duration,
      );

      // 对于条件节点，根据结果选择执行分支
      if (typeof conditionResult === "boolean") {
        const connections = graph.get(node.id) || [];
        const targetHandle = conditionResult ? "true" : "false";

        // 查找连接到指定 sourceHandle 的节点
        const nextConnections = connections.filter(
          (conn) => conn.sourceHandle === targetHandle,
        );

        for (const connection of nextConnections) {
          if (this.shouldStop) {
            break;
          }
          await this.executeNode(connection.node, graph);
        }
      } else if (
        conditionResult &&
        typeof conditionResult === "object" &&
        "shouldLoop" in conditionResult
      ) {
        // 对于循环节点，根据循环结果选择执行分支
        const connections = graph.get(node.id) || [];
        const loopResult = conditionResult as {
          shouldLoop: boolean;
          iterationCount: number;
        };

        if (loopResult.shouldLoop) {
          // 执行循环体分支
          const loopConnections = connections.filter(
            (conn) => conn.sourceHandle === "loop",
          );

          for (const connection of loopConnections) {
            if (this.shouldStop) {
              break;
            }
            await this.executeNode(connection.node, graph);
          }
        } else {
          // 执行结束分支
          const endConnections = connections.filter(
            (conn) => conn.sourceHandle === "end",
          );

          for (const connection of endConnections) {
            if (this.shouldStop) {
              break;
            }
            await this.executeNode(connection.node, graph);
          }
        }
      } else {
        // 对于非条件/循环节点，执行所有连接的下一个节点
        const connections = graph.get(node.id) || [];
        for (const connection of connections) {
          if (this.shouldStop) {
            break;
          }
          await this.executeNode(connection.node, graph);
        }
      }
    } catch (error) {
      if (!this.shouldStop) {
        const duration = Date.now() - startTime;
        this.nodeStatusUpdater?.(node.id, "error");
        this.addLog(
          node.id,
          "error",
          `节点执行失败: ${error instanceof Error ? error.message : "未知错误"}`,
          duration,
        );
      }
      throw error;
    }
  }
  private async executeNodeLogic(
    node: any,
  ): Promise<boolean | { shouldLoop: boolean; iterationCount: number } | void> {
    const config = node.data.config || {};
    console.log(`执行节点: ${JSON.stringify(node)}`);

    switch (node.type) {
      case "start":
        await this.executeStartNode(config);
        break;
      case "click":
        await this.executeClickNode(config);
        break;
      case "print":
        await this.executeInputNode(config);
        break;
      case "close":
        await this.executeCloseNode(config);
        break;
      case "wait":
        await this.executeWaitNode(config);
        break;
      case "scroll":
        await this.executeScrollNode(config);
        break;
      case "screenshot":
        await this.executeScreenshotNode(config);
        break;
      case "swipe":
        await this.executeSwipeNode(config);
        break;
      case "condition":
        return await this.executeConditionNode(config);
      case "loop":
        return await this.executeLoopNode(config);
      default:
        throw new Error(`未知的节点类型: ${node.type}`);
    }
  }

  private async executeStartNode(config: {
    appName?: string;
    waitTime?: number;
    retryCount?: string;
  }): Promise<void> {
    await this.delay(config.waitTime || 2000);

    if (config.appName) {
      console.log(`启动应用: ${config.appName}`);
    }
  }

  private async executeClickNode(config: {
    selector?: string;
    clickType?: string;
    waitTime?: number;
    retryCount?: string;
  }): Promise<void> {
    if (config.selector) {
      console.log(`点击元素: ${config.selector}`);
    }

    console.log(`点击类型: ${config.clickType || "left"}`);

    await this.delay(config.waitTime || 1000);
  }

  private async executeInputNode(config: {
    text: string;
    selector: string;
    waitTime?: number;
    retryCount?: string;
    clearFirst?: string;
  }): Promise<void> {
    if (config.clearFirst) {
      console.log("清空输入框");
    }

    if (config.text) {
      console.log(`输入文本: ${config.text}`);
    }

    if (config.selector) {
      console.log(`目标元素: ${config.selector}`);
    }

    await this.delay(config.waitTime || 1000);
  }

  private async executeCloseNode(config: {
    waitTime?: number;
    retryCount?: string;
    method?: string;
    confirmClose?: string;
    target?: string;
  }): Promise<void> {
    console.log(`关闭方式: ${config.method || "window"}`);

    if (config.target) {
      console.log(`关闭目标: ${config.target}`);
    }

    if (config.confirmClose) {
      console.log("执行关闭确认");
    }

    await this.delay(config.waitTime || 1000);
  }

  private async executeWaitNode(config: {
    duration: number;
    unit: string;
    waitType: string;
    selector?: string;
  }): Promise<void> {
    const waitTime = config.duration || 1000;
    console.log(`等待 ${waitTime}ms`);
    await this.delay(waitTime);
  }

  private async executeScrollNode(config: {
    selector: string;
    direction: string;
    distance?: number;
    smooth?: string;
    speed?: string;
  }): Promise<void> {
    const direction = config.direction || "down";
    const distance = config.distance || 300;
    console.log(`滚动方向: ${direction}, 距离: ${distance}px`);

    if (config.selector) {
      console.log(`滚动元素: ${config.selector}`);
    }
    await this.delay(1000);
  }

  private async executeScreenshotNode(config: {
    filename: string;
    fullScreen?: boolean;
    selector?: string;
  }): Promise<void> {
    const filename = config.filename || `screenshot_${Date.now()}.png`;
    console.log(`截图保存为: ${filename}`);

    if (config.selector) {
      console.log(`截图区域: ${config.selector}`);
    } else {
      console.log("全屏截图");
    }

    await this.delay(1000);
  }

  private async executeSwipeNode(config: {
    selector?: string;
    direction: string;
    distance?: number;
    duration?: number;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
  }): Promise<void> {
    const direction = config.direction || "up";
    const distance = config.distance || 200;
    console.log(`滑动方向: ${direction}, 距离: ${distance}px`);

    if (config.startX && config.startY) {
      console.log(`起始坐标: (${config.startX}, ${config.startY})`);
    }

    await this.delay(config.duration || 500);
  }

  private async executeConditionNode(config: {
    selector: string;
    operator: string;
    value: string;
    attribute?: string;
    waitTime: number;
    retryCount?: string;
  }): Promise<boolean> {
    console.log(`检查条件: ${config.operator}`);

    if (config.selector) {
      console.log(`检查元素: ${config.selector}`);
    }

    // 模拟条件检查
    const result = Math.random() > 0.6; // 70% 成功率
    console.log(`条件检查结果: ${result ? "通过" : "失败"}`);

    await this.delay(config.waitTime);
    // 返回条件结果，用于控制执行流程
    return result;
  }

  private async executeLoopNode(config: {
    type: string;
    count?: number;
    selector?: string;
    condition?: string;
    maxIterations?: number;
    waitTime?: string;
  }): Promise<{ shouldLoop: boolean; iterationCount: number }> {
    const loopCount = config.count || 1;
    const loopType = config.type;
    const maxIterations = config.maxIterations || 10;
    const waitTime = parseInt(config.waitTime || "1000");

    console.log(`循环类型: ${loopType}, 次数: ${loopCount}`);

    let shouldLoop = false;
    let iterationCount = 0;

    if (loopType === "count") {
      shouldLoop = loopCount > 0;
      iterationCount = loopCount;
      console.log(`执行 ${loopCount} 次循环`);
    } else if (loopType === "condition") {
      // 模拟条件检查
      shouldLoop = Math.random() > 0.3; // 70% 概率继续循环
      iterationCount = 1;
      console.log(
        `条件循环: ${config.condition}, 结果: ${shouldLoop ? "继续" : "结束"}`,
      );
    } else if (loopType === "foreach") {
      // 模拟遍历元素
      const elementCount = Math.floor(Math.random() * 5) + 1; // 1-5个元素
      shouldLoop = elementCount > 0;
      iterationCount = elementCount;
      console.log(`遍历元素: ${elementCount} 个`);
    }

    // 限制最大迭代次数
    if (iterationCount > maxIterations) {
      iterationCount = maxIterations;
      shouldLoop = false;
      console.log(`达到最大迭代次数限制: ${maxIterations}`);
    }

    await this.delay(waitTime);

    return { shouldLoop, iterationCount };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stopExecution(): void {
    if (this.context.isRunning) {
      this.shouldStop = true;
      this.updateContext({
        isRunning: false,
        currentNodeId: null,
      });
      this.addLog("workflow", "error", "工作流执行被用户停止");
    }
  }

  getContext(): ExecutionContext {
    return this.context;
  }
}
