from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union, Set
import time
import uuid
import asyncio
import os
import json
from automation_executor import AutomationExecutor

app = FastAPI(title="Workflow Executor API with WebSocket", version="2.0")

# 添加CORS中间件以允许前端请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
def generate_id() -> str:
    return str(uuid.uuid4())

class NodeData(BaseModel):
    label: str
    config: Optional[Dict[str, Any]] = None

class Node(BaseModel):
    id: str = Field(default_factory=generate_id)
    type: str
    data: NodeData
    position: Dict[str, float]

class Edge(BaseModel):
    id: str = Field(default_factory=generate_id)
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class ExecutionLogEntry(BaseModel):
    id: str = Field(default_factory=generate_id)
    nodeId: str
    timestamp: float
    status: str  # pending, running, success, error
    message: str
    duration: Optional[float] = None

class ExecutionContext(BaseModel):
    isRunning: bool = False
    currentNodeId: Optional[str] = None
    executionLog: List[ExecutionLogEntry] = []
    variables: Dict[str, Any] = {}

class NodeStatusUpdate(BaseModel):
    nodeId: str
    status: str
    message: str
    timestamp: float
    duration: Optional[float] = None

class WorkflowStatusUpdate(BaseModel):
    workflowId: str
    status: str
    currentNodeId: Optional[str] = None
    nodeUpdate: Optional[NodeStatusUpdate] = None
    message: str
    timestamp: float

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.workflow_subscribers: Dict[str, Set[str]] = {}  # workflow_id -> set of connection_ids

    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        print(f"WebSocket连接建立: {connection_id}")

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            print(f"WebSocket连接断开: {connection_id}")
        
        # 清理订阅关系
        for workflow_id in list(self.workflow_subscribers.keys()):
            if connection_id in self.workflow_subscribers[workflow_id]:
                self.workflow_subscribers[workflow_id].remove(connection_id)
                if not self.workflow_subscribers[workflow_id]:
                    del self.workflow_subscribers[workflow_id]

    def subscribe_to_workflow(self, connection_id: str, workflow_id: str):
        if workflow_id not in self.workflow_subscribers:
            self.workflow_subscribers[workflow_id] = set()
        self.workflow_subscribers[workflow_id].add(connection_id)
        print(f"连接 {connection_id} 订阅工作流 {workflow_id}")

    async def send_to_workflow_subscribers(self, workflow_id: str, message: Dict[str, Any]):
        """向订阅特定工作流的所有连接发送消息"""
        if workflow_id not in self.workflow_subscribers:
            return

        disconnected_connections = []
        for connection_id in self.workflow_subscribers[workflow_id]:
            if connection_id in self.active_connections:
                try:
                    await self.active_connections[connection_id].send_text(json.dumps(message))
                except Exception as e:
                    print(f"发送消息失败，连接 {connection_id}: {e}")
                    disconnected_connections.append(connection_id)
            else:
                disconnected_connections.append(connection_id)

        # 清理断开的连接
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)

    async def send_personal_message(self, connection_id: str, message: Dict[str, Any]):
        """向特定连接发送消息"""
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"发送个人消息失败，连接 {connection_id}: {e}")
                self.disconnect(connection_id)

# 全局状态管理
workflow_contexts: Dict[str, ExecutionContext] = {}
automation_executors: Dict[str, AutomationExecutor] = {}
manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Workflow Executor API with WebSocket is running"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": time.time()}

