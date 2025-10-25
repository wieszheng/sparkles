/**
 * 工作流执行状态管理Hook
 * 提供更好的执行状态管理和单节点执行支持
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { NodeExecutionStatus } from "../../../types/workflow";

export interface WorkflowExecutionState {
  isRunning: boolean;
  currentNodeId: string | null;
  executionLog: any[];
  variables: Record<string, any>;
  nodeStatuses: Map<string, NodeExecutionStatus>;
}

export interface ExecutionOptions {
  timeout?: number;
  retryCount?: number;
  onProgress?: (progress: number) => void;
  onNodeComplete?: (nodeId: string, result: any) => void;
  onError?: (error: Error) => void;
}

export function useWorkflowExecution() {
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    isRunning: false,
    currentNodeId: null,
    executionLog: [],
    variables: {},
    nodeStatuses: new Map(),
  });

  const nodeStatusUpdater = useRef<
    ((nodeId: string, status: NodeExecutionStatus) => void) | null
  >(null);

  // 重置执行状态
  const resetExecutionState = useCallback(() => {
    setExecutionState({
      isRunning: false,
      currentNodeId: null,
      executionLog: [],
      variables: {},
      nodeStatuses: new Map(),
    });
  }, []);

  // 更新节点状态
  const updateNodeStatus = useCallback(
    (nodeId: string, status: NodeExecutionStatus) => {
      setExecutionState((prev) => {
        const newStatuses = new Map(prev.nodeStatuses);
        newStatuses.set(nodeId, status);
        return {
          ...prev,
          nodeStatuses: newStatuses,
        };
      });
    },
    [],
  );

  // 批量更新节点状态
  const updateMultipleNodeStatuses = useCallback(
    (statusMap: Map<string, NodeExecutionStatus>) => {
      setExecutionState((prev) => {
        const newStatuses = new Map(prev.nodeStatuses);
        statusMap.forEach((status, nodeId) => {
          newStatuses.set(nodeId, status);
        });
        return {
          ...prev,
          nodeStatuses: newStatuses,
        };
      });
    },
    [],
  );

  // 设置当前执行节点
  const setCurrentNode = useCallback((nodeId: string | null) => {
    setExecutionState((prev) => ({
      ...prev,
      currentNodeId: nodeId,
    }));
  }, []);

  // 添加执行日志
  const addExecutionLog = useCallback((logEntry: any) => {
    setExecutionState((prev) => ({
      ...prev,
      executionLog: [...prev.executionLog, logEntry],
    }));
  }, []);

  // 更新变量
  const updateVariables = useCallback((variables: Record<string, any>) => {
    setExecutionState((prev) => ({
      ...prev,
      variables: { ...prev.variables, ...variables },
    }));
  }, []);

  // 执行单个节点
  const executeSingleNode = useCallback(
    async (
      node: Node,
      connectKey: string,
      options: ExecutionOptions = {},
    ): Promise<any> => {
      if (executionState.isRunning) {
        throw new Error("工作流正在执行中，无法执行单节点");
      }

      const nodeId = node.id;

      try {
        // 设置执行状态
        setExecutionState((prev) => ({
          ...prev,
          isRunning: true,
          currentNodeId: nodeId,
        }));

        // 更新节点状态为运行中
        updateNodeStatus(nodeId, "running");

        // 添加执行日志
        addExecutionLog({
          id: `single-${Date.now()}`,
          nodeId,
          timestamp: new Date(),
          status: "running",
          message: `开始执行单节点: ${node.data.label}`,
        });

        // 创建可序列化的节点对象
        const serializableNode = {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data.label,
            config: node.data.config || {},
            executionStatus: "running",
            isCurrentNode: true,
          },
        };

        // 执行节点
        const result = await window.api?.executeSingleNode(
          serializableNode,
          connectKey,
        );

        // 更新节点状态为成功
        updateNodeStatus(nodeId, "success");

        // 添加成功日志
        addExecutionLog({
          id: `single-${Date.now()}`,
          nodeId,
          timestamp: new Date(),
          status: "success",
          message: `单节点执行完成: ${node.data.label}`,
          result,
        });

        // 调用完成回调
        options.onNodeComplete?.(nodeId, result);

        return result;
      } catch (error) {
        // 更新节点状态为错误
        updateNodeStatus(nodeId, "error");

        // 添加错误日志
        addExecutionLog({
          id: `single-${Date.now()}`,
          nodeId,
          timestamp: new Date(),
          status: "error",
          message: `单节点执行失败: ${error instanceof Error ? error.message : "未知错误"}`,
          error: error instanceof Error ? error.message : "未知错误",
        });

        // 调用错误回调
        options.onError?.(
          error instanceof Error ? error : new Error("未知错误"),
        );

        throw error;
      } finally {
        // 重置执行状态
        setExecutionState((prev) => ({
          ...prev,
          isRunning: false,
          currentNodeId: null,
        }));
      }
    },
    [executionState.isRunning, updateNodeStatus, addExecutionLog],
  );

  // 执行完整工作流
  const executeWorkflow = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      connectKey: string,
      options: ExecutionOptions = {},
    ): Promise<any> => {
      if (executionState.isRunning) {
        throw new Error("工作流正在执行中");
      }

      try {
        // 设置执行状态
        setExecutionState((prev) => ({
          ...prev,
          isRunning: true,
          currentNodeId: null,
          executionLog: [],
          nodeStatuses: new Map(),
        }));

        // 序列化节点和边
        const serializableNodes = nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data.label,
            config: node.data.config || {},
            executionStatus: "idle",
            isCurrentNode: false,
          },
        }));

        const serializableEdges = edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
        }));

        // 执行工作流
        const result = await window.api?.executeWorkflow(
          serializableNodes,
          serializableEdges,
          connectKey,
        );

        return result;
      } catch (error) {
        // 调用错误回调
        options.onError?.(
          error instanceof Error ? error : new Error("未知错误"),
        );
        throw error;
      } finally {
        // 重置执行状态
        resetExecutionState();
      }
    },
    [executionState.isRunning, resetExecutionState],
  );

  // 停止执行
  const stopExecution = useCallback(async (): Promise<void> => {
    try {
      await window.api?.stopWorkflow();
    } catch (error) {
      console.error("停止工作流失败:", error);
      throw error;
    } finally {
      resetExecutionState();
    }
  }, [resetExecutionState]);

  // 设置节点状态更新器
  useEffect(() => {
    nodeStatusUpdater.current = (
      nodeId: string,
      status: NodeExecutionStatus,
    ) => {
      updateNodeStatus(nodeId, status);
    };
  }, [updateNodeStatus]);

  return {
    executionState,
    setExecutionState,
    executeSingleNode,
    executeWorkflow,
    stopExecution,
    resetExecutionState,
    updateNodeStatus,
    updateMultipleNodeStatuses,
    setCurrentNode,
    addExecutionLog,
    updateVariables,
    nodeStatusUpdater,
  };
}
