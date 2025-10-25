import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
  type OnConnect,
  MiniMap,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowExecution } from "@/hooks/useWorkflowExecution";
import { ExecutionStateManager } from "@/utils/executionStateManager";

import { StartNode } from "@/components/nodes/start-node";
import { ClickNode } from "@/components/nodes/click-node";
import { CloseNode } from "@/components/nodes/close-node";
import { WaitNode } from "@/components/nodes/wait-node";
import { ScrollNode } from "@/components/nodes/scroll-node";
import { ScreenshotNode } from "@/components/nodes/screenshot-node";
import { ConditionNode } from "@/components/nodes/condition-node";
import { LoopNode } from "@/components/nodes/loop-node";
import { SwipeNode } from "@/components/nodes/swipe-node";
import { WorkflowToolbar } from "@/components/workflow-toolbar";
import { WorkflowControls } from "@/components/workflow-controls";
import { InputNode } from "@/components/nodes/input-node";
import { ConditionalEdge } from "@/components/conditional-edge";
import { ExecutionLogDialog } from "@/components/execution-log";

import { motion } from "framer-motion";
import type { Status } from "@/components/type";
import { useTheme } from "@/components/theme-provider";
import type {
  SerializedExecutionContext,
  NodeExecutionStatus,
  WorkflowData,
} from "../../../types/workflow";
import type { Project } from "@/components/TestCase";

const nodeTypes: NodeTypes = {
  start: StartNode,
  click: ClickNode,
  print: InputNode,
  close: CloseNode,
  wait: WaitNode,
  scroll: ScrollNode,
  screenshot: ScreenshotNode,
  condition: ConditionNode,
  loop: LoopNode,
  swipe: SwipeNode,
};

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

interface AutomationFlowProps {
  selectedDevice: string;
  selectedProject: Project | null;
  testCaseWorkflow?: any;
}

