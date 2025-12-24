# HiLog 集成文档

## 概述

HiLog 是 HarmonyOS 的日志系统，本模块提供了完整的 HiLog 日志采集、管理和分析功能。

## 功能特性

### 1. 日志采集

- ✅ 实时日志采集
- ✅ 非阻塞读取模式
- ✅ 多种日志类型支持（APP、CORE、INIT、KMSG）
- ✅ 日志级别过滤（DEBUG、INFO、WARN、ERROR、FATAL）
- ✅ Domain、Tag、PID 过滤
- ✅ 正则表达式过滤
- ✅ 自定义显示格式
- ✅ 自动保存到文件

### 2. 日志管理

- ✅ Buffer 管理（查询、清除、设置大小）
- ✅ 落盘任务管理（启动、停止、查询）
- ✅ 统计信息（查询、清除）
- ✅ 日志级别控制
- ✅ 多任务并发采集
- ✅ **日志轮转**（防止文件过大，默认 5 分钟轮转）

### 3. 日志分析

- ✅ 日志解析
- ✅ 日志过滤
- ✅ 统计分析
- ✅ 错误提取
- ✅ 时间范围分析
- ✅ 导出功能（JSON、CSV）

## 日志格式说明

### 标准格式

```
日期    时间戳           进程号  线程号  级别  domainID/进程名/日志tag:  日志内容
04-19  17:02:14.735    5394   5394   I    A03200/test_server/testTag:  this is a info level hilog
```

### 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| 日期 | MM-DD 格式 | 04-19 |
| 时间戳 | HH:MM:SS.mmm 格式 | 17:02:14.735 |
| 进程号 | PID | 5394 |
| 线程号 | TID | 5394 |
| 日志级别 | D/I/W/E/F | I |
| domainID | 日志域标识 | A03200 |
| 进程名 | 进程名称 | test_server |
| 日志tag | 日志标签 | testTag |
| 日志内容 | 实际日志信息 | this is a info level hilog |

### 日志级别

| 级别 | 字母 | 说明 |
|------|------|------|
| DEBUG | D | 调试信息 |
| INFO | I | 一般信息 |
| WARN | W | 警告信息 |
| ERROR | E | 错误信息 |
| FATAL | F | 致命错误 |

### Domain ID 说明

- **A** 开头：应用日志（LOG_APP）
- 后续数字：domainID（如 3200 表示 0x3200）

## 使用方法

### 1. 基础日志采集

```typescript
import { startHiLogCapture, stopHiLogCapture } from "./hilog";

// 开始采集
const result = startHiLogCapture("task-001", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  type: [HiLogType.APP, HiLogType.CORE],
  level: [HiLogLevel.INFO, HiLogLevel.WARN, HiLogLevel.ERROR],
});

// 停止采集
stopHiLogCapture("task-001");
```

### 2. 高级过滤

```typescript
// 按 Domain 过滤
startHiLogCapture("task-002", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  domain: ["A03200", "A03201"],
});

// 按 Tag 过滤
startHiLogCapture("task-003", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  tag: ["testTag", "networkTag"],
});

// 按 PID 过滤
startHiLogCapture("task-004", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  pid: [5394, 5395],
});

// 正则表达式过滤
startHiLogCapture("task-005", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  regex: "error|exception",
});
```

### 3. 自定义显示格式

```typescript
startHiLogCapture("task-006", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  format: {
    color: true,           // 彩色显示
    time: "time",          // 显示本地时间
    precision: "msec",     // 毫秒精度
    year: true,            // 显示年份
    zone: true,            // 显示时区
  },
});
```

### 4. 非阻塞读取

```typescript
// 读取现有日志后退出
startHiLogCapture("task-007", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  exit: true,
  tail: 100,  // 只读取最后100行
});
```

### 5. Buffer 管理

```typescript
import {
  clearHiLogBuffer,
  getHiLogBufferSize,
  setHiLogBufferSize,
} from "./hilog";

// 清除 buffer
await clearHiLogBuffer("device-key", [HiLogType.APP]);

// 查询 buffer 大小
const { size } = await getHiLogBufferSize("device-key");

// 设置 buffer 大小（最小 64K，最大 16M）
await setHiLogBufferSize("device-key", "1M", [HiLogType.APP]);
```

