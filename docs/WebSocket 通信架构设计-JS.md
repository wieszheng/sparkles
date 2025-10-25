## 🔌 WebSocket 通信架构设计

### 📡 通信架构图

![WebSocket 通信架构图](/backend/screenshots/mermaid_20250914225715.svg)

### 🔄 消息协议设计

1. 消息类型定义

```js
// 消息基础结构
interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: number;
  workflowId: string;
}

// 消息类型枚举
enum MessageType {
  // 执行控制
  WORKFLOW_START = 'workflow.start',
  WORKFLOW_PAUSE = 'workflow.pause',
  WORKFLOW_RESUME = 'workflow.resume',
  WORKFLOW_STOP = 'workflow.stop',
  
  // 节点状态
  NODE_PENDING = 'node.pending',
  NODE_RUNNING = 'node.running',
  NODE_SUCCESS = 'node.success',
  NODE_ERROR = 'node.error',
  NODE_SKIPPED = 'node.skipped',
  
  // 执行状态
  EXECUTION_PROGRESS = 'execution.progress',
  EXECUTION_LOG = 'execution.log',
  EXECUTION_COMPLETE = 'execution.complete',
  EXECUTION_ERROR = 'execution.error',
  
  // 系统状态
  SYSTEM_STATUS = 'system.status',
  HEARTBEAT = 'heartbeat'
}


```

2. 具体消息格式

```js
// 工作流启动消息
interface WorkflowStartMessage extends BaseMessage {
  type: MessageType.WORKFLOW_START;
  payload: {
    nodes: Node[];
    edges: Edge[];
    config: ExecutionConfig;
  };
}

// 节点状态更新消息
interface NodeStatusMessage extends BaseMessage {
  type: MessageType.NODE_RUNNING | MessageType.NODE_SUCCESS | MessageType.NODE_ERROR;
  payload: {
    nodeId: string;
    status: NodeStatus;
    data?: any;
    error?: string;
    duration?: number;
    progress?: number;
  };
}

// 执行进度消息
interface ExecutionProgressMessage extends BaseMessage {
  type: MessageType.EXECUTION_PROGRESS;
  payload: {
    totalNodes: number;
    completedNodes: number;
    currentNode: string;
    progress: number;
    estimatedTimeRemaining?: number;
  };
}

// 执行日志消息
interface ExecutionLogMessage extends BaseMessage {
  type: MessageType.EXECUTION_LOG;
  payload: {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    nodeId?: string;
    context?: Record<string, any>;
  };
}
```

### 🏗️ 实现架构
1. WebSocket 服务端设计

```js
class WorkflowWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket>;
  private executionEngine: WorkflowExecutionEngine;
  
  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.clients = new Map();
    this.executionEngine = new WorkflowExecutionEngine();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // 监听执行引擎事件
    this.executionEngine.on('nodeStatusChange', this.handleNodeStatusChange);
    this.executionEngine.on('executionProgress', this.handleExecutionProgress);
    this.executionEngine.on('executionLog', this.handleExecutionLog);
  }
  
  private handleNodeStatusChange = (event: NodeStatusEvent) => {
    this.broadcast({
      id: generateId(),
      type: MessageType.NODE_RUNNING, // 根据实际状态
      timestamp: Date.now(),
      workflowId: event.workflowId,
      payload: {
        nodeId: event.nodeId,
        status: event.status,
        data: event.data,
        duration: event.duration
      }
    });
  };
  
  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}
```

2. 前端 WebSocket 客户端
```js
class WorkflowWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<MessageType, Function[]> = new Map();
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('WebSocket 连接已建立');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket 连接已关闭');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  }
  
  private handleMessage(message: any) {
    const handlers = this.eventHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));
  }
  
  on(messageType: MessageType, handler: Function) {
    if (!this.eventHandlers.has(messageType)) {
      this.eventHandlers.set(messageType, []);
    }
    this.eventHandlers.get(messageType)!.push(handler);
  }
  
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

### 🎯 集成到现有系统
1. 执行引擎集成
```js
// 增强现有的 WorkflowExecutor
class EnhancedWorkflowExecutor extends WorkflowExecutor {
  private wsClient: WorkflowWebSocketClient;
  
  constructor(wsClient: WorkflowWebSocketClient) {
    super();
    this.wsClient = wsClient;
    this.setupWebSocketHandlers();
  }
  
  private setupWebSocketHandlers() {
    // 监听来自服务端的消息
    this.wsClient.on(MessageType.NODE_RUNNING, this.handleNodeRunning);
    this.wsClient.on(MessageType.NODE_SUCCESS, this.handleNodeSuccess);
    this.wsClient.on(MessageType.NODE_ERROR, this.handleNodeError);
  }
  
  async executeWorkflow(nodes: Node[], edges: Edge[]) {
    // 发送工作流启动消息
    this.wsClient.send({
      id: generateId(),
      type: MessageType.WORKFLOW_START,
      timestamp: Date.now(),
      workflowId: this.workflowId,
      payload: { nodes, edges, config: this.config }
    });
    
    // 原有执行逻辑...
  }
  
  private handleNodeRunning = (message: NodeStatusMessage) => {
    // 更新UI状态
    this.nodeStatusUpdater?.(message.payload.nodeId, 'running');
    this.updateNodeProgress(message.payload.nodeId, message.payload.progress);
  };
}
```
2. React 组件集成
```js
// 在主要的工作流组件中集成 WebSocket
function WorkflowCanvas() {
  const [wsClient] = useState(() => new WorkflowWebSocketClient());
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeStatus>>(new Map());
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
  
  useEffect(() => {
    // 连接 WebSocket
    wsClient.connect('ws://localhost:8080');
    
    // 监听节点状态更新
    wsClient.on(MessageType.NODE_RUNNING, (message: NodeStatusMessage) => {
      setNodeStatuses(prev => new Map(prev.set(message.payload.nodeId, message.payload.status)));
    });
    
    // 监听执行日志
    wsClient.on(MessageType.EXECUTION_LOG, (message: ExecutionLogMessage) => {
      setExecutionLogs(prev => [...prev, {
        id: message.id,
        timestamp: new Date(message.timestamp),
        level: message.payload.level,
        message: message.payload.message,
        nodeId: message.payload.nodeId
      }]);
    });
    
    return () => {
      wsClient.disconnect();
    };
  }, []);
  
  // 组件渲染逻辑...
}

```
🔧 高级特性
1. 实时状态同步
节点执行状态实时更新
执行进度实时展示
错误信息即时反馈
2. 多客户端支持
支持多个前端同时连接
状态广播到所有客户端
客户端状态同步
3. 断线重连
自动重连机制
状态恢复
消息队列缓存
4. 性能优化
消息批量发送
状态变化去重
连接池管理
📊 监控与调试
1. 连接监控
连接状态监控
消息传输统计
延迟监控
2. 调试工具
消息日志查看
状态变化追踪
性能分析

