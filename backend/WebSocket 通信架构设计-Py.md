# 使用 Python + FastAPI 来实现 WebSocket 服务端是一个非常优秀的方案。FastAPI 对 WebSocket 有很好的原生支持，而且性能出色。让我为您设计一个基于 FastAPI 的工作流执行服务。

基于 Python + FastAPI 的工作流执行服务设计方案：

### 🏗️ 项目结构
```sh
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── websocket/
│   │   ├── __init__.py
│   │   ├── manager.py          # WebSocket 连接管理器
│   │   └── handlers.py         # WebSocket 消息处理器
│   ├── workflow/
│   │   ├── __init__.py
│   │   ├── executor.py         # 工作流执行引擎
│   │   ├── nodes.py           # 节点执行器
│   │   └── models.py          # 数据模型
│   ├── models/
│   │   ├── __init__.py
│   │   ├── messages.py        # WebSocket 消息模型
│   │   └── workflow.py        # 工作流数据模型
│   └── utils/
│       ├── __init__.py
│       └── logger.py          # 日志工具
├── requirements.txt
└── run.py
```

### 📦 核心依赖 (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
pydantic==2.5.0
asyncio==3.4.3
python-multipart==0.0.6
aiofiles==23.2.1
```

### 🔌 WebSocket 连接管理器
```py
# app/websocket/manager.py
import json
import asyncio
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from app.models.messages import BaseMessage, MessageType
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.workflow_subscribers: Dict[str, Set[str]] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"客户端 {client_id} 已连接")
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            # 清理订阅关系
            for workflow_id in list(self.workflow_subscribers.keys()):
                self.workflow_subscribers[workflow_id].discard(client_id)
                if not self.workflow_subscribers[workflow_id]:
                    del self.workflow_subscribers[workflow_id]
            logger.info(f"客户端 {client_id} 已断开连接")
    
    def subscribe_workflow(self, client_id: str, workflow_id: str):
        if workflow_id not in self.workflow_subscribers:
            self.workflow_subscribers[workflow_id] = set()
        self.workflow_subscribers[workflow_id].add(client_id)
        
    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"发送消息到客户端 {client_id} 失败: {e}")
                self.disconnect(client_id)
    
    async def broadcast_to_workflow(self, message: dict, workflow_id: str):
        if workflow_id in self.workflow_subscribers:
            disconnected_clients = []
            for client_id in self.workflow_subscribers[workflow_id]:
                try:
                    await self.send_personal_message(message, client_id)
                except:
                    disconnected_clients.append(client_id)
            
            # 清理断开的连接
            for client_id in disconnected_clients:
                self.disconnect(client_id)
    
    async def broadcast_all(self, message: dict):
        disconnected_clients = []
        for client_id in list(self.active_connections.keys()):
            try:
                await self.send_personal_message(message, client_id)
            except:
                disconnected_clients.append(client_id)
        
        # 清理断开的连接
        for client_id in disconnected_clients:
            self.disconnect(client_id)

manager = ConnectionManager()

```

### 📨 消息模型定义
```py
# app/models/messages.py
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime

class MessageType(str, Enum):
    # 执行控制
    WORKFLOW_START = "workflow.start"
    WORKFLOW_PAUSE = "workflow.pause"
    WORKFLOW_RESUME = "workflow.resume"
    WORKFLOW_STOP = "workflow.stop"
    
    # 节点状态
    NODE_PENDING = "node.pending"
    NODE_RUNNING = "node.running"
    NODE_SUCCESS = "node.success"
    NODE_ERROR = "node.error"
    NODE_SKIPPED = "node.skipped"
    
    # 执行状态
    EXECUTION_PROGRESS = "execution.progress"
    EXECUTION_LOG = "execution.log"
    EXECUTION_COMPLETE = "execution.complete"
    EXECUTION_ERROR = "execution.error"
    
    # 系统状态
    SYSTEM_STATUS = "system.status"
    HEARTBEAT = "heartbeat"

class BaseMessage(BaseModel):
    id: str
    type: MessageType
    timestamp: float
    workflow_id: str

class WorkflowStartMessage(BaseMessage):
    type: MessageType = MessageType.WORKFLOW_START
    payload: Dict[str, Any]