### 6. 落盘任务管理

```typescript
import {
  queryHiLogPersist,
  startHiLogPersist,
  stopHiLogPersist,
} from "./hilog";

// 查询落盘任务
const { tasks } = await queryHiLogPersist("device-key");

// 启动落盘任务
await startHiLogPersist("device-key", {
  filename: "hilog",
  fileSize: 1024 * 1024,  // 1MB
  fileCount: 10,
  compression: "zlib",
  jobId: 1,
});

// 停止落盘任务
await stopHiLogPersist("device-key", 1);
```

### 7. 日志分析

```typescript
import {
  parseHiLogLine,
  filterHiLogLines,
  extractErrorLogs,
  getLogSummary,
} from "./hilog-utils";

// 解析日志行
const parsed = parseHiLogLine(
  "04-19 17:02:14.735 5394 5394 I A03200/test_server/testTag: test message"
);

// 过滤日志
const filtered = filterHiLogLines(lines, {
  level: [HiLogLevel.ERROR, HiLogLevel.FATAL],
  tag: ["networkTag"],
  keyword: "timeout",
});

// 提取错误日志
const errors = extractErrorLogs(parsedLogs);

// 获取日志摘要
const summary = getLogSummary(parsedLogs);
console.log(summary);
// {
//   total: 1000,
//   byLevel: { D: 100, I: 500, W: 200, E: 150, F: 50 },
//   byTag: { "testTag": 500, "networkTag": 300, ... },
//   timeRange: { start: "04-19 10:00:00.000", end: "04-19 11:00:00.000", duration: 3600000 },
//   errorCount: 150,
//   warningCount: 200
// }
```

### 8. 日志导出

```typescript
import { exportLogsToJSON, exportLogsToCSV } from "./hilog-utils";

// 导出为 JSON
const json = exportLogsToJSON(parsedLogs);
fs.writeFileSync("logs.json", json);

// 导出为 CSV
const csv = exportLogsToCSV(parsedLogs);
fs.writeFileSync("logs.csv", csv);
```

### 9. 日志轮转（防止文件过大）

```typescript
// 使用默认轮转配置（5 分钟，保留 10 个文件）
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  rotation: {
    interval: 5 * 60 * 1000,  // 5 分钟轮转一次
    maxFiles: 10,              // 最多保留 10 个文件
    compress: false,           // 不压缩（可选）
  },
});

// 自定义轮转配置
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  rotation: {
    interval: 10 * 60 * 1000,  // 10 分钟轮转
    maxFiles: 20,               // 保留 20 个文件
    compress: true,             // 压缩旧文件
  },
});

// 禁用轮转
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  rotation: {
    interval: 0,  // 设置为 0 禁用轮转
  },
});
```

**轮转后的文件命名：**
```
/tmp/app.0.log  (第 1 个文件)
/tmp/app.1.log  (第 2 个文件)
/tmp/app.2.log  (第 3 个文件)
...
```

**详细说明：** 查看 [日志轮转文档](./HILOG_ROTATION.md)

## 性能监控集成

HiLog 已自动集成到性能监控任务中。

### 自动采集

```typescript
import { startMonitoring } from "./monitor";

// 启动监控时自动开始 HiLog 采集
startMonitoring(task, {
  interval: 1,
  enableHiLog: true,  // 默认启用
});
```

### 自定义配置

```typescript
startMonitoring(task, {
  interval: 1,
  enableHiLog: true,
  hilogConfig: {
    level: [HiLogLevel.WARN, HiLogLevel.ERROR, HiLogLevel.FATAL],
    tag: ["performance", "crash"],
    format: {
      time: "time",
      precision: "msec",
    },
  },
});
```

### 日志保存位置

日志自动保存到：
```
/tmp/sparkles-logs/hilog_<packageName>_<timestamp>.log
```

示例：
```
/tmp/sparkles-logs/hilog_com.example.app_2025-12-24T12-00-00-000Z.log
```

## API 参考

### HiLog 采集

#### startHiLogCapture

开始 HiLog 采集。