export function AutomationFlow({
  selectedDevice,
  selectedProject,
  testCaseWorkflow,
}: AutomationFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { theme } = useTheme();

  // 使用新的工作流执行Hook
  const {
    executionState,
    setExecutionState,
    executeWorkflow: executeWorkflowNew,
    stopExecution: stopExecutionNew,
  } = useWorkflowExecution();

  // 创建执行状态管理器实例
  const executionStateManager = useRef(new ExecutionStateManager());

  const [showLogDialog, setShowLogDialog] = useState(false);

  const handleViewLog = () => {
    setShowLogDialog(true);
  };

  // 工作流执行器逻辑直接集成到组件中
  const nodeStatusUpdater = useRef<
    ((nodeId: string, status: NodeExecutionStatus) => void) | null
  >(null);

  // 设置主进程监听器
  useEffect(() => {
    if (window.api?.onWorkflowContextUpdate) {
      window.api.onWorkflowContextUpdate(
        (serializedContext: SerializedExecutionContext) => {
          console.log("收到主进程状态更新:", serializedContext);

          // 使用执行状态管理器更新状态
          executionStateManager.current.updateFromExecutionContext(
            serializedContext,
          );

          // 同时更新useWorkflowExecution的状态
          setExecutionState((prev) => {
            const newState = {
              ...prev,
              isRunning: serializedContext.isRunning,
              currentNodeId: serializedContext.currentNodeId,
              executionLog: serializedContext.executionLog.map((entry) => ({
                ...entry,
                timestamp: new Date(entry.timestamp),
              })),
              variables: serializedContext.variables,
              nodeStatuses: new Map(
                Object.entries(serializedContext.nodeStatuses || {}) as [
                  string,
                  NodeExecutionStatus,
                ][],
              ),
            };
            console.log("更新执行状态:", newState);
            return newState;
          });

          // 从ExecutionContext中获取节点状态并更新UI
          if (serializedContext.nodeStatuses) {
            Object.entries(serializedContext.nodeStatuses).forEach(
              ([nodeId, status]) => {
                if (nodeStatusUpdater.current) {
                  nodeStatusUpdater.current(
                    nodeId,
                    status as NodeExecutionStatus,
                  );
                } else {
                  // 如果nodeStatusUpdater不存在，直接更新nodes状态
                  setNodes((nds) =>
                    nds.map((node) =>
                      node.id === nodeId
                        ? {
                            ...node,
                            data: {
                              ...node.data,
                              executionStatus: status as Status,
                            },
                          }
                        : node,
                    ),
                  );
                }
              },
            );
          }
        },
      );
    }
  }, [setNodes]);

  // 处理测试用例工作流加载
  useEffect(() => {
    if (testCaseWorkflow) {
      // 加载工作流
      loadWorkflow(testCaseWorkflow);
    }
  }, [testCaseWorkflow]);

  // 序列化单个节点数据
  const serializeSingleNode = useCallback((node: Node): any => {
    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.data.label,
        config: node.data.config || {},
        executionStatus: node.data.executionStatus || "idle",
        isCurrentNode: node.data.isCurrentNode || false,
        // 移除函数属性，避免IPC克隆错误
      },
    };
  }, []);

  // 使用ref来获取最新的nodes值，避免闭包问题
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // 单节点执行功能 - 使用新的状态管理
  const executeSingleNode = useCallback(
    async (nodeId: string) => {
      if (executionState.isRunning) {
        console.log("工作流正在执行中，无法执行单节点");
        return;
      }

      const targetNode = nodesRef.current.find((node) => node.id === nodeId);
      if (!targetNode) {
        console.error("未找到目标节点:", nodeId);
        return;
      }

      try {
        console.log("开始执行单节点:", targetNode.data.label);

        // 直接更新useWorkflowExecution的状态
        setExecutionState((prev) => ({
          ...prev,
          isRunning: true,
          currentNodeId: nodeId,
        }));

        // 使用序列化函数创建可序列化的节点对象
        const serializableNode = serializeSingleNode(targetNode);

        console.log("开始执行单节点:", nodeId);
        const result = await window.api?.executeSingleNode(serializableNode, selectedDevice);

        // 重置本地执行状态（节点状态由主进程通过 workflow-context-update 同步）
        setExecutionState((prev) => ({
          ...prev,
          isRunning: false,
          currentNodeId: null,
        }));

        // 检查执行结果
        if (result?.success) {
          console.log("单节点执行成功:", nodeId);
        } else {
          console.error("单节点执行失败:", result?.error || "未知错误");
          throw new Error(result?.error || "单节点执行失败");
        }
      } catch (error) {
        console.error("单节点执行异常:", error);

        // 执行异常，重置本地执行状态
        setExecutionState((prev) => ({
          ...prev,
          isRunning: false,
          currentNodeId: null,
        }));

        // 节点错误状态由主进程管理，这里不需要主动更新

        console.log("单节点执行失败，状态已更新:", nodeId);
      }
    },
    [
      executionState.isRunning,
      selectedDevice,
      serializeSingleNode,
      setExecutionState,
      setNodes,
    ],
  );

  // 初始化节点的onConfigChange函数和单节点执行回调
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isCurrentNode: executionState.currentNodeId === node.id,
          selectedDevice, // 添加 selectedDevice 到节点数据中
          // 提供正确的onConfigChange实现
          onConfigChange: (newConfig) => {
            setNodes((updatedNodes) =>
              updatedNodes.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, config: newConfig } }
                  : n,
              ),
            );
          },
          // 提供单节点执行回调
          onSingleNodeExecute: (nodeId: string) => {
            executeSingleNode(nodeId);
          },
        },
      })),
    );
  }, [executionState.currentNodeId, setNodes, executeSingleNode, selectedDevice]); // 添加 selectedDevice 到依赖数组

  // 设置节点状态更新器
  useEffect(() => {
    nodeStatusUpdater.current = (
      nodeId: string,
      status: NodeExecutionStatus,
    ) => {
      console.log(`更新节点状态: ${nodeId} -> ${status}`);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: { ...node.data, executionStatus: status as Status },
              }
            : node,
        ),
      );
    };

    // 设置执行状态管理器的节点状态更新器
    executionStateManager.current.setNodeStatusUpdater(
      (nodeId: string, status: NodeExecutionStatus) => {
        console.log(`执行状态管理器更新节点状态: ${nodeId} -> ${status}`);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: { ...node.data, executionStatus: status as Status },
                }
              : node,
          ),
        );
      },
    );
  }, [setNodes]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      // 检查是否从特殊节点连接，如果是则使用相应的边类型
      const sourceNode = nodesRef.current.find(
        (node) => node.id === params.source,
      );
      const isConditionalEdge =
        sourceNode?.type === "condition" && params.sourceHandle;
      const isLoopEdge = sourceNode?.type === "loop" && params.sourceHandle;

      const edgeParams = {
        ...params,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined,
        type: isConditionalEdge || isLoopEdge ? "conditional" : undefined,
      };
      setEdges((eds) => addEdge(edgeParams as Edge, eds));
    },
    [setEdges],
  );

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: getNodeLabel(type),
          config: getDefaultConfig(type),
          executionStatus: "idle",
          isCurrentNode: false,
          selectedDevice, // 添加 selectedDevice 到节点数据中
          onConfigChange: (newConfig) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id
                  ? { ...node, data: { ...node.data, config: newConfig } }
                  : node,
              ),
            );
          },
          onSingleNodeExecute: (nodeId: string) => {
            executeSingleNode(nodeId);
          },
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, selectedDevice], // 添加 selectedDevice 到依赖数组
  );

  const executeWorkflow = useCallback(async () => {
    if (executionState.isRunning) {
      console.log("工作流正在执行中，忽略重复执行请求");
      return;
    }

    try {
      // 使用新的工作流执行方法
      await executeWorkflowNew(nodes, edges, selectedDevice, {
        onProgress: (progress) => {
          console.log("工作流执行进度:", progress);
        },
        onNodeComplete: (nodeId, result) => {
          console.log("节点执行完成:", nodeId, result);
        },
        onError: (error) => {
          console.error("工作流执行错误:", error);
        },
      });
    } catch (error) {
      console.error("工作流执行失败:", error);
    }
  }, [
    nodes,
    edges,
    executionState.isRunning,
    executeWorkflowNew,
    selectedDevice,
  ]);

  const stopExecution = useCallback(async () => {
    try {
      await stopExecutionNew();
    } catch (error) {
      console.error("停止工作流失败:", error);
    }
  }, [stopExecutionNew]);

  const loadWorkflow = useCallback(
    (workflow: WorkflowData) => {
      // 处理导入的节点，确保每个节点都有onConfigChange函数和单节点执行回调
      const processedNodes = workflow.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          // 确保有config对象
          config: node.data.config || {},
          selectedDevice, // 添加 selectedDevice 到节点数据中
          // 提供正确的onConfigChange实现
          onConfigChange: (newConfig) => {
            setNodes((updatedNodes) =>
              updatedNodes.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, config: newConfig } }
                  : n,
              ),
            );
          },
          // 提供单节点执行回调
          onSingleNodeExecute: (nodeId: string) => {
            executeSingleNode(nodeId);
          },
        },
      }));

      setNodes(processedNodes);
      setEdges(workflow.edges);
    },
    [setNodes, setEdges, selectedDevice], // 添加 selectedDevice 到依赖数组
  );

  const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
    style: {
      // stroke: '#3b82f6',
      strokeWidth: 2,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full flex"
    >
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          defaultEdgeOptions={defaultEdgeOptions}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={theme}
          defaultViewport={{ x: 100, y: 100, zoom: 1.0 }}
          minZoom={0.1}
          maxZoom={4}
          fitViewOptions={{
            padding: 0.2,
            maxZoom: 1.2,
            minZoom: 0.5,
          }}
        >
          <Background gap={12} />
          <MiniMap />
          <Controls />
        </ReactFlow>

        <WorkflowToolbar
          onAddNode={addNode}
          currentNodes={nodes}
          currentEdges={edges}
          onLoadWorkflow={loadWorkflow}
        />

        <WorkflowControls
          onExecute={executeWorkflow}
          onStop={stopExecution}
          isRunning={executionState.isRunning}
          currentNodes={nodes}
          currentEdges={edges}
          onLoadWorkflow={loadWorkflow}
          onViewLog={handleViewLog}
          selectedProject={selectedProject}
        />

        <ExecutionLogDialog
          open={showLogDialog}
          onClose={() => setShowLogDialog(false)}
          context={{
            isRunning: executionState.isRunning,
            currentNodeId: executionState.currentNodeId,
            executionLog: executionState.executionLog,
            variables: executionState.variables,
            nodeStatuses: Object.fromEntries(executionState.nodeStatuses),
          }}
        />
      </div>
    </motion.div>
  );
}