class NodeStatusMessage(BaseMessage):
    payload: Dict[str, Any]

class ExecutionProgressMessage(BaseMessage):
    type: MessageType = MessageType.EXECUTION_PROGRESS
    payload: Dict[str, Any]

class ExecutionLogMessage(BaseMessage):
    type: MessageType = MessageType.EXECUTION_LOG
    payload: Dict[str, Any]
```

### ⚙️ 工作流执行引擎
```py
# app/workflow/executor.py
import asyncio
import time
import uuid
from typing import Dict, List, Any, Optional
from app.models.messages import MessageType, NodeStatusMessage, ExecutionProgressMessage, ExecutionLogMessage
from app.websocket.manager import manager
from app.workflow.nodes import NodeExecutor
import logging

logger = logging.getLogger(__name__)

class WorkflowExecutor:
    def __init__(self):
        self.running_workflows: Dict[str, bool] = {}
        self.node_executor = NodeExecutor()
        
    async def execute_workflow(self, workflow_id: str, nodes: List[Dict], edges: List[Dict]):
        """执行工作流"""
        if workflow_id in self.running_workflows:
            await self._send_log(workflow_id, "warn", "工作流已在执行中")
            return
            
        self.running_workflows[workflow_id] = True
        
        try:
            await self._send_log(workflow_id, "info", "开始执行工作流")
            
            # 构建执行图
            execution_graph = self._build_execution_graph(nodes, edges)
            
            # 查找开始节点
            start_node = next((node for node in nodes if node.get('type') == 'start'), None)
            if not start_node:
                raise Exception("未找到开始节点")
            
            # 执行工作流
            await self._execute_node(workflow_id, start_node, execution_graph, nodes)
            
            # 发送完成消息
            await manager.broadcast_to_workflow({
                "id": str(uuid.uuid4()),
                "type": MessageType.EXECUTION_COMPLETE,
                "timestamp": time.time(),
                "workflow_id": workflow_id,
                "payload": {"message": "工作流执行完成"}
            }, workflow_id)
            
        except Exception as e:
            logger.error(f"工作流执行失败: {e}")
            await self._send_error(workflow_id, str(e))
        finally:
            self.running_workflows.pop(workflow_id, None)
    
    async def stop_workflow(self, workflow_id: str):
        """停止工作流执行"""
        if workflow_id in self.running_workflows:
            self.running_workflows[workflow_id] = False
            await self._send_log(workflow_id, "info", "工作流执行已停止")
    
    def _build_execution_graph(self, nodes: List[Dict], edges: List[Dict]) -> Dict[str, List[Dict]]:
        """构建执行图"""
        graph = {node['id']: [] for node in nodes}
        
        for edge in edges:
            source_id = edge['source']
            target_id = edge['target']
            target_node = next((node for node in nodes if node['id'] == target_id), None)
            
            if target_node:
                graph[source_id].append({
                    'node': target_node,
                    'sourceHandle': edge.get('sourceHandle'),
                    'targetHandle': edge.get('targetHandle')
                })
        
        return graph
    
    async def _execute_node(self, workflow_id: str, node: Dict, graph: Dict, all_nodes: List[Dict]):
        """执行单个节点"""
        if not self.running_workflows.get(workflow_id, False):
            return
            
        node_id = node['id']
        
        # 发送节点开始执行状态
        await self._send_node_status(workflow_id, node_id, "running", {"message": f"开始执行节点: {node.get('data', {}).get('label', node_id)}"})
        
        start_time = time.time()
        
        try:
            # 执行节点逻辑
            result = await self.node_executor.execute_node(node)
            
            duration = time.time() - start_time
            
            # 发送节点成功状态
            await self._send_node_status(workflow_id, node_id, "success", {
                "message": f"节点执行成功: {node.get('data', {}).get('label', node_id)}",
                "duration": duration,
                "result": result
            })
            
            # 执行下一个节点
            await self._execute_next_nodes(workflow_id, node, graph, all_nodes, result)
            
        except Exception as e:
            duration = time.time() - start_time
            await self._send_node_status(workflow_id, node_id, "error", {
                "message": f"节点执行失败: {str(e)}",
                "duration": duration,
                "error": str(e)
            })
            raise
    
    async def _execute_next_nodes(self, workflow_id: str, current_node: Dict, graph: Dict, all_nodes: List[Dict], result: Any):
        """执行下一个节点"""
        node_id = current_node['id']
        next_connections = graph.get(node_id, [])
        
        # 根据节点类型和结果决定执行路径
        if current_node.get('type') == 'condition' and isinstance(result, bool):
            # 条件节点根据结果选择分支
            target_handle = "true" if result else "false"
            next_connections = [conn for conn in next_connections if conn.get('sourceHandle') == target_handle]
        
        # 执行所有符合条件的下一个节点
        for connection in next_connections:
            if self.running_workflows.get(workflow_id, False):
                await self._execute_node(workflow_id, connection['node'], graph, all_nodes)
    
    async def _send_node_status(self, workflow_id: str, node_id: str, status: str, payload: Dict):
        """发送节点状态更新"""
        message = {
            "id": str(uuid.uuid4()),
            "type": f"node.{status}",
            "timestamp": time.time(),
            "workflow_id": workflow_id,
            "payload": {
                "node_id": node_id,
                "status": status,
                **payload
            }
        }
        await manager.broadcast_to_workflow(message, workflow_id)
    
    async def _send_log(self, workflow_id: str, level: str, message: str, node_id: Optional[str] = None):
        """发送执行日志"""
        log_message = {
            "id": str(uuid.uuid4()),
            "type": MessageType.EXECUTION_LOG,
            "timestamp": time.time(),
            "workflow_id": workflow_id,
            "payload": {
                "level": level,
                "message": message,
                "node_id": node_id
            }
        }
        await manager.broadcast_to_workflow(log_message, workflow_id)
    
    async def _send_error(self, workflow_id: str, error_message: str):
        """发送错误消息"""
        message = {
            "id": str(uuid.uuid4()),
            "type": MessageType.EXECUTION_ERROR,
            "timestamp": time.time(),
            "workflow_id": workflow_id,
            "payload": {"error": error_message}
        }
        await manager.broadcast_to_workflow(message, workflow_id)