@app.websocket("/ws/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, connection_id: str):
    await manager.connect(websocket, connection_id)
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 处理订阅工作流消息
            if message.get("type") == "subscribe_workflow":
                workflow_id = message.get("workflow_id")
                if workflow_id:
                    manager.subscribe_to_workflow(connection_id, workflow_id)
                    await manager.send_personal_message(connection_id, {
                        "type": "subscription_confirmed",
                        "workflow_id": workflow_id
                    })
            
            # 处理心跳消息
            elif message.get("type") == "ping":
                await manager.send_personal_message(connection_id, {
                    "type": "pong",
                    "timestamp": time.time()
                })
                
    except WebSocketDisconnect:
        manager.disconnect(connection_id)
    except Exception as e:
        print(f"WebSocket错误: {e}")
        manager.disconnect(connection_id)

async def broadcast_node_status(workflow_id: str, node_id: str, status: str, message: str, duration: Optional[float] = None):
    """广播节点状态更新"""
    update = WorkflowStatusUpdate(
        workflowId=workflow_id,
        status="node_update",
        currentNodeId=node_id,
        nodeUpdate=NodeStatusUpdate(
            nodeId=node_id,
            status=status,
            message=message,
            timestamp=time.time(),
            duration=duration
        ),
        message=f"节点 {node_id} 状态: {status}",
        timestamp=time.time()
    )
    
    await manager.send_to_workflow_subscribers(workflow_id, {
        "type": "node_status_update",
        "data": update.dict()
    })

async def broadcast_workflow_status(workflow_id: str, status: str, message: str, current_node_id: Optional[str] = None):
    """广播工作流状态更新"""
    update = WorkflowStatusUpdate(
        workflowId=workflow_id,
        status=status,
        currentNodeId=current_node_id,
        message=message,
        timestamp=time.time()
    )
    
    await manager.send_to_workflow_subscribers(workflow_id, {
        "type": "workflow_status_update",
        "data": update.dict()
    })

@app.post("/execute-workflow")
async def execute_workflow(nodes: List[Node], edges: List[Edge]) -> Dict[str, Any]:
    """执行工作流"""
    workflow_id = generate_id()
    context = ExecutionContext()
    executor = AutomationExecutor()
    
    workflow_contexts[workflow_id] = context
    automation_executors[workflow_id] = executor
    
    # 广播工作流开始
    await broadcast_workflow_status(workflow_id, "started", "工作流开始执行")
    
    # 异步执行工作流
    asyncio.create_task(execute_workflow_async(workflow_id, nodes, edges, context, executor))
    
    return {
        "workflow_id": workflow_id,
        "success": True,
        "message": "工作流已开始执行"
    }

async def execute_workflow_async(
    workflow_id: str, 
    nodes: List[Node], 
    edges: List[Edge], 
    context: ExecutionContext, 
    executor: AutomationExecutor
):
    """异步执行工作流"""
    try:
        # 1. 验证工作流
        start_node = next((node for node in nodes if node.type == "start"), None)
        if not start_node:
            await broadcast_workflow_status(workflow_id, "error", "未找到开始节点")
            return

        # 2. 开始执行
        context.isRunning = True
        await broadcast_workflow_status(workflow_id, "running", "工作流正在执行", start_node.id)

        # 构建执行图
        execution_graph = build_execution_graph(nodes, edges)

        # 执行工作流并获取结果
        await execute_node_recursive(
            start_node,
            execution_graph,
            context,
            nodes,
            executor,
            workflow_id
        )

        # 3. 执行完成
        context.isRunning = False
        context.currentNodeId = None
        await broadcast_workflow_status(workflow_id, "completed", "工作流执行完成")

    except Exception as e:
        context.isRunning = False
        context.currentNodeId = None
        context.executionLog.append(
            ExecutionLogEntry(
                nodeId="workflow",
                timestamp=time.time(),
                status="error",
                message=f"工作流执行失败: {str(e)}"
            )
        )
        
        await broadcast_workflow_status(workflow_id, "error", f"工作流执行失败: {str(e)}")
        
        # 清理执行器
        executor.cleanup()
        if workflow_id in automation_executors:
            del automation_executors[workflow_id]

@app.get("/workflow-status/{workflow_id}")
async def get_workflow_status(workflow_id: str) -> Dict[str, Any]:
    """获取工作流执行状态"""
    if workflow_id not in workflow_contexts:
        return {"error": "工作流ID不存在"}
    
    context = workflow_contexts[workflow_id]
    return {
        "workflow_id": workflow_id,
        "status": "running" if context.isRunning else "completed",
        "execution_context": context
    }

@app.post("/stop-workflow/{workflow_id}")
async def stop_workflow(workflow_id: str) -> Dict[str, Any]:
    """停止工作流执行"""
    if workflow_id not in workflow_contexts:
        return {"error": "工作流ID不存在"}
    
    context = workflow_contexts[workflow_id]
    context.isRunning = False
    context.currentNodeId = None
    
    # 广播停止状态
    await broadcast_workflow_status(workflow_id, "stopped", "工作流执行已停止")
    
    # 清理执行器
    if workflow_id in automation_executors:
        automation_executors[workflow_id].cleanup()
        del automation_executors[workflow_id]
    
    return {
        "workflow_id": workflow_id,
        "success": True,
        "message": "工作流已停止"
    }

@app.get("/screenshots/{filename}")
async def get_screenshot(filename: str):
    """获取截图文件"""
    filepath = os.path.join("screenshots", filename)
    if os.path.exists(filepath):
        return FileResponse(filepath)
    else:
        raise HTTPException(status_code=404, detail="截图文件不存在")

# 辅助函数
def build_execution_graph(nodes: List[Node], edges: List[Edge]) -> Dict[str, List[Dict[str, Any]]]:
    """构建执行图"""
    graph = {}
    
    for node in nodes:
        graph[node.id] = []
    
    for edge in edges:
        target_node = next((node for node in nodes if node.id == edge.target), None)
        if target_node:
            graph[edge.source].append({
                "node": target_node,
                "sourceHandle": edge.sourceHandle,
                "targetHandle": edge.targetHandle
            })
    
    return graph

async def execute_node_recursive(
    node: Node,
    graph: Dict[str, List[Dict[str, Any]]],
    context: ExecutionContext,
    all_nodes: List[Node],
    executor: AutomationExecutor,
    workflow_id: str
) -> Union[bool, Dict[str, Any], None]:
    """递归执行节点"""
    # 更新节点状态
    context.currentNodeId = node.id
    start_time = time.time()
    
    # 广播节点开始执行
    await broadcast_node_status(workflow_id, node.id, "running", f"开始执行节点: {node.data.label}")
    
    # 记录开始执行日志
    context.executionLog.append(
        ExecutionLogEntry(
            nodeId=node.id,
            timestamp=start_time,
            status="running",
            message=f"开始执行节点: {node.data.label}"
        )
    )
    
    try:
        # 执行节点逻辑
        result = await execute_node_logic(node, executor)
        
        # 计算执行时间
        duration = time.time() - start_time
        
        # 广播节点执行成功
        await broadcast_node_status(workflow_id, node.id, "success", f"节点执行成功: {node.data.label}", duration)
        
        # 记录执行成功日志
        context.executionLog.append(
            ExecutionLogEntry(
                nodeId=node.id,
                timestamp=time.time(),
                status="success",
                message=f"节点执行成功: {node.data.label}",
                duration=duration
            )
        )
        
        # 处理条件节点结果
        if isinstance(result, bool):
            # 条件判断节点
            connections = graph.get(node.id, [])
            target_handle = "true" if result else "false"
            
            # 查找匹配的连接
            next_connections = [
                conn for conn in connections 
                if conn["sourceHandle"] == target_handle
            ]
            
            # 执行下一个节点
            for connection in next_connections:
                await execute_node_recursive(
                    connection["node"],
                    graph,
                    context,
                    all_nodes,
                    executor,
                    workflow_id
                )
                
        elif isinstance(result, dict) and "shouldLoop" in result:
            # 循环节点
            connections = graph.get(node.id, [])
            
            if result["shouldLoop"]:
                # 执行循环体分支
                loop_connections = [
                    conn for conn in connections 
                    if conn["sourceHandle"] == "loop"
                ]
                
                for connection in loop_connections:
                    await execute_node_recursive(
                        connection["node"],
                        graph,
                        context,
                        all_nodes,
                        executor,
                        workflow_id
                    )
            else:
                # 执行结束分支
                end_connections = [
                    conn for conn in connections 
                    if conn["sourceHandle"] == "end"
                ]
                
                for connection in end_connections:
                    await execute_node_recursive(
                        connection["node"],
                        graph,
                        context,
                        all_nodes,
                        executor,
                        workflow_id
                    )
        else:
            # 普通节点，执行所有连接的下一个节点
            connections = graph.get(node.id, [])
            for connection in connections:
                await execute_node_recursive(
                    connection["node"],
                    graph,
                    context,
                    all_nodes,
                    executor,
                    workflow_id
                )
        
        return result
        
    except Exception as e:
        # 计算执行时间
        duration = time.time() - start_time
        
        # 广播节点执行失败
        await broadcast_node_status(workflow_id, node.id, "error", f"节点执行失败: {str(e)}", duration)
        
        # 记录执行失败日志
        context.executionLog.append(
            ExecutionLogEntry(
                nodeId=node.id,
                timestamp=time.time(),
                status="error",
                message=f"节点执行失败: {str(e)}",
                duration=duration
            )
        )
        
        raise

async def execute_node_logic(node: Node, executor: AutomationExecutor) -> Union[bool, Dict[str, Any], None]:
    """执行节点具体逻辑"""
    config = node.data.config or {}
    
    switcher = {
        "start": executor.execute_start_node,
        "click": executor.execute_click_node,
        "print": executor.execute_input_node,
        "close": executor.execute_close_node,
        "wait": executor.execute_wait_node,
        "scroll": executor.execute_scroll_node,
        "screenshot": executor.execute_screenshot_node,
        "swipe": executor.execute_swipe_node,
        "condition": executor.execute_condition_node,
        "loop": executor.execute_loop_node
    }
    
    if node.type in switcher:
        return await switcher[node.type](config)
    else:
        raise ValueError(f"未知的节点类型: {node.type}")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    for executor in automation_executors.values():
        executor.cleanup()
    automation_executors.clear()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)