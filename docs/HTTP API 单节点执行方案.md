# 🎯 纯 HTTP API 单节点执行方案

### 🏗️ 简化架构

![简化架构](/backend/screenshots/mermaid_20250914230812.svg)

### 📡 简化的 API 设计

1. 单节点执行接口
```py
# app/api/nodes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid
import time
import asyncio

router = APIRouter(prefix="/api/v1", tags=["nodes"])

class NodeExecutionRequest(BaseModel):
    node_id: str
    node_type: str
    config: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None  # 执行上下文

class ExecutionLog(BaseModel):
    timestamp: float
    level: str  # info, warn, error, debug
    message: str
    details: Optional[Dict[str, Any]] = None

class NodeExecutionResponse(BaseModel):
    success: bool
    node_id: str
    execution_id: str
    result: Optional[Any] = None
    error: Optional[str] = None
    duration: float
    status: str  # pending, running, success, error
    logs: List[ExecutionLog] = []
    next_action: Optional[str] = None  # continue, branch_true, branch_false, loop_continue, loop_end, retry
    context_updates: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None  # 额外的元数据

@router.post("/execute-node", response_model=NodeExecutionResponse)
async def execute_node(request: NodeExecutionRequest):
    """执行单个节点"""
    execution_id = str(uuid.uuid4())
    start_time = time.time()
    logs = []
    
    # 添加开始日志
    logs.append(ExecutionLog(
        timestamp=start_time,
        level="info",
        message=f"开始执行节点: {request.node_type}",
        details={"node_id": request.node_id, "config": request.config}
    ))
    
    try:
        # 执行节点
        executor = NodeExecutor()
        result = await executor.execute_node(
            request.node_type,
            request.config,
            request.context or {},
            logs  # 传递日志收集器
        )
        
        duration = time.time() - start_time
        
        # 添加成功日志
        logs.append(ExecutionLog(
            timestamp=time.time(),
            level="info",
            message=f"节点执行成功",
            details={"duration": duration, "result": result}
        ))
        
        return NodeExecutionResponse(
            success=True,
            node_id=request.node_id,
            execution_id=execution_id,
            result=result.get("data") if isinstance(result, dict) else result,
            duration=duration,
            status="success",
            logs=logs,
            next_action=result.get("next_action") if isinstance(result, dict) else "continue",
            context_updates=result.get("context_updates") if isinstance(result, dict) else None,
            metadata=result.get("metadata") if isinstance(result, dict) else None
        )
        
    except Exception as e:
        duration = time.time() - start_time
        
        # 添加错误日志
        logs.append(ExecutionLog(
            timestamp=time.time(),
            level="error",
            message=f"节点执行失败: {str(e)}",
            details={"error": str(e), "duration": duration}
        ))
        
        return NodeExecutionResponse(
            success=False,
            node_id=request.node_id,
            execution_id=execution_id,
            error=str(e),
            duration=duration,
            status="error",
            logs=logs,
            next_action="retry"  # 默认建议重试
        )

# 批量执行接口（可选）
class BatchExecutionRequest(BaseModel):
    nodes: List[NodeExecutionRequest]
    parallel: bool = False  # 是否并行执行

@router.post("/execute-batch", response_model=List[NodeExecutionResponse])
async def execute_batch_nodes(request: BatchExecutionRequest):
    """批量执行节点"""
    if request.parallel:
        # 并行执行
        tasks = [execute_node(node_req) for node_req in request.nodes]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常结果
        responses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                responses.append(NodeExecutionResponse(
                    success=False,
                    node_id=request.nodes[i].node_id,
                    execution_id=str(uuid.uuid4()),
                    error=str(result),
                    duration=0,
                    status="error",
                    logs=[ExecutionLog(
                        timestamp=time.time(),
                        level="error",
                        message=f"批量执行失败: {str(result)}"
                    )]
                ))
            else:
                responses.append(result)
        return responses
    else:
        # 顺序执行
        responses = []
        for node_req in request.nodes:
            response = await execute_node(node_req)
            responses.append(response)
            # 如果某个节点失败，可以选择停止或继续
            if not response.success:
                break
        return responses
```

