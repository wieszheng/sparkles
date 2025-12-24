# Sparkles - HarmonyOS 性能监控与自动化测试平台

## 项目概述

Sparkles 是一个专为 HarmonyOS 应用开发的性能监控和自动化测试平台，提供完整的性能数据采集、UI 自动化操作和日志分析功能。

## 核心功能

### 1. 性能监控 ⚡

实时采集和分析应用性能指标：

- **CPU 使用率**：应用和系统 CPU 占用
- **内存使用**：应用内存占用和百分比
- **GPU 负载**：图形处理器使用情况
- **FPS 帧率**：应用流畅度和稳定性
- **功耗**：设备电量消耗
- **网络**：上传/下载速度
- **温度**：设备温度监控
- **性能评分**：综合性能评估

**特性：**
- ✅ 实时数据采集（可配置采样间隔）
- ✅ 性能告警（自定义阈值）
- ✅ 数据持久化（FastAPI 后端）
- ✅ 历史数据回显
- ✅ 性能评分系统

### 2. UI 自动化操作 🤖

基于 HarmonyOS uitest API 的完整 UI 自动化功能：

#### 点击操作
- `uiClick` - 单击
- `uiDoubleClick` - 双击
- `uiLongClick` - 长按

#### 滑动操作
- `uiFling` - 快滑（带惯性）
- `uiSwipe` - 慢滑
- `uiDrag` - 拖拽
- `uiDircFling` - 方向滑动（上下左右）

#### 文本输入
- `uiInputText` - 指定坐标输入
- `uiText` - 当前焦点输入

#### 按键事件
- `uiKeyEvent` - 通用按键（支持组合键）
- `uiGoHome` - 返回主页
- `uiGoBack` - 返回上一级
- `uiPowerKey` - 电源键
- `uiPaste` - 粘贴

#### 图片匹配
- `matchImage` - 图片模板匹配
- `matchImageTemplate` - 高级图片匹配

**特性：**
- ✅ 完整的 uitest 命令封装
- ✅ 参数验证和错误处理
- ✅ 任务中止支持
- ✅ 详细日志记录
- ✅ TypeScript 类型安全

### 3. HiLog 日志系统 📝

完整的 HarmonyOS 日志采集和分析功能：

#### 日志采集
- 实时日志采集（阻塞/非阻塞模式）
- 多种日志类型（APP、CORE、INIT、KMSG）
- 灵活过滤（级别、Domain、Tag、PID、正则）
- 自定义显示格式
- 自动保存到文件

#### 日志管理
- Buffer 管理（查询、清除、设置大小）
- 落盘任务管理（启动、停止、查询）
- 统计信息（查询、清除）
- 日志级别控制
- 多任务并发采集

#### 日志分析
- 日志解析（完整字段提取）
- 日志过滤（多条件组合）
- 统计分析（按级别、Tag 统计）
- 错误提取
- 时间范围分析
- 导出功能（JSON、CSV）

**特性：**
- ✅ 自动集成到性能监控
- ✅ 完整的日志解析工具
- ✅ 丰富的分析功能
- ✅ 多种导出格式

## 技术架构

### 前端
- **框架**：Electron + React
- **语言**：TypeScript
- **UI 库**：shadcn/ui + Tailwind CSS

### 后端
- **框架**：FastAPI
- **数据库**：SQLite / PostgreSQL
- **API**：RESTful

### 设备通信
- **工具**：HDC (HarmonyOS Device Connector)
- **协议**：Shell 命令 + 二进制通信

### 性能采集
- **工具**：SP_daemon (SmartPerf Daemon)
- **指标**：CPU、内存、GPU、FPS、功耗、网络、温度

## 项目结构

```
sparkles/
├── src/
│   ├── main/                    # Electron 主进程
│   │   └── hdc/                 # HDC 相关模块
│   │       ├── action.ts        # UI 操作函数
│   │       ├── engine.ts        # 脚本执行引擎
│   │       ├── monitor.ts       # 性能监控
│   │       ├── hilog.ts         # HiLog 日志采集
│   │       ├── hilog-utils.ts   # HiLog 工具函数
│   │       ├── sp-daemon.ts     # SP_daemon 集成
│   │       └── persistence.ts   # 数据持久化
│   ├── renderer/                # Electron 渲染进程
│   └── types/                   # TypeScript 类型定义
│       └── script.d.ts          # 脚本辅助函数类型
├── docs/                        # 文档
│   ├── UI_SIMULATION_API.md     # UI 操作 API 文档
│   ├── UI_SIMULATION_QUICK_REF.md
│   ├── UI_SIMULATION_IMPLEMENTATION.md
│   ├── HILOG_INTEGRATION.md     # HiLog 集成文档
│   ├── HILOG_QUICK_REF.md
│   └── HILOG_IMPLEMENTATION.md
└── examples/                    # 示例脚本
    ├── ui-simulation-demo.js    # UI 操作示例
    ├── hilog-analysis-demo.js   # HiLog 分析示例
    └── README.md
```

