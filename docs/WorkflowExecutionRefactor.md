# 工作流执行重构方案

## 🎯 问题分析

### 原始问题
1. **单节点执行状态一直显示"执行中"** - 执行完成后状态没有正确重置
2. **状态管理混乱** - 多个状态管理机制冲突
3. **执行上下文不同步** - 主进程和渲染进程状态不一致
4. **错误处理不完善** - 执行失败时状态没有正确清理

## 🛠️ 重构方案

### 1. 新的执行状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                    渲染进程 (Renderer)                        │
├─────────────────────────────────────────────────────────────┤
│  useWorkflowExecution Hook                                  │
│  ├── 执行状态管理                                           │
│  ├── 单节点执行逻辑                                         │
│  └── 工作流执行逻辑                                         │
├─────────────────────────────────────────────────────────────┤
│  ExecutionStateManager                                      │
│  ├── 状态同步管理                                           │
│  ├── 节点状态更新                                           │
│  └── 执行日志管理                                           │
└─────────────────────────────────────────────────────────────┘
                                ↓ IPC通信
┌─────────────────────────────────────────────────────────────┐
│                    主进程 (Main Process)                     │
├─────────────────────────────────────────────────────────────┤
│  MainWorkflowExecutor                                       │
│  ├── 单节点执行方法                                         │
│  ├── 工作流执行方法                                         │
│  └── 状态同步机制                                           │
└─────────────────────────────────────────────────────────────┘
```

### 2. 核心组件

#### A. useWorkflowExecution Hook
```typescript
export function useWorkflowExecution() {
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    isRunning: false,
    currentNodeId: null,
    executionLog: [],
    variables: {},
    nodeStatuses: new Map(),
  });

  // 单节点执行
  const executeSingleNode = useCallback(async (node, connectKey, options) => {
    // 1. 设置执行状态
    // 2. 更新节点状态为运行中
    // 3. 执行节点逻辑
    // 4. 更新状态为成功/失败
    // 5. 重置执行状态
  }, []);

  // 工作流执行
  const executeWorkflow = useCallback(async (nodes, edges, connectKey, options) => {
    // 1. 设置执行状态
    // 2. 序列化节点和边
    // 3. 执行工作流
    // 4. 处理结果
  }, []);
}
```

#### B. ExecutionStateManager
```typescript
export class ExecutionStateManager {
  private state: ExecutionState;
  private listeners: Set<(state: ExecutionState) => void> = new Set();

  // 开始单节点执行
  startSingleNodeExecution(nodeId: string): void {
    this.state.isRunning = true;
    this.state.currentNodeId = nodeId;
    this.updateNodeStatus(nodeId, "running");
  }

  // 完成单节点执行
  completeSingleNodeExecution(nodeId: string, result?: any): void {
    this.updateNodeStatus(nodeId, "success");
    this.state.isRunning = false;
    this.state.currentNodeId = null;
  }

  // 单节点执行失败
  failSingleNodeExecution(nodeId: string, error: string): void {
    this.updateNodeStatus(nodeId, "error");
    this.state.isRunning = false;
    this.state.currentNodeId = null;
  }
}
```

### 3. 执行流程优化

#### 单节点执行流程
```
1. 用户点击单节点执行按钮
   ↓
2. 检查当前执行状态
   ↓
3. 设置执行状态为运行中
   ↓
4. 更新节点状态为"running"
   ↓
5. 序列化节点对象（移除函数属性）
   ↓
6. 调用主进程执行单节点
   ↓
7. 执行成功/失败
   ↓
8. 更新节点状态为"success"/"error"
   ↓
9. 重置执行状态
```

#### 状态同步机制
```
1. 主进程执行完成后发送状态更新
   ↓
2. 渲染进程接收状态更新
   ↓
3. ExecutionStateManager处理状态更新
   ↓
4. 更新所有相关节点状态
   ↓
5. 通知UI组件重新渲染
```

### 4. 关键改进

#### A. 状态管理统一
- **单一状态源**: 所有执行状态由ExecutionStateManager统一管理
- **状态同步**: 主进程和渲染进程状态完全同步
- **状态重置**: 执行完成后自动重置状态

#### B. 错误处理完善
- **超时保护**: 单节点执行30秒超时
- **重试机制**: HDC命令执行失败自动重试3次
- **状态清理**: 执行失败时正确清理状态
- **错误日志**: 详细的错误信息和堆栈

#### C. 性能优化
- **状态缓存**: 避免不必要的状态更新
- **批量更新**: 批量更新节点状态
- **内存管理**: 及时清理执行状态

### 5. 使用示例

#### 单节点执行
```typescript
// 在节点组件中
const handleSingleNodeExecution = () => {
  if (data.onSingleNodeExecute) {
    data.onSingleNodeExecute(id);
  }
};

