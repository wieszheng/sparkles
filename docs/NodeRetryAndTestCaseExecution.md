# 节点重试机制和测试用例本地执行功能

## 🎯 功能概述

本次更新实现了两个主要功能：
1. **节点执行重试机制**：根据节点配置的 `retryCount` 参数控制重试次数
2. **测试用例本地执行**：不依赖API的本地测试用例执行功能，支持状态更新和执行次数统计

## 🔧 主要修改内容

### 1. 节点执行重试机制

#### 1.1 新增重试控制方法
- **文件**: `src/main/workflow.ts`
- **新增方法**: `executeHdcCommandWithNodeRetry()`
- **功能**: 根据节点配置的 `retryCount` 参数控制重试次数

```typescript
/**
 * 根据节点配置执行带重试的HDC命令
 */
private async executeHdcCommandWithNodeRetry(commands: string[], nodeConfig: NodeConfig): Promise<string[]> {
  const retryCount = nodeConfig.retryCount || 3;
  return this.executeHdcCommand(commands, retryCount);
}
```

#### 1.2 更新节点执行方法
修改了以下节点执行方法，使用新的重试机制：

- **点击节点** (`executeClickNode`): 支持选择器和坐标点击的重试
- **输入节点** (`executeInputNode`): 支持文本输入和清空操作的重试
- **条件节点** (`executeConditionNode`): 支持条件检查的重试

#### 1.3 重试机制特性
- **默认重试次数**: 3次（可通过节点配置修改）
- **递增等待时间**: 1秒、2秒、3秒...最大5秒
- **详细日志记录**: 记录每次重试的详细信息
- **错误处理**: 所有重试失败后抛出详细错误信息

### 2. 测试用例本地执行功能

#### 2.1 新增测试用例执行器
- **文件**: `src/main/test-case-executor.ts`
- **类**: `TestCaseExecutor`
- **功能**: 提供不依赖API的测试用例执行功能

```typescript
export class TestCaseExecutor {
  async executeTestCase(
    testCase: any,
    options: TestCaseExecutionOptions
  ): Promise<TestCaseExecutionResult>
}
```

#### 2.2 新增类型定义
- **文件**: `src/types/workflow.ts`
- **新增类型**:
  - `TestCaseExecutionResult`: 测试用例执行结果
  - `NodeExecutionResult`: 节点执行结果

```typescript
export interface TestCaseExecutionResult {
  success: boolean;
  testCaseId: string;
  testCaseName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  executionCount: number;
  status: "passed" | "failed" | "skipped" | "pending";
  error: string | null;
  executionLog: ExecutionLogEntry[];
  nodeResults: NodeExecutionResult[];
}
```

#### 2.3 主进程API集成
- **文件**: `src/main/handlers.ts`
- **新增IPC处理程序**: `execute-test-case`
- **功能**: 处理测试用例执行请求

#### 2.4 渲染进程API集成
- **文件**: `src/preload/index.ts` 和 `src/preload/index.d.ts`
- **新增API**: `executeTestCase`
- **功能**: 提供测试用例执行的渲染进程接口

### 3. 测试用例状态更新

#### 3.1 本地状态管理
- **文件**: `src/renderer/src/components/test-cases/test-case-list.tsx`
- **功能**: 执行完成后自动更新测试用例状态和执行次数

```typescript
// 更新测试用例状态
const updatedTestCase: TestCase = {
  ...testCase,
  executionCount: result.executionCount,
  lastResult: result.status === "passed" ? "passed" : "failed",
};

// 更新本地状态
setTestCases(prev => 
  prev.map(tc => 
    tc.id === testCase.id ? updatedTestCase : tc
  )
);
```

#### 3.2 UI显示优化
- **执行次数显示**: 优化了执行次数的显示格式
- **状态徽章**: 保持原有的状态徽章显示
- **执行反馈**: 提供详细的执行结果反馈

## 🚀 使用方式

### 1. 节点重试配置

在节点配置中设置 `retryCount` 参数：

```typescript
// 点击节点配置示例
const clickNodeConfig = {
  selector: "//button[@id='submit']",
  clickType: "click",
  waitTime: 1000,
  retryCount: 5  // 设置重试5次
};
```

### 2. 测试用例执行

在测试用例列表中点击"执行"按钮：

```typescript
// 执行测试用例
const response = await window.api.executeTestCase(testCase, deviceConnectKey);

if (response?.success) {
  const result = response.data;
  console.log("执行结果:", result);
  // 自动更新测试用例状态和执行次数
}
```

## 📊 功能特性

### 节点重试机制特性
- ✅ **灵活配置**: 每个节点可独立设置重试次数
- ✅ **智能等待**: 递增等待时间，避免频繁重试
- ✅ **详细日志**: 记录每次重试的详细信息
- ✅ **错误处理**: 完善的错误处理和报告机制

### 测试用例本地执行特性
- ✅ **本地执行**: 不依赖外部API，提高执行效率
- ✅ **状态同步**: 自动更新测试用例状态和执行次数
- ✅ **详细结果**: 提供完整的执行结果和日志
- ✅ **错误处理**: 完善的错误处理和用户反馈

### 用户体验优化
- ✅ **即时反馈**: 执行过程中提供实时状态更新
- ✅ **结果展示**: 清晰显示执行结果和统计信息
- ✅ **状态持久化**: 执行状态在界面中持久显示
- ✅ **操作简便**: 一键执行，自动更新状态

## 🔍 技术实现

### 1. 重试机制实现
- 使用 `Promise.race` 实现超时控制
- 递增等待时间算法：`Math.min(1000 * attempt, 5000)`
- 详细的错误日志和状态跟踪

### 2. 本地执行实现
- 基于现有的 `MainWorkflowExecutor` 实现
- 独立的 `TestCaseExecutor` 类封装执行逻辑
- 完整的类型定义和错误处理

### 3. 状态管理实现
- React状态管理更新测试用例列表
- 类型安全的TypeScript实现
- 响应式UI更新

## 🧪 测试建议

### 1. 节点重试测试
- 测试不同重试次数的配置
- 验证重试等待时间的递增
- 检查重试失败后的错误处理

### 2. 测试用例执行测试
- 测试正常执行流程
- 测试执行失败的处理
- 验证状态更新和计数功能

### 3. 集成测试
- 测试完整的执行流程
- 验证UI状态同步
- 检查错误处理和用户反馈

## 🔮 未来规划

### 1. 功能增强
- **批量执行**: 支持多个测试用例批量执行
- **执行计划**: 支持定时执行和调度
- **并行执行**: 支持多个测试用例并行执行

### 2. 性能优化
- **执行缓存**: 缓存执行结果，提高重复执行效率
- **资源管理**: 优化资源使用，提高系统性能
- **并发控制**: 实现更好的并发执行控制

### 3. 用户体验
- **执行进度**: 实时显示执行进度条
- **执行历史**: 查看历史执行记录
- **结果分析**: 提供执行结果分析功能

这个实现为测试自动化系统提供了更强大和灵活的执行能力，同时保持了良好的用户体验和系统稳定性！
