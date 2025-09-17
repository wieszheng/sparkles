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
import {
  WorkflowExecutor,
  type ExecutionContext,
} from "@/lib/workflow-executor";
import type { WorkflowData } from "@/lib/workflow-storage";
import { motion } from "framer-motion";
import type { Status } from "@/components/type";
import { useTheme } from "@/components/theme-provider";

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

const initialNodes: Node[] = [
  {
    id: "start",
    type: "start",
    position: { x: -537, y: 121 },
    data: {
      label: "开始",
      isCurrentNode: false,
      onConfigChange: () => {}, // 临时空函数，会在组件内部被替换
    },
  },
  {
    id: "close",
    type: "close",
    position: {
      x: 169,
      y: 103,
    },
    data: {
      label: "关闭",
      isCurrentNode: false,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "start-to-close",
    source: "start",
    target: "close",
  },
];

export function AutomationFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { theme } = useTheme();

  const [executionContext, setExecutionContext] = useState<ExecutionContext>({
    isRunning: false,
    currentNodeId: null,
    executionLog: [],
    variables: {},
  });

  const [showLogDialog, setShowLogDialog] = useState(false);

  const handleViewLog = () => {
    setShowLogDialog(true);
  };

  const executorRef = useRef<WorkflowExecutor | null>(null);

  if (!executorRef.current) {
    executorRef.current = new WorkflowExecutor((context) => {
      setExecutionContext(context);
    });
  }

  // 初始化节点的onConfigChange函数
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isCurrentNode: executionContext.currentNodeId === node.id,
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
        },
      })),
    );
  }, [executionContext.currentNodeId, setNodes]);

  const updateNodeExecutionStatus = useCallback(
    (nodeId: string, status: Status) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, executionStatus: status } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  useEffect(() => {
    if (executorRef.current) {
      executorRef.current.setNodeStatusUpdater(updateNodeExecutionStatus);
    }
  }, [updateNodeExecutionStatus]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      // 检查是否从特殊节点连接，如果是则使用相应的边类型
      const sourceNode = nodes.find((node) => node.id === params.source);
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
    [setEdges, nodes],
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
          onConfigChange: (newConfig) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id
                  ? { ...node, data: { ...node.data, config: newConfig } }
                  : node,
              ),
            );
          },
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const executeWorkflow = useCallback(async () => {
    if (!executorRef.current) return;

    if (executionContext.isRunning) {
      console.log("工作流正在执行中，忽略重复执行请求");
      return;
    }

    try {
      await executorRef.current.executeWorkflow(nodes, edges);
    } catch (error) {
      console.error("工作流执行失败:", error);
    }
  }, [nodes, edges, executionContext.isRunning]);

  const stopExecution = useCallback(async () => {
    if (executorRef.current) {
      await executorRef.current.stopExecution();
    }
  }, []);

  const loadWorkflow = useCallback(
    (workflow: WorkflowData) => {
      // 处理导入的节点，确保每个节点都有onConfigChange函数
      const processedNodes = workflow.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          // 确保有config对象
          config: node.data.config || {},
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
        },
      }));

      setNodes(processedNodes);
      setEdges(workflow.edges);
    },
    [setNodes, setEdges],
  );

  const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
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
          defaultViewport={{ x: 100, y: 100, zoom: 1.3 }}
          minZoom={0.1}
          maxZoom={4}
          fitView
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
          isRunning={executionContext.isRunning}
          currentNodes={nodes}
          currentEdges={edges}
          onLoadWorkflow={loadWorkflow}
          onViewLog={handleViewLog}
        />

        <ExecutionLogDialog
          open={showLogDialog}
          onClose={() => setShowLogDialog(false)}
          context={executionContext}
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
      return { appName: "", waitTime: 2000 };
    case "click":
      return { selector: "", clickType: "left", waitTime: 1000, retryCount: 3 };
    case "print":
      return {
        selector: "",
        text: "",
        clearFirst: "true",
        waitTime: 1000,
        retryCount: 3,
      };
    case "close":
      return { method: "window", target: "", confirmClose: false };
    case "wait":
      return { duration: 1000, unit: "milliseconds", waitType: "fixed" };
    case "scroll":
      return { direction: "down", distance: 100, smooth: "true" };
    case "screenshot":
      return {
        filename: "screenshot",
        fullScreen: true,
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
        distance: 300,
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