## 快速开始

### 1. 性能监控

```typescript
import { startMonitoring, stopMonitoring } from "./monitor";

// 启动监控
startMonitoring(task, {
  interval: 1,              // 采样间隔（秒）
  enableAlerts: true,       // 启用告警
  enableHiLog: true,        // 启用 HiLog
  thresholds: {
    fpsWarning: 30,
    fpsCritical: 20,
    cpuWarning: 80,
    cpuCritical: 90,
  },
});

// 停止监控
stopMonitoring(task.id);
```

### 2. UI 自动化

```javascript
module.exports = async function(task, helpers) {
  // 启动应用
  await helpers.launchApp(task.packageName);
  await helpers.sleep(2000);
  
  // UI 操作
  await helpers.uiClick(300, 500);
  await helpers.uiText("hello");
  await helpers.uiDircFling(helpers.SwipeDirection.UP, 800);
  
  // 返回主页
  await helpers.uiGoHome();
};
```

### 3. HiLog 分析

```typescript
import { startHiLogCapture, stopHiLogCapture } from "./hilog";
import { parseHiLogLine, getLogSummary } from "./hilog-utils";

// 采集日志
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  level: [HiLogLevel.ERROR, HiLogLevel.FATAL],
});

// 分析日志
const lines = fs.readFileSync("/tmp/app.log", "utf-8").split("\n");
const parsedLogs = lines.map(parseHiLogLine).filter(log => log !== null);
const summary = getLogSummary(parsedLogs);

console.log(summary);
```

## 使用场景

### 1. 性能测试
- 应用启动性能测试
- 滑动流畅度测试
- 内存泄漏检测
- 功耗测试
- 温度监控

### 2. 自动化测试
- 登录流程自动化
- 功能回归测试
- UI 交互测试
- 压力测试
- 兼容性测试

### 3. 日志分析
- 崩溃日志分析
- 错误日志统计
- 性能日志分析
- 用户行为分析

## 核心优势

### 1. 完整性
- ✅ 覆盖性能监控、UI 自动化、日志分析全流程
- ✅ 基于官方 API 完整封装
- ✅ 提供丰富的辅助工具

### 2. 易用性
- ✅ 简洁的 API 设计
- ✅ 完整的 TypeScript 类型支持
- ✅ 详细的文档和示例
- ✅ 友好的错误提示

### 3. 可靠性
- ✅ 完善的参数验证
- ✅ 错误处理和恢复
- ✅ 任务中止支持
- ✅ 资源自动清理

### 4. 扩展性
- ✅ 模块化设计
- ✅ 插件化架构
- ✅ 灵活的配置选项
- ✅ 易于集成和扩展

## 文档索引

### UI 自动化
- [UI 模拟操作 API 文档](./docs/UI_SIMULATION_API.md)
- [UI 模拟操作快速参考](./docs/UI_SIMULATION_QUICK_REF.md)
- [UI 模拟操作实现总结](./docs/UI_SIMULATION_IMPLEMENTATION.md)

### HiLog 日志
- [HiLog 集成文档](./docs/HILOG_INTEGRATION.md)
- [HiLog 快速参考](./docs/HILOG_QUICK_REF.md)
- [HiLog 实现总结](./docs/HILOG_IMPLEMENTATION.md)

### 示例代码
- [示例脚本目录](./examples/README.md)
- [UI 操作示例](./examples/ui-simulation-demo.js)
- [HiLog 分析示例](./examples/hilog-analysis-demo.js)

## 更新日志

### v1.0.0 (2025-12-24)

#### UI 自动化
- ✅ 完整的 uitest API 封装（14 个函数）
- ✅ 点击、滑动、输入、按键操作
- ✅ 图片匹配功能
- ✅ 完整的文档和示例

#### HiLog 集成
- ✅ 完整的日志采集功能
- ✅ Buffer 和落盘管理
- ✅ 日志解析和分析工具
- ✅ 性能监控集成
- ✅ 多任务并发支持

#### 性能监控
- ✅ 实时性能数据采集
- ✅ 性能告警系统
- ✅ 数据持久化
- ✅ HiLog 自动采集

## 技术支持

- **文档**：查看 `docs/` 目录
- **示例**：查看 `examples/` 目录
- **问题**：提交 GitHub Issue

## 许可证

MIT License

---

**Sparkles** - 让 HarmonyOS 应用性能监控和自动化测试更简单！ 🚀
