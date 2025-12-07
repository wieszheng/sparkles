import { BrowserWindow } from "electron";
import { Client } from "hdckit";
import { WorkflowOperations } from "./hdc";

export class MainWorkflowExecutor {
  private context: ExecutionContext = {
    isRunning: false,
    currentNodeId: null,
    executionLog: [],
    variables: {},
    nodeStatuses: {},
  };

  // 执行统计信息
  private executionStats = {
    totalNodes: 0,
    executedNodes: 0,
    successNodes: 0,
    errorNodes: 0,
    skippedNodes: 0,
  };

  private client: Client;
  private shouldStop = false;
  private mainWindow: BrowserWindow;
  private operations: WorkflowOperations | null = null;

  constructor(client: Client, mainWindow: BrowserWindow) {
    this.client = client;
    this.mainWindow = mainWindow;
  }

  private updateContext(updates: Partial<ExecutionContext>) {
    this.context = { ...this.context, ...updates };

    // 序列化上下文以避免 IPC 克隆错误
    const serializedContext: SerializedExecutionContext = {
      ...this.context,
      executionLog: this.context.executionLog.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(), // 将 Date 对象转为 ISO 字符串
      })),
    };

    // 向渲染进程发送序列化的状态更新
    this.mainWindow.webContents.send(
      "workflow-context-update",
      serializedContext,
    );
  }

  private addLog(
    nodeId: string,
    status: ExecutionLogEntry["status"],
    message: string,
    duration?: number,
    details?: object,
  ) {
    const logEntry: ExecutionLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      nodeId,
      timestamp: new Date(),
      status,
      message,
      duration,
    };

    // 格式化日志消息，使其更简洁易读
    const timeStr = new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Shanghai",
    });

    // 根据状态和内容优化消息格式
    let formattedMessage = message;
    if (details) {
      const keyInfo = this.extractKeyInfo(details);
      if (keyInfo) {
        formattedMessage += ` - ${keyInfo}`;
      }
    }

    const performanceInfo = duration ? ` (${duration}ms)` : "";
    logEntry.message = `[${timeStr}] ${formattedMessage}${performanceInfo}`;

    // 更新执行统计
    this.updateExecutionStats(nodeId, status);

    // 更新节点状态到上下文中
    this.updateNodeStatus(nodeId, status);

    // 同时更新执行日志和节点状态到渲染进程
    this.updateContext({
      executionLog: [...this.context.executionLog, logEntry],
      nodeStatuses: { ...this.context.nodeStatuses }, // 确保节点状态同步到渲染进程
    });

    // 输出到控制台，使用更清晰的格式
    const statusIcon = this.getStatusIcon(status);
    const logLevel = this.getLogLevel(status);
    console[logLevel](`${statusIcon} ${logEntry.message}`);
  }

  private extractKeyInfo(details: object): string {
    if (!details || typeof details !== "object") return "";

    const keyFields = [
      "appName",
      "targetSelector",
      "inputText",
      "waitTime",
      "errorType",
      "suggestion",
    ];
    const info: string[] = [];

    for (const [key, value] of Object.entries(details)) {
      if (keyFields.includes(key) && value) {
        info.push(`${key}: ${value}`);
      }
    }

    return info.join(", ");
  }

  private getLogLevel(
    status: ExecutionLogEntry["status"],
  ): "log" | "warn" | "error" {
    switch (status) {
      case "error":
        return "error";
      case "success":
        return "log";
      case "running":
      case "pending":
      default:
        return "log";
    }
  }

  private updateNodeStatus(
    nodeId: string,
    status: ExecutionLogEntry["status"],
  ): void {
    // 只更新非工作流级别的节点状态
    if (nodeId === "workflow") {
      return;
    }

    // 更新节点状态映射
    this.context.nodeStatuses[nodeId] = status;
  }

  private updateExecutionStats(
    nodeId: string,
    status: ExecutionLogEntry["status"],
  ): void {
    // 只统计非工作流级别的节点
    if (nodeId === "workflow") {
      return;
    }

    // 检查该节点是否已经有运行中的日志
    const hasRunningLog = this.context.executionLog.some(
      (log) => log.nodeId === nodeId && log.status === "running",
    );

    if (status === "running" && !hasRunningLog) {
      // 新节点开始执行
      this.executionStats.executedNodes++;
    } else if (status === "success" || status === "error") {
      // 节点执行完成，更新对应状态计数
      if (status === "success") {
        this.executionStats.successNodes++;
      } else if (status === "error") {
        this.executionStats.errorNodes++;
      }
    }
  }

  private getStatusIcon(status: ExecutionLogEntry["status"]): string {
    switch (status) {
      case "pending":
        return "⏳";
      case "running":
        return "🔄";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "📋";
    }
  }

  async executeWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    connectKey: string,
  ): Promise<void> {
    if (this.context.isRunning) {
      console.log("Workflow is already running, ignoring duplicate request");
      return;
    }

    this.shouldStop = false;

    // 初始化操作实例
    this.operations = new WorkflowOperations(this.client, connectKey);

    // 重置执行统计
    this.executionStats = {
      totalNodes: nodes.length,
      executedNodes: 0,
      successNodes: 0,
      errorNodes: 0,
      skippedNodes: 0,
    };

    this.updateContext({
      isRunning: true,
      currentNodeId: null,
      executionLog: [],
      variables: {},
      nodeStatuses: {},
    });

    // 记录工作流开始信息
    this.addLog(
      "workflow",
      "running",
      `Starting workflow execution (${nodes.length} nodes)`,
      undefined,
      {
        device: connectKey,
        nodeList: nodes.map((n) => n.data.label).join(" → "),
      },
    );

    const workflowStartTime = Date.now();

    try {
      const startNode = nodes.find((node) => node.type === "start");
      if (!startNode) {
        throw new Error("Start node not found");
      }

      this.addLog(
        "workflow",
        "running",
        `Start node: ${startNode.data.label}`,
        undefined,
        {
          nodeId: startNode.id,
        },
      );

      const executionGraph = this.buildExecutionGraph(nodes, edges);

      this.addLog("workflow", "running", "Execution graph built", undefined, {
        nodeRelations: `${Array.from(executionGraph.keys()).length} nodes connected`,
      });

      await this.executeNode(startNode, executionGraph);

      if (!this.shouldStop) {
        const workflowDuration = Date.now() - workflowStartTime;
        this.addLog(
          "workflow",
          "success",
          `Workflow execution completed (${this.executionStats.successNodes}/${this.executionStats.executedNodes} successful)`,
          workflowDuration,
          {
            totalNodes: this.executionStats.totalNodes,
            executedNodes: this.executionStats.executedNodes,
            successNodes: this.executionStats.successNodes,
            errorNodes: this.executionStats.errorNodes,
            skippedNodes: this.executionStats.skippedNodes,
          },
        );
      }
    } catch (error) {
      if (!this.shouldStop) {
        const workflowDuration = Date.now() - workflowStartTime;
        this.addLog(
          "workflow",
          "error",
          `Workflow execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          workflowDuration,
          {
            errorType:
              error instanceof Error ? error.constructor.name : "Unknown",
            currentNode: this.context.currentNodeId,
          },
        );
      }
    } finally {
      // 执行完成后的清理工作
      this.updateContext({
        isRunning: false,
        currentNodeId: null,
      });

      const finalDuration = Date.now() - workflowStartTime;
      this.addLog(
        "workflow",
        "running",
        `Workflow execution finished (${this.shouldStop ? "stopped by user" : "completed normally"})`,
        finalDuration,
        {
          totalDuration: `${finalDuration}ms`,
          logCount: this.context.executionLog.length,
        },
      );

      console.log("Workflow execution finished, state has been reset");
    }
  }

  private buildExecutionGraph(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
  ): Map<string, { node: WorkflowNode; sourceHandle?: string }[]> {
    const graph = new Map<
      string,
      { node: WorkflowNode; sourceHandle?: string }[]
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
          sourceHandle: edge.sourceHandle,
        });
        graph.set(edge.source, sourceConnections);
      }
    });

    return graph;
  }

  private async executeNode(
    node: WorkflowNode,
    graph: Map<string, { node: WorkflowNode; sourceHandle?: string }[]>,
  ): Promise<void> {
    if (this.shouldStop) return;

    this.updateContext({ currentNodeId: node.id });

    // 记录节点开始执行
    this.addLog(
      node.id,
      "running",
      `Executing node: ${node.data.label}`,
      undefined,
      {
        nodeType: node.type,
        nodeId: node.id,
      },
    );

    const startTime = Date.now();
    let executionResult = null;

    try {
      // 直接执行节点逻辑
      executionResult = await this.executeNodeLogic(node);

      if (this.shouldStop) return;

      const duration = Date.now() - startTime;

      // 记录节点执行成功
      this.addLog(
        node.id,
        "success",
        `${node.data.label} execution successful`,
        duration,
        {
          performanceLevel: this.getPerformanceLevel(duration),
        },
      );

      // 处理分支执行逻辑
      await this.executeNextNodes(node, graph, executionResult);
    } catch (error) {
      if (!this.shouldStop) {
        const duration = Date.now() - startTime;

        // 记录节点执行失败
        this.addLog(
          node.id,
          "error",
          `${node.data.label} execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          duration,
          {
            errorType:
              error instanceof Error ? error.constructor.name : "Unknown",
            nodeType: node.type,
          },
        );
      }
      throw error;
    }
  }

  /**
   * 获取性能等级
   */
  private getPerformanceLevel(duration: number): string {
    if (duration < 1000) return "Fast";
    if (duration < 5000) return "Normal";
    if (duration < 10000) return "Slow";
    return "Very Slow";
  }

  private async executeNextNodes(
    node: WorkflowNode,
    graph: Map<string, { node: WorkflowNode; sourceHandle?: string }[]>,
    result: any,
  ): Promise<void> {
    const connections = graph.get(node.id) || [];

    if (typeof result === "boolean") {
      // 条件节点分支处理
      const targetHandle = result ? "true" : "false";
      const nextConnections = connections.filter(
        (conn) => conn.sourceHandle === targetHandle,
      );
      for (const connection of nextConnections) {
        if (this.shouldStop) break;
        await this.executeNode(connection.node, graph);
      }
    } else if (result && typeof result === "object" && "shouldLoop" in result) {
      // 循环节点处理
      const loopResult = result as { shouldLoop: boolean };
      const targetHandle = loopResult.shouldLoop ? "loop" : "end";
      const nextConnections = connections.filter(
        (conn) => conn.sourceHandle === targetHandle,
      );
      for (const connection of nextConnections) {
        if (this.shouldStop) break;
        await this.executeNode(connection.node, graph);
      }
    } else {
      // 普通节点，执行所有下一个节点
      for (const connection of connections) {
        if (this.shouldStop) break;
        await this.executeNode(connection.node, graph);
      }
    }
  }

  private async executeNodeLogic(node: any): Promise<any> {
    if (!this.operations) {
      throw new Error("Operations not initialized");
    }

    const config = node.data.config || {};

    // 验证节点配置
    this.validateNodeConfig(node);

    // 根据节点类型执行相应的逻辑
    switch (node.type) {
      case "start":
        return await this.executeStartNode(config);
      case "click":
        return await this.executeClickNode(config);
      case "print":
        return await this.executeInputNode(config);
      case "close":
        return await this.executeCloseNode(config);
      case "wait":
        return await this.executeWaitNode(config);
      case "scroll":
        return await this.executeScrollNode(config);
      case "screenshot":
        return await this.executeScreenshotNode(config);
      case "swipe":
        return await this.executeSwipeNode(config);
      case "condition":
        return await this.executeConditionNode(config);
      case "loop":
        return await this.executeLoopNode(config);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private validateNodeConfig(node: any): void {
    const config = node.data.config || {};
    const nodeType = node.type;
    const nodeLabel = node.data.label || node.id;

    // 根据节点类型验证必需的配置项
    switch (nodeType) {
      case "start":
        if (!config.appName) {
          console.warn(
            `Start node "${nodeLabel}" is missing app name configuration`,
          );
        }
        break;
      case "click":
        // 验证坐标范围
        if (config.x !== undefined && (config.x < 0 || config.x > 2000)) {
          console.warn(
            `Click node "${nodeLabel}" X coordinate may be out of screen bounds: ${config.x}`,
          );
        }
        if (config.y !== undefined && (config.y < 0 || config.y > 2000)) {
          console.warn(
            `Click node "${nodeLabel}" Y coordinate may be out of screen bounds: ${config.y}`,
          );
        }
        break;
      case "print":
        if (!config.selector) {
          throw new Error(
            `Input node "${nodeLabel}" is missing selector configuration`,
          );
        }
        break;
      case "condition":
        if (!config.selector) {
          throw new Error(
            `Condition node "${nodeLabel}" is missing selector configuration`,
          );
        }
        if (!config.operator) {
          console.warn(
            `Condition node "${nodeLabel}" is missing operator configuration, will use default "exists"`,
          );
        }
        break;
      case "screenshot":
        if (!config.filename) {
          console.warn(
            `Screenshot node "${nodeLabel}" is missing filename configuration, will use default name`,
          );
        }
        break;
      case "wait":
        if (!config.duration || config.duration < 0) {
          console.warn(
            `Wait node "${nodeLabel}" is missing valid duration configuration, will use default 1000ms`,
          );
        }
        break;
      case "close":
        if (!config.target) {
          console.warn(
            `Close node "${nodeLabel}" is missing target application configuration`,
          );
        }
        break;
    }
  }

  private async executeStartNode(config: NodeConfig): Promise<void> {
    if (!config.appName) {
      this.addLog(
        "start",
        "running",
        "App name not specified, skipping start operation",
      );
      return;
    }

    this.addLog(
      "start",
      "running",
      `Starting app: ${config.appName}`,
      undefined,
      {
        startMode:
          config.startingMode === "coldBoot" ? "Cold Boot" : "Hot Boot",
        waitTime: `${config.waitTime || 2000}ms`,
      },
    );

    try {
      await this.operations!.startApplication(config);

      this.addLog(
        "start",
        "success",
        `App started successfully: ${config.appName}`,
        undefined,
        {
          appName: config.appName,
        },
      );
    } catch (error) {
      const errorMsg = `Failed to start app: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("start", "error", errorMsg, undefined, {
        appName: config.appName,
        suggestion:
          "Check if the app exists and the device connection is normal",
      });
      throw new Error(errorMsg);
    }
  }

  private async executeClickNode(config: NodeConfig): Promise<void> {
    // 验证配置
    if (!config.x || !config.y) {
      const errorMsg =
        "Click node configuration error: missing selector or coordinates";
      this.addLog("click", "error", errorMsg, undefined, {
        suggestion: "Please configure the correct selector or coordinates",
      });
      throw new Error(errorMsg);
    }

    const clickType = config.clickType || "click";
    const clickTypeText = this.getClickTypeText(clickType);

    if (config.selector) {
      // 选择器点击
      this.addLog(
        "click",
        "running",
        `${clickTypeText} selector: ${config.selector}`,
        undefined,
        {
          selector: config.selector,
          clickType: clickTypeText,
        },
      );
    } else {
      // 坐标点击
      const position = `(${config.x}, ${config.y})`;
      this.addLog(
        "click",
        "running",
        `${clickTypeText} coordinates: ${position}`,
        undefined,
        {
          position: position,
          clickType: clickTypeText,
        },
      );
    }

    try {
      await this.operations!.performClick(config);

      if (config.selector) {
        this.addLog(
          "click",
          "success",
          `Selector ${clickTypeText} successful`,
          undefined,
          {
            selector: config.selector,
          },
        );
      } else {
        const position = `(${config.x}, ${config.y})`;
        this.addLog(
          "click",
          "success",
          `Coordinates ${clickTypeText} successful`,
          undefined,
          {
            position: position,
          },
        );
      }
    } catch (error) {
      const errorMsg = `${clickTypeText} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("click", "error", errorMsg, undefined, {
        selector: config.selector,
        suggestion:
          "Check if the selector/coordinates are correct and the element exists and is clickable",
      });
      throw new Error(errorMsg);
    }
  }

  /**
   * 获取点击类型的中文描述
   */
  private getClickTypeText(clickType: string): string {
    switch (clickType) {
      case "long":
        return "Long Press";
      case "double":
        return "Double Click";
      case "click":
      default:
        return "Click";
    }
  }

  private async executeInputNode(config: NodeConfig): Promise<void> {
    if (!config.selector) {
      const errorMsg = "Input node configuration error: missing selector";
      this.addLog("print", "error", errorMsg, undefined, {
        suggestion: "Please configure the correct selector",
      });
      throw new Error(errorMsg);
    }

    const inputText = config.text || "";
    const shouldClear = config.clearFirst === "true";

    this.addLog(
      "print",
      "running",
      `Input operation: ${inputText ? `"${inputText}"` : "clear"}`,
      undefined,
      {
        selector: config.selector,
        operationType: inputText
          ? shouldClear
            ? "Clear and input"
            : "Direct input"
          : "Clear only",
      },
    );

    try {
      await this.operations!.performInput(config);

      this.addLog("print", "success", "Input operation completed", undefined, {
        selector: config.selector,
        operationResult: inputText ? `Inputted "${inputText}"` : "Cleared",
      });
    } catch (error) {
      const errorMsg = `Input operation failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("print", "error", errorMsg, undefined, {
        selector: config.selector,
        suggestion:
          "Check if the selector is correct and the input field exists and is editable",
      });
      throw new Error(errorMsg);
    }
  }

  private async executeScreenshotNode(config: NodeConfig): Promise<void> {
    const filename = config.filename || `screenshot_${Date.now()}`;

    this.addLog(
      "screenshot",
      "running",
      `Starting screenshot: ${filename}`,
      undefined,
      {
        fileName: filename,
        saveLocation: config.saveToLocal
          ? config.savePath || "User directory"
          : "Temp directory",
      },
    );

    try {
      const finalPath = await this.operations!.takeScreenshot(config);

      this.addLog(
        "screenshot",
        "success",
        `Screenshot completed: ${filename}`,
        undefined,
        {
          savePath: finalPath,
          fileSize: await this.operations!.getFileSize(finalPath),
        },
      );
    } catch (error) {
      const errorMsg = `Screenshot operation failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("screenshot", "error", errorMsg, undefined, {
        fileName: filename,
        suggestion: "Check device connection and storage space",
      });
      throw new Error(errorMsg);
    }
  }

  private async executeScrollNode(config: NodeConfig): Promise<void> {
    const direction = config.direction || "down";
    const distance = config.distance || 300;
    const directionText = this.getScrollDirectionText(direction);

    this.addLog(
      "scroll",
      "running",
      `Scroll operation: ${directionText}`,
      undefined,
      {
        direction: directionText,
        distance: `${distance}px`,
      },
    );

    try {
      await this.operations!.performScroll(config);

      this.addLog(
        "scroll",
        "success",
        `Scroll operation successful: ${directionText}`,
        undefined,
        {
          direction: directionText,
        },
      );
    } catch (error) {
      const errorMsg = `Scroll operation failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("scroll", "error", errorMsg, undefined, {
        direction: directionText,
        suggestion:
          "Check if the device is responding and the scroll area is valid",
      });
      throw new Error(errorMsg);
    }
  }

  private getScrollDirectionText(direction: string): string {
    switch (direction) {
      case "up":
        return "Scroll Up";
      case "down":
        return "Scroll Down";
      case "left":
        return "Scroll Left";
      case "right":
        return "Scroll Right";
      default:
        return "Unknown Direction";
    }
  }

  private async executeSwipeNode(config: NodeConfig): Promise<void> {
    const startX = config.startX || 500;
    const startY = config.startY || 1000;
    const endX = config.endX || 500;
    const endY = config.endY || 500;
    const duration = config.duration || 500;

    const startPos = `(${startX}, ${startY})`;
    const endPos = `(${endX}, ${endY})`;

    this.addLog(
      "swipe",
      "running",
      `Swipe operation: ${startPos} → ${endPos}`,
      undefined,
      {
        startPosition: startPos,
        endPosition: endPos,
        duration: `${duration}ms`,
      },
    );

    try {
      await this.operations!.performSwipe(config);

      this.addLog("swipe", "success", `Swipe operation successful`, undefined, {
        startPosition: startPos,
        endPosition: endPos,
      });
    } catch (error) {
      const errorMsg = `Swipe operation failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("swipe", "error", errorMsg, undefined, {
        startPosition: startPos,
        endPosition: endPos,
        suggestion:
          "Check if coordinates are within screen bounds and the device is responding",
      });
      throw new Error(errorMsg);
    }
  }

  private async executeConditionNode(config: NodeConfig): Promise<boolean> {
    if (!config.selector) {
      throw new Error("Condition node configuration error: missing selector");
    }

    const operator = config.operator || "exists";
    const operatorText = this.getOperatorText(operator);

    this.addLog(
      "condition",
      "running",
      `Checking condition: ${operatorText}`,
      undefined,
      {
        selector: config.selector,
        operator: operatorText,
        expectedValue: config.value || "None",
      },
    );

    try {
      const conditionMet = await this.operations!.checkCondition(config);
      const resultText = conditionMet ? "Met" : "Not Met";

      this.addLog(
        "condition",
        "success",
        `Condition check: ${resultText}`,
        undefined,
        {
          selector: config.selector,
          operator: operatorText,
          checkResult: resultText,
        },
      );

      return conditionMet;
    } catch (error) {
      const errorMsg = `Condition check failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("condition", "error", errorMsg, undefined, {
        selector: config.selector,
        suggestion: "Check if the selector is correct and the element exists",
      });

      // Return false on condition check failure, do not throw exception
      return false;
    }
  }

  private getOperatorText(operator: string): string {
    switch (operator) {
      case "exists":
        return "Element Exists";
      case "contains":
        return "Contains Text";
      case "equals":
        return "Equals Text";
      default:
        return "Unknown Operation";
    }
  }

  private async executeLoopNode(
    config: NodeConfig,
  ): Promise<{ shouldLoop: boolean }> {
    const count = config.count || 1;
    const loopType = config.type || "count";
    const nodeId = `loop_${Date.now()}`;
    const currentIteration = this.context.variables[`${nodeId}_iteration`] || 0;
    const iterationNumber = currentIteration + 1;

    this.addLog(
      "loop",
      "running",
      `Loop node: Iteration ${iterationNumber}`,
      undefined,
      {
        loopType: this.getLoopTypeText(loopType),
        targetCount: count,
        currentIteration: iterationNumber,
      },
    );

    if (loopType === "count") {
      const shouldLoop = currentIteration < count;
      this.context.variables[`${nodeId}_iteration`] = iterationNumber;

      this.addLog(
        "loop",
        shouldLoop ? "running" : "success",
        `Loop condition: ${shouldLoop ? "Continue loop" : "End loop"}`,
        undefined,
        {
          currentIteration: iterationNumber,
          targetCount: count,
          shouldContinue: shouldLoop ? "Yes" : "No",
        },
      );

      return { shouldLoop };
    }

    this.addLog(
      "loop",
      "success",
      "Unknown loop type, ending loop",
      undefined,
      {
        loopType: loopType,
      },
    );

    return { shouldLoop: false };
  }

  private getLoopTypeText(loopType: string): string {
    switch (loopType) {
      case "count":
        return "Count Loop";
      case "while":
        return "While Loop";
      case "foreach":
        return "For Each Loop";
      default:
        return "Unknown Type";
    }
  }

  private async executeWaitNode(config: NodeConfig): Promise<void> {
    const duration = config.duration || 1000;
    const waitType = this.getWaitTypeText(duration);

    this.addLog("wait", "running", `Waiting ${duration}ms`, undefined, {
      waitType: waitType,
    });

    await this.operations!.performWait(duration);

    this.addLog("wait", "success", "Wait completed", duration, {
      waitType: waitType,
    });
  }

  private getWaitTypeText(duration: number): string {
    if (duration < 1000) {
      return "Short Wait";
    } else if (duration < 5000) {
      return "Medium Wait";
    } else {
      return "Long Wait";
    }
  }

  private async executeCloseNode(config: NodeConfig): Promise<void> {
    const method = config.method || "app";
    const target = config.target || "com.example.app";
    const methodText = method === "app" ? "Close App" : "Back Key";

    this.addLog("close", "running", `${methodText}: ${target}`, undefined, {
      closeMethod: methodText,
      target: target,
    });

    try {
      await this.operations!.closeApplication(config);

      this.addLog("close", "success", `${methodText} successful`, undefined, {
        target: target,
      });
    } catch (error) {
      const errorMsg = `${methodText} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addLog("close", "error", errorMsg, undefined, {
        target: target,
        suggestion:
          "Check if the app package name is correct and if the app is running",
      });
      throw new Error(errorMsg);
    }
  }

  stopExecution(): void {
    if (this.context.isRunning) {
      this.shouldStop = true;

      // If there is a currently executing node, update its status
      if (this.context.currentNodeId) {
        this.addLog(
          this.context.currentNodeId,
          "error",
          "Node execution stopped by user",
        );
      }

      this.updateContext({
        isRunning: false,
        currentNodeId: null,
      });

      this.addLog("workflow", "error", "Execution stopped by user", undefined, {
        stopTime: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          timeZone: "Asia/Shanghai",
        }),
      });

      console.log(
        "Execution has been stopped by the user, state has been reset",
      );
    }
  }

  getContext(): ExecutionContext {
    return this.context;
  }

  /**
   * 执行单个节点
   */
  async executeSingleNode(node: any, connectKey: string): Promise<void> {
    if (this.context.isRunning) {
      console.log("Workflow is already running, cannot execute single node");
      return;
    }

    this.shouldStop = false;

    // 初始化操作实例
    this.operations = new WorkflowOperations(this.client, connectKey);

    // Initialize single node execution state
    this.updateContext({
      isRunning: true,
      currentNodeId: node.id,
      executionLog: [],
      variables: {},
      nodeStatuses: { [node.id]: "running" },
    });

    // Log single node start
    this.addLog(
      node.id,
      "running",
      `Starting single node execution: ${node.data.label}`,
      undefined,
      {
        nodeType: node.type,
        device: connectKey,
      },
    );

    const startTime = Date.now();

    try {
      // Execute node logic directly
      await this.executeNodeLogic(node);

      if (this.shouldStop) {
        this.addLog(node.id, "error", "Single node execution stopped by user");
        return;
      }

      const duration = Date.now() - startTime;

      // Log single node execution success
      this.addLog(
        node.id,
        "success",
        `Single node execution completed: ${node.data.label}`,
        duration,
        {
          nodeType: node.type,
          executionTime: `${duration}ms`,
          performanceLevel: this.getPerformanceLevel(duration),
        },
      );

      // Ensure success status is set correctly
      console.log(
        `Node ${node.id} status updated to: ${this.context.nodeStatuses[node.id]}`,
      );
    } catch (error) {
      if (!this.shouldStop) {
        const duration = Date.now() - startTime;

        // Log single node execution failure
        this.addLog(
          node.id,
          "error",
          `Single node execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          duration,
          {
            nodeType: node.type,
            errorType:
              error instanceof Error ? error.constructor.name : "Unknown",
            suggestion: "Check node configuration and device connection status",
          },
        );

        // Ensure error status is set correctly
        console.log(
          `Node ${node.id} status updated to: ${this.context.nodeStatuses[node.id]}`,
        );
      }
      throw error;
    } finally {
      // Cleanup after execution - keep node status, only reset execution state
      this.updateContext({
        isRunning: false,
        currentNodeId: null,
        // Do not clear nodeStatuses, keep the final execution state of the node
      });

      const finalDuration = Date.now() - startTime;
      const statusText = this.shouldStop
        ? "Stopped by user"
        : "Completed normally";

      this.addLog(
        "workflow",
        "running",
        `Single node execution finished (${statusText})`,
        finalDuration,
        {
          totalDuration: `${finalDuration}ms`,
          nodeId: node.id,
          nodeLabel: node.data.label,
          nodeType: node.type,
          executionStatus: statusText,
          finalNodeStatus: this.context.nodeStatuses[node.id] || "unknown",
        },
      );

      console.log(
        `Single node execution finished: ${node.data.label} (${statusText}), node status: ${this.context.nodeStatuses[node.id] || "unknown"}`,
      );
    }
  }
}
