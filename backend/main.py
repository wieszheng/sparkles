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

app = FastAPI(title="Workflow Executor API", version="1.0")

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

# 全局状态管理
workflow_contexts: Dict[str, ExecutionContext] = {}
automation_executors: Dict[str, AutomationExecutor] = {}

@app.get("/")
async def root():
    return {"message": "Workflow Executor API is running"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/execute-workflow")
async def execute_workflow(nodes: List[Node], edges: List[Edge]) -> Dict[str, Any]:
    """执行工作流"""
    workflow_id = generate_id()
    context = ExecutionContext()
    executor = AutomationExecutor()
    
    workflow_contexts[workflow_id] = context
    automation_executors[workflow_id] = executor
    
    try:
        # 1. 验证工作流
        start_node = next((node for node in nodes if node.type == "start"), None)
        if not start_node:
            raise ValueError("未找到开始节点")
        
        # 2. 开始执行
        context.isRunning = True
        
        # 构建执行图
        execution_graph = build_execution_graph(nodes, edges)
        print(execution_graph)
        # 执行工作流并获取结果
        result = await execute_node_recursive(
            start_node,
            execution_graph,
            context,
            nodes,
            executor
        )
        
        # 3. 返回执行结果
        context.isRunning = False
        context.currentNodeId = None
        
        return {
            "workflow_id": workflow_id,
            "success": True,
            "execution_context": context,
            "result": result
        }
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
        
        # 清理执行器
        executor.cleanup()
        if workflow_id in automation_executors:
            del automation_executors[workflow_id]
        
        return {
            "workflow_id": workflow_id,
            "success": False,
            "error": str(e),
            "execution_context": context
        }

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
    context.executionLog.append(
        ExecutionLogEntry(
            nodeId="workflow",
            timestamp=time.time(),
            status="error",
            message="工作流执行被停止"
        )
    )
    
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
    executor: AutomationExecutor
) -> Union[bool, Dict[str, Any], None]:
    """递归执行节点"""
    # 更新节点状态
    context.currentNodeId = node.id
    start_time = time.time()
    
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
                    executor
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
                        executor
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
                        executor
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
                    executor
                )
        
        return result
        
    except Exception as e:
        # 记录执行失败日志
        duration = time.time() - start_time
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