// 在Automation组件中
const executeSingleNode = useCallback(async (nodeId: string) => {
  // 使用新的执行状态管理器
  executionStateManager.current.startSingleNodeExecution(nodeId);
  
  try {
    await window.api?.executeSingleNode(serializableNode, selectedDevice);
    executionStateManager.current.completeSingleNodeExecution(nodeId);
  } catch (error) {
    executionStateManager.current.failSingleNodeExecution(nodeId, error.message);
  }
}, []);
```

#### 工作流执行
```typescript
const executeWorkflow = useCallback(async () => {
  try {
    await executeWorkflowNew(nodes, edges, selectedDevice, {
      onProgress: (progress) => console.log("进度:", progress),
      onNodeComplete: (nodeId, result) => console.log("节点完成:", nodeId),
      onError: (error) => console.error("执行错误:", error),
    });
  } catch (error) {
    console.error("工作流执行失败:", error);
  }
}, []);
```

## 🎉 重构效果

### 解决的问题
- ✅ **单节点执行状态正确重置** - 执行完成后状态自动重置为idle
- ✅ **状态管理统一** - 单一状态源，避免状态冲突
- ✅ **执行上下文同步** - 主进程和渲染进程状态完全同步
- ✅ **错误处理完善** - 执行失败时状态正确清理
- ✅ **性能优化** - 减少不必要的重新渲染

### 新增功能
- 🆕 **执行进度回调** - 实时监控执行进度
- 🆕 **节点完成回调** - 节点执行完成时触发
- 🆕 **错误回调** - 执行错误时触发
- 🆕 **状态订阅** - 可以订阅执行状态变化
- 🆕 **批量状态更新** - 提高性能

### 代码质量提升
- 📈 **类型安全** - 完整的TypeScript类型定义
- 📈 **可维护性** - 清晰的代码结构和职责分离
- 📈 **可测试性** - 独立的执行状态管理器便于测试
- 📈 **可扩展性** - 易于添加新的执行功能

## 🧪 测试建议

### 1. 单节点执行测试
```typescript
// 测试单节点执行状态管理
test('单节点执行状态正确重置', async () => {
  const node = createTestNode('click');
  await executeSingleNode(node, 'test-device');
  
  // 验证执行完成后状态重置
  expect(executionState.isRunning).toBe(false);
  expect(executionState.currentNodeId).toBe(null);
  expect(executionState.nodeStatuses.get(node.id)).toBe('success');
});
```

### 2. 错误处理测试
```typescript
// 测试执行失败时的状态清理
test('执行失败时状态正确清理', async () => {
  const node = createTestNode('invalid');
  
  try {
    await executeSingleNode(node, 'test-device');
  } catch (error) {
    // 验证失败后状态重置
    expect(executionState.isRunning).toBe(false);
    expect(executionState.nodeStatuses.get(node.id)).toBe('error');
  }
});
```

### 3. 状态同步测试
```typescript
// 测试主进程和渲染进程状态同步
test('状态同步正确', async () => {
  const mockContext = {
    isRunning: true,
    currentNodeId: 'test-node',
    executionLog: [],
    variables: {},
  };
  
  executionStateManager.updateFromExecutionContext(mockContext);
  
  expect(executionState.isRunning).toBe(true);
  expect(executionState.currentNodeId).toBe('test-node');
});
```

## 📋 迁移指南

### 1. 更新组件导入
```typescript
// 旧版本
import { AutomationFlow } from './Automation';

// 新版本
import { AutomationFlow } from './Automation';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { ExecutionStateManager } from '@/utils/executionStateManager';
```

### 2. 更新状态管理
```typescript
// 旧版本
const [executionContext, setExecutionContext] = useState<ExecutionContext>({
  isRunning: false,
  currentNodeId: null,
  executionLog: [],
  variables: {},
});

// 新版本
const {
  executionState,
  executeSingleNode,
  executeWorkflow,
  stopExecution,
} = useWorkflowExecution();
```

### 3. 更新执行逻辑
```typescript
// 旧版本
const executeSingleNode = useCallback(async (nodeId: string) => {
  // 复杂的状态管理逻辑
}, []);

// 新版本
const executeSingleNode = useCallback(async (nodeId: string) => {
  executionStateManager.current.startSingleNodeExecution(nodeId);
  try {
    await window.api?.executeSingleNode(serializableNode, selectedDevice);
    executionStateManager.current.completeSingleNodeExecution(nodeId);
  } catch (error) {
    executionStateManager.current.failSingleNodeExecution(nodeId, error.message);
  }
}, []);
```

## 🔮 未来规划

### 1. 功能增强
- **并行执行**: 支持多个节点并行执行
- **条件执行**: 基于条件的节点执行
- **循环执行**: 支持节点循环执行
- **执行历史**: 保存执行历史记录

### 2. 性能优化
- **虚拟化**: 大量节点时的虚拟化渲染
- **懒加载**: 按需加载节点组件
- **缓存机制**: 执行结果缓存
- **增量更新**: 只更新变化的节点

### 3. 用户体验
- **执行进度条**: 可视化执行进度
- **实时日志**: 实时显示执行日志
- **错误提示**: 更友好的错误提示
- **快捷键**: 支持键盘快捷键操作

这个重构方案彻底解决了单节点执行状态问题，并提供了更好的工作流执行体验！