function getNodeLabel(type: string): string {
  switch (type) {
    case "start":
      return "开始";
    case "click":
      return "点击";
    case "print":
      return "输入";
    case "close":
      return "关闭";
    case "wait":
      return "等待";
    case "scroll":
      return "滚动";
    case "screenshot":
      return "截图";
    case "condition":
      return "条件";
    case "loop":
      return "循环";
    case "swipe":
      return "滑动";
    case "variable":
      return "变量";
    case "keyboard":
      return "按键";
    case "drag":
      return "拖拽";
    default:
      return "未知";
  }
}

function getDefaultConfig(type: string) {
  switch (type) {
    case "start":
      return {
        appName: "com.xx.xx",
        startingMode: "coldBoot",
        waitTime: 2000,
      };
    case "click":
      return {
        selector: "",
        x: 0,
        y: 0,
        clickType: "click",
        waitTime: 1000,
        retryCount: 3,
      };
    case "print":
      return {
        selector: "",
        text: "",
        waitTime: 1000,
        retryCount: 3,
      };
    case "close":
      return {
        target: "",
        closeMode: "Force",
        waitTime: 1000,
      };
    case "wait":
      return { duration: 1000, unit: "milliseconds", waitType: "fixed" };
    case "scroll":
      return {
        direction: "down",
        distance: 100,
        smooth: "true",
        speed: 500,
      };
    case "screenshot":
      return {
        fullScreen: true,
        filename: "screenshot",
        selector: "",
        format: "png",
      };
    case "condition":
      return {
        selector: "",
        operator: "exists",
        value: "",
        attribute: "text",
        waitTime: 5000,
        retryCount: 3,
      };
    case "loop":
      return {
        type: "count",
        count: 3,
        selector: "",
        condition: "",
        maxIterations: 10,
        waitTime: 2000,
      };
    case "swipe":
      return {
        selector: "",
        direction: "up",
        duration: 500,
        startX: 0,
        startY: 0,
        endX: 1000,
        endY: 800,
      };
    case "variable":
      return { name: "", value: "", type: "string" };
    case "keyboard":
      return { keys: "", modifier: "", waitAfter: 500 };
    case "drag":
      return {
        fromSelector: "",
        toSelector: "",
        fromX: 0,
        fromY: 0,
        toX: 0,
        toY: 0,
      };
    default:
      return {};
  }
}