# 全局执行器实例
executor = WorkflowExecutor()

```
### 🔧 节点执行器
```py
# app/workflow/nodes.py
import asyncio
import random
from typing import Dict, Any, Union

class NodeExecutor:
    async def execute_node(self, node: Dict) -> Union[bool, Dict, None]:
        """执行节点逻辑"""
        node_type = node.get('type')
        config = node.get('data', {}).get('config', {})
        
        if node_type == 'start':
            return await self._execute_start_node(config)
        elif node_type == 'click':
            return await self._execute_click_node(config)
        elif node_type == 'input':
            return await self._execute_input_node(config)
        elif node_type == 'wait':
            return await self._execute_wait_node(config)
        elif node_type == 'condition':
            return await self._execute_condition_node(config)
        elif node_type == 'loop':
            return await self._execute_loop_node(config)
        elif node_type == 'screenshot':
            return await self._execute_screenshot_node(config)
        else:
            raise Exception(f"未知的节点类型: {node_type}")
    
    async def _execute_start_node(self, config: Dict) -> None:
        """执行开始节点"""
        wait_time = config.get('waitTime', 2000) / 1000
        await asyncio.sleep(wait_time)
        
        app_name = config.get('appName')
        if app_name:
            print(f"启动应用: {app_name}")
    
    async def _execute_click_node(self, config: Dict) -> None:
        """执行点击节点"""
        selector = config.get('selector', '')
        click_type = config.get('clickType', 'left')
        wait_time = config.get('waitTime', 1000) / 1000
        
        print(f"点击元素: {selector}, 类型: {click_type}")
        await asyncio.sleep(wait_time)
    
    async def _execute_input_node(self, config: Dict) -> None:
        """执行输入节点"""
        text = config.get('text', '')
        selector = config.get('selector', '')
        wait_time = config.get('waitTime', 1000) / 1000
        clear_first = config.get('clearFirst', False)
        
        if clear_first:
            print("清空输入框")
        
        print(f"在 {selector} 中输入: {text}")
        await asyncio.sleep(wait_time)
    
    async def _execute_wait_node(self, config: Dict) -> None:
        """执行等待节点"""
        duration = config.get('duration', 1000) / 1000
        print(f"等待 {duration} 秒")
        await asyncio.sleep(duration)
    
    async def _execute_condition_node(self, config: Dict) -> bool:
        """执行条件节点"""
        selector = config.get('selector', '')
        operator = config.get('operator', 'exists')
        value = config.get('value', '')
        wait_time = config.get('waitTime', 1000) / 1000
        
        print(f"检查条件: {selector} {operator} {value}")
        await asyncio.sleep(wait_time)
        
        # 模拟条件检查结果
        result = random.random() > 0.3  # 70% 成功率
        print(f"条件检查结果: {result}")
        return result
    
    async def _execute_loop_node(self, config: Dict) -> Dict:
        """执行循环节点"""
        loop_type = config.get('type', 'count')
        count = config.get('count', 1)
        wait_time = config.get('waitTime', 1000) / 1000
        
        print(f"循环类型: {loop_type}, 次数: {count}")
        await asyncio.sleep(wait_time)
        
        # 返回循环控制信息
        return {
            'shouldLoop': count > 0,
            'iterationCount': count
        }
    
    async def _execute_screenshot_node(self, config: Dict) -> None:
        """执行截图节点"""
        filename = config.get('filename', f'screenshot_{int(time.time())}.png')
        full_screen = config.get('fullScreen', True)
        
        print(f"截图保存为: {filename}")
        await asyncio.sleep(1)