```typescript
function startHiLogCapture(
  taskId: string,
  config: HiLogCaptureConfig
): { success: boolean; message?: string }
```

#### stopHiLogCapture

停止 HiLog 采集。

```typescript
function stopHiLogCapture(
  taskId: string
): { success: boolean; message?: string }
```

#### getHiLogCaptureStatus

获取采集状态。

```typescript
function getHiLogCaptureStatus(taskId: string): {
  isRunning: boolean;
  pid?: number;
  startTime?: number;
  duration?: number;
}
```

### Buffer 管理

#### clearHiLogBuffer

清除 HiLog buffer。

```typescript
function clearHiLogBuffer(
  connectKey: string,
  type?: HiLogType[]
): Promise<{ success: boolean; message?: string }>
```

#### getHiLogBufferSize

查询 buffer 大小。

```typescript
function getHiLogBufferSize(
  connectKey: string,
  type?: HiLogType[]
): Promise<{ success: boolean; size?: string; message?: string }>
```

#### setHiLogBufferSize

设置 buffer 大小。

```typescript
function setHiLogBufferSize(
  connectKey: string,
  size: string,
  type?: HiLogType[]
): Promise<{ success: boolean; message?: string }>
```

### 落盘管理

#### queryHiLogPersist

查询落盘任务。

```typescript
function queryHiLogPersist(connectKey: string): Promise<{
  success: boolean;
  tasks?: string;
  message?: string;
}>
```

#### startHiLogPersist

启动落盘任务。

```typescript
function startHiLogPersist(
  connectKey: string,
  config: HiLogPersistConfig
): Promise<{ success: boolean; message?: string }>
```

#### stopHiLogPersist

停止落盘任务。

```typescript
function stopHiLogPersist(
  connectKey: string,
  jobId?: number
): Promise<{ success: boolean; message?: string }>
```

## 最佳实践

### 1. 日志级别选择

- **开发阶段**：使用 DEBUG 和 INFO 级别
- **测试阶段**：使用 INFO、WARN 和 ERROR 级别
- **生产环境**：仅使用 WARN、ERROR 和 FATAL 级别

### 2. 过滤策略

- 使用 Tag 过滤关注的模块
- 使用 Domain 过滤特定应用
- 使用正则表达式过滤关键词

### 3. 性能优化

- 避免采集过多日志类型
- 合理设置 buffer 大小
- 定期清理历史日志

### 4. 错误处理

```typescript
const result = startHiLogCapture("task-id", config);
if (!result.success) {
  console.error("Failed to start HiLog capture:", result.message);
  // 处理错误
}
```

## 故障排查

### 问题：日志采集失败

**可能原因：**
1. 设备未连接
2. HDC 路径配置错误
3. 权限不足

**解决方法：**
1. 检查设备连接状态
2. 验证 HDC 路径配置
3. 确保有足够的文件系统权限

### 问题：日志文件为空

**可能原因：**
1. 过滤条件过于严格
2. 应用未产生日志
3. 日志级别设置过高

**解决方法：**
1. 放宽过滤条件
2. 确认应用正在运行
3. 降低日志级别阈值

### 问题：日志采集占用资源过多

**可能原因：**
1. 日志量过大
2. 未设置合理的过滤条件

**解决方法：**
1. 使用更严格的过滤条件
2. 减少采集的日志类型
3. 使用非阻塞模式

## 更新日志

### v1.1.0 (2025-12-24)

- ✅ **日志轮转功能**（防止长时间监控导致文件过大）
  - 默认 5 分钟自动轮转
  - 自动清理旧文件
  - 可选 gzip 压缩

### v1.0.0 (2025-12-24)

- ✅ 完整的 HiLog 采集功能
- ✅ Buffer 管理
- ✅ 落盘任务管理
- ✅ 日志解析和分析工具
- ✅ 性能监控集成
- ✅ 多任务并发支持

## 相关资源

- [HarmonyOS HiLog 官方文档](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/hilog)
- [日志轮转文档](./HILOG_ROTATION.md)
- [性能监控文档](./PERFORMANCE_MONITORING.md)
- [UI 模拟操作文档](./UI_SIMULATION_API.md)