2. 增强的节点执行器
```py
# app/workflow/nodes.py
import asyncio
import random
import time
from typing import Dict, Any, List
from app.api.nodes import ExecutionLog

class NodeExecutor:
    async def execute_node(
        self, 
        node_type: str, 
        config: Dict[str, Any], 
        context: Dict[str, Any],
        logs: List[ExecutionLog]
    ) -> Dict[str, Any]:
        """执行单个节点并收集日志"""
        
        # 添加执行开始日志
        logs.append(ExecutionLog(
            timestamp=time.time(),
            level="debug",
            message=f"开始执行 {node_type} 节点",
            details={"config": config, "context": context}
        ))
        
        if node_type == 'start':
            return await self._execute_start_node(config, context, logs)
        elif node_type == 'click':
            return await self._execute_click_node(config, context, logs)
        elif node_type == 'input':
            return await self._execute_input_node(config, context, logs)
        elif node_type == 'wait':
            return await self._execute_wait_node(config, context, logs)
        elif node_type == 'condition':
            return await self._execute_condition_node(config, context, logs)
        elif node_type == 'loop':
            return await self._execute_loop_node(config, context, logs)
        elif node_type == 'screenshot':
            return await self._execute_screenshot_node(config, context, logs)
        else:
            raise Exception(f"未知的节点类型: {node_type}")
    
    async def _execute_click_node(self, config: Dict, context: Dict, logs: List[ExecutionLog]) -> Dict[str, Any]:
        """执行点击节点"""
        selector = config.get('selector', '')
        click_type = config.get('clickType', 'left')
        wait_time = config.get('waitTime', 1000) / 1000
        retry_count = config.get('retryCount', 3)
        
        logs.append(ExecutionLog(
            timestamp=time.time(),
            level="info",
            message=f"准备点击元素: {selector}",
            details={"selector": selector, "click_type": click_type}
        ))
        
        # 模拟重试逻辑
        for attempt in range(retry_count):
            try:
                await asyncio.sleep(wait_time)
                
                # 模拟点击操作
                success = random.random() > 0.2  # 80% 成功率
                
                if success:
                    logs.append(ExecutionLog(
                        timestamp=time.time(),
                        level="info",
                        message=f"点击成功: {selector}",
                        details={"attempt": attempt + 1, "click_type": click_type}
                    ))
                    
                    return {
                        "data": {
                            "clicked": True,
                            "selector": selector,
                            "click_type": click_type,
                            "attempts": attempt + 1
                        },
                        "next_action": "continue",
                        "context_updates": {
                            "last_click": selector,
                            "last_click_time": time.time()
                        },
                        "metadata": {
                            "execution_details": f"点击 {selector} 成功"
                        }
                    }
                else:
                    logs.append(ExecutionLog(
                        timestamp=time.time(),
                        level="warn",
                        message=f"点击失败，尝试重试: {attempt + 1}/{retry_count}",
                        details={"selector": selector, "attempt": attempt + 1}
                    ))
                    
            except Exception as e:
                logs.append(ExecutionLog(
                    timestamp=time.time(),
                    level="error",
                    message=f"点击异常: {str(e)}",
                    details={"selector": selector, "attempt": attempt + 1, "error": str(e)}
                ))
        
        # 所有重试都失败
        raise Exception(f"点击元素失败，已重试 {retry_count} 次: {selector}")
    
    async def _execute_condition_node(self, config: Dict, context: Dict, logs: List[ExecutionLog]) -> Dict[str, Any]:
        """执行条件节点"""
        selector = config.get('selector', '')
        operator = config.get('operator', 'exists')
        value = config.get('value', '')
        wait_time = config.get('waitTime', 1000) / 1000
        
        logs.append(ExecutionLog(
            timestamp=time.time(),
            level="info",
            message=f"检查条件: {selector} {operator} {value}",
            details={"selector": selector, "operator": operator, "value": value}
        ))
        
        await asyncio.sleep(wait_time)
        
        # 模拟条件检查
        result = random.random() > 0.3  # 70% 成功率
        
        logs.append(ExecutionLog(
            timestamp=time.time(),
            level="info",
            message=f"条件检查结果: {'通过' if result else '失败'}",
            details={"result": result, "condition": f"{selector} {operator} {value}"}
        ))
        
        return {
            "data": {
                "condition_result": result,
                "selector": selector,
                "operator": operator,
                "value": value
            },
            "next_action": "branch_true" if result else "branch_false",
            "context_updates": {
                "last_condition_result": result,
                "last_condition_check": time.time()
            },
            "metadata": {
                "condition_details": f"{selector} {operator} {value} = {result}"
            }
        }
```
3. 前端工作流执行引擎
```js
// 前端简化的工作流执行引擎
class SimpleWorkflowExecutor {
  private apiClient: ApiClient;
  private context: Record<string, any> = {};
  private onNodeStatusUpdate?: (nodeId: string, status: string, data?: any) => void;
  private onLogUpdate?: (logs: ExecutionLog[]) => void;
  
  constructor() {
    this.apiClient = new ApiClient();
  }
  
  setStatusUpdateCallback(callback: (nodeId: string, status: string, data?: any) => void) {
    this.onNodeStatusUpdate = callback;
  }
  
  setLogUpdateCallback(callback: (logs: ExecutionLog[]) => void) {
    this.onLogUpdate = callback;
  }
  
  async executeWorkflow(nodes: Node[], edges: Edge[]) {
    // 找到开始节点
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      throw new Error('未找到开始节点');
    }
    
    // 构建执行图
    const executionGraph = this.buildExecutionGraph(nodes, edges);
    
    // 开始执行
    await this.executeNode(startNode, executionGraph);
  }
  
  private async executeNode(node: Node, graph: Map<string, Node[]>): Promise<void> {
    // 更新UI状态为执行中
    this.onNodeStatusUpdate?.(node.id, 'running');
    
    try {
      // 调用后端执行节点
      const response = await this.apiClient.executeNode({
        node_id: node.id,
        node_type: node.type,
        config: node.data.config || {},
        context: this.context
      });
      
      // 更新日志
      this.onLogUpdate?.(response.logs);
      
      // 更新节点状态
      this.onNodeStatusUpdate?.(node.id, response.status, {
        duration: response.duration,
        result: response.result,
        error: response.error
      });
      
      if (!response.success) {
        if (response.next_action === 'retry') {
          // 可以选择自动重试或让用户决定
          console.log(`节点 ${node.id} 执行失败，建议重试`);
        }
        throw new Error(response.error);
      }
      
      // 更新上下文
      if (response.context_updates) {
        Object.assign(this.context, response.context_updates);
      }
      
      // 根据执行结果决定下一步
      await this.handleNextAction(node, response, graph);
      
    } catch (error) {
      this.onNodeStatusUpdate?.(node.id, 'error', { error: error.message });
      throw error;
    }
  }
  
  private async handleNextAction(
    currentNode: Node, 
    response: NodeExecutionResponse, 
    graph: Map<string, Node[]>
  ) {
    const nextNodes = graph.get(currentNode.id) || [];
    
    switch (response.next_action) {
      case 'continue':
        for (const nextNode of nextNodes) {
          await this.executeNode(nextNode, graph);
        }
        break;
        
      case 'branch_true':
        const trueNodes = this.getNodesBySourceHandle(currentNode.id, nextNodes, 'true');
        for (const node of trueNodes) {
          await this.executeNode(node, graph);
        }
        break;
        
      case 'branch_false':
        const falseNodes = this.getNodesBySourceHandle(currentNode.id, nextNodes, 'false');
        for (const node of falseNodes) {
          await this.executeNode(node, graph);
        }
        break;
        
      // ... 其他情况
    }
  }
}

// API 客户端
class ApiClient {
  private baseUrl = 'http://localhost:8000/api/v1';
  
  async executeNode(request: NodeExecutionRequest): Promise<NodeExecutionResponse> {
    const response = await fetch(`${this.baseUrl}/execute-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // 批量执行（可选）
  async executeBatch(requests: NodeExecutionRequest[], parallel = false): Promise<NodeExecutionResponse[]> {
    const response = await fetch(`${this.baseUrl}/execute-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodes: requests,
        parallel
      })
    });
    
    return await response.json();
  }
}
```
### 🎯 方案优势
- 极简设计 - 只需要 HTTP API，无需 WebSocket
- 同步状态 - 每次请求直接返回完整状态
- 完整日志 - 每次执行返回详细的执行日志
- 易于调试 - HTTP 请求易于调试和测试
- 无状态后端 - 后端完全无状态，易于扩展
- 灵活控制 - 前端完全控制执行流程和错误处理
- 批量支持 - 可选的批量执行接口

### 📊 使用示例
```js
// 使用示例
const executor = new SimpleWorkflowExecutor();

// 设置状态更新回调
executor.setStatusUpdateCallback((nodeId, status, data) => {
  console.log(`节点 ${nodeId} 状态: ${status}`, data);
  // 更新UI显示
});

// 设置日志更新回调
executor.setLogUpdateCallback((logs) => {
  console.log('执行日志:', logs);
  // 更新日志面板
});

// 执行工作流
await executor.executeWorkflow(nodes, edges);
```