```

### 🚀 FastAPI 主应用
```py
# app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import uuid
import time
from app.websocket.manager import manager
from app.workflow.executor import executor
from app.models.messages import MessageType

app = FastAPI(title="工作流执行服务", version="1.0.0")

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            await handle_websocket_message(message, client_id)
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)

async def handle_websocket_message(message: dict, client_id: str):
    """处理 WebSocket 消息"""
    message_type = message.get('type')
    workflow_id = message.get('workflow_id')
    payload = message.get('payload', {})
    
    if message_type == MessageType.WORKFLOW_START:
        # 订阅工作流
        manager.subscribe_workflow(client_id, workflow_id)
        
        # 开始执行工作流
        nodes = payload.get('nodes', [])
        edges = payload.get('edges', [])
        
        # 异步执行工作流
        import asyncio
        asyncio.create_task(executor.execute_workflow(workflow_id, nodes, edges))
        
    elif message_type == MessageType.WORKFLOW_STOP:
        await executor.stop_workflow(workflow_id)
        
    elif message_type == MessageType.HEARTBEAT:
        # 响应心跳
        await manager.send_personal_message({
            "id": str(uuid.uuid4()),
            "type": MessageType.HEARTBEAT,
            "timestamp": time.time(),
            "workflow_id": workflow_id,
            "payload": {"status": "alive"}
        }, client_id)

@app.get("/")
async def root():
    return {"message": "工作流执行服务运行中"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

```
### 🏃‍♂️ 启动脚本
```sh
# run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

```

### 🔧 前端集成示例
```js
// 前端 WebSocket 客户端集成
class WorkflowWebSocketClient {
  private ws: WebSocket | null = null;
  private clientId: string;
  
  constructor() {
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  connect() {
    this.ws = new WebSocket(`ws://localhost:8000/ws/${this.clientId}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket 连接已建立');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  startWorkflow(workflowId: string, nodes: any[], edges: any[]) {
    this.send({
      id: `msg_${Date.now()}`,
      type: 'workflow.start',
      timestamp: Date.now(),
      workflow_id: workflowId,
      payload: { nodes, edges }
    });
  }
  
  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```
这个基于 Python + FastAPI 的实现提供了：

* 高性能 WebSocket 服务 - 基于 FastAPI 和 uvicorn
* 异步执行引擎 - 支持并发工作流执行
* 实时状态同步 - 节点状态实时推送到前端
* 连接管理 - 支持多客户端连接和订阅
* 错误处理 - 完善的异常处理和日志记录
* 扩展性 - 易于添加新的节点类型和功能