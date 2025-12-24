# HiLog 日志轮转功能说明

## 概述

为了防止长时间监控导致日志文件过大，HiLog 模块现已支持自动日志轮转功能。

## 功能特性

### 1. 自动轮转
- ✅ 默认每 **5 分钟**自动切换到新文件
- ✅ 可自定义轮转间隔
- ✅ 自动管理文件索引

### 2. 文件管理
- ✅ 自动清理超过最大数量的旧文件
- ✅ 默认保留最近 **10 个**文件
- ✅ 可自定义最大文件数

### 3. 压缩支持
- ✅ 可选的 gzip 压缩
- ✅ 自动压缩旧文件
- ✅ 节省磁盘空间

## 配置选项

### rotation 配置对象

```typescript
rotation?: {
  /** 轮转间隔（毫秒），默认 5 分钟 */
  interval?: number;
  /** 最大保留文件数，默认 10 */
  maxFiles?: number;
  /** 是否压缩旧文件，默认 false */
  compress?: boolean;
}
```

## 使用方法

### 1. 使用默认配置（推荐）

性能监控时自动启用，无需额外配置：

```typescript
import { startMonitoring } from "./monitor";

// 自动启用日志轮转（5分钟间隔，保留10个文件）
startMonitoring(task, {
  enableHiLog: true,
});
```

### 2. 自定义轮转配置

```typescript
startMonitoring(task, {
  enableHiLog: true,
  hilogConfig: {
    rotation: {
      interval: 10 * 60 * 1000,  // 10 分钟轮转一次
      maxFiles: 20,               // 保留 20 个文件
      compress: true,             // 压缩旧文件
    },
  },
});
```

### 3. 手动采集时使用轮转

```typescript
import { startHiLogCapture } from "./hilog";

startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  rotation: {
    interval: 5 * 60 * 1000,  // 5 分钟
    maxFiles: 10,
    compress: false,
  },
});
```

### 4. 禁用轮转

```typescript
// 方法1：设置 interval 为 0
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  rotation: {
    interval: 0,  // 禁用轮转
  },
});

// 方法2：使用非阻塞模式（exit: true）
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  exit: true,  // 非阻塞模式自动禁用轮转
});

// 方法3：不提供 rotation 配置但设置很大的间隔
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  // 不提供 rotation，使用默认配置
});
```

## 文件命名规则

### 启用轮转时

文件名会自动添加索引：

```
原始路径: /tmp/sparkles-logs/hilog_com.example.app_2025-12-24.log

轮转后的文件:
/tmp/sparkles-logs/hilog_com.example.app_2025-12-24.0.log  (第1个文件)
/tmp/sparkles-logs/hilog_com.example.app_2025-12-24.1.log  (第2个文件)
/tmp/sparkles-logs/hilog_com.example.app_2025-12-24.2.log  (第3个文件)
...
```

### 压缩后的文件

```
/tmp/sparkles-logs/hilog_com.example.app_2025-12-24.0.log.gz
/tmp/sparkles-logs/hilog_com.example.app_2025-12-24.1.log.gz
```

## 工作原理

### 1. 初始化

```
启动采集 → 创建初始文件（索引0） → 设置轮转定时器
```

### 2. 轮转过程

```
定时器触发 → 关闭当前文件 → 可选压缩 → 创建新文件（索引+1） → 重新连接输出 → 清理旧文件
```

### 3. 停止采集

```
停止命令 → 清除定时器 → 关闭文件流 → 终止进程
```

## 示例场景

### 场景1：长时间性能测试

```typescript
// 测试 2 小时，每 5 分钟轮转，保留所有文件
startMonitoring(task, {
  enableHiLog: true,
  hilogConfig: {
    rotation: {
      interval: 5 * 60 * 1000,  // 5 分钟
      maxFiles: 24,              // 2小时 / 5分钟 = 24个文件
      compress: true,            // 压缩节省空间
    },
  },
});

// 结果：24 个压缩的日志文件，每个约 5 分钟的日志
```

### 场景2：持续监控

```typescript
// 持续监控，只保留最近 1 小时的日志
startMonitoring(task, {
  enableHiLog: true,
  hilogConfig: {
    rotation: {
      interval: 5 * 60 * 1000,  // 5 分钟
      maxFiles: 12,              // 1小时 / 5分钟 = 12个文件
      compress: false,
    },
  },
});

// 结果：滚动保留最近 12 个文件（1小时），自动删除更早的文件
```

### 场景3：短期测试

```typescript
// 短期测试（< 5 分钟），禁用轮转
startMonitoring(task, {
  enableHiLog: true,
  hilogConfig: {
    rotation: {
      interval: 0,  // 禁用轮转
    },
  },
});

// 结果：单个日志文件
```

## 最佳实践

### 1. 轮转间隔选择

| 监控时长 | 推荐间隔 | 说明 |
|---------|---------|------|
| < 5 分钟 | 禁用 | 单文件即可 |
| 5-30 分钟 | 5 分钟 | 默认配置 |
| 30 分钟 - 2 小时 | 10 分钟 | 减少文件数量 |
| > 2 小时 | 15-30 分钟 | 平衡文件大小和数量 |

### 2. 最大文件数选择

```typescript
// 计算公式
maxFiles = Math.ceil(预期监控时长(分钟) / 轮转间隔(分钟))

// 示例
// 监控 2 小时，5 分钟轮转
maxFiles = Math.ceil(120 / 5) = 24
```

### 3. 压缩建议

- **启用压缩**：长时间监控、磁盘空间有限
- **禁用压缩**：需要实时查看日志、磁盘空间充足

### 4. 性能考虑

```typescript
// 高频日志场景（大量日志输出）
{
  interval: 3 * 60 * 1000,  // 3 分钟（更频繁）
  maxFiles: 20,
  compress: true,            // 压缩节省空间
}

// 低频日志场景（少量日志输出）
{
  interval: 10 * 60 * 1000, // 10 分钟（较少轮转）
  maxFiles: 10,
  compress: false,
}
```

## 注意事项

### 1. 非阻塞模式限制

轮转功能仅在**持续采集模式**下有效：

```typescript
// ✅ 支持轮转
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  // exit 未设置或为 false
  rotation: { interval: 5 * 60 * 1000 },
});

// ❌ 不支持轮转（非阻塞模式）
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  exit: true,  // 读完即退出，不会持续采集
  rotation: { interval: 5 * 60 * 1000 },  // 此配置无效
});
```

### 2. 文件索引

- 索引从 **0** 开始
- 索引递增，不会重置
- 旧文件索引小，新文件索引大

### 3. 磁盘空间

确保有足够的磁盘空间：

```typescript
// 估算所需空间
每分钟日志大小 = 约 100KB - 1MB（取决于日志量）
单个文件大小 = 每分钟日志大小 × 轮转间隔(分钟)
总空间需求 = 单个文件大小 × maxFiles

// 示例：5分钟轮转，保留10个文件
单个文件 ≈ 500KB × 5 = 2.5MB
总空间 ≈ 2.5MB × 10 = 25MB
```

### 4. 压缩性能

压缩会消耗 CPU 资源：

```typescript
// 压缩是异步的，不会阻塞日志采集
// 但在资源受限的设备上可能影响性能
rotation: {
  compress: false,  // 性能优先时禁用压缩
}
```

## 故障排查

### 问题1：轮转未生效

**检查项：**
1. 是否设置了 `exit: true`
2. `interval` 是否大于 0
3. 查看控制台日志确认定时器是否设置

**解决方法：**
```typescript
// 确保配置正确
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/tmp/app.log",
  exit: false,  // 或不设置
  rotation: {
    interval: 5 * 60 * 1000,  // 必须 > 0
  },
});
```

### 问题2：文件未清理

**可能原因：**
- `maxFiles` 设置过大
- 文件名不匹配

**解决方法：**
```typescript
// 检查 maxFiles 配置
rotation: {
  maxFiles: 10,  // 确保设置合理的值
}
```

### 问题3：压缩失败

**可能原因：**
- 文件正在使用
- 权限不足

**解决方法：**
- 检查文件权限
- 查看错误日志

## 总结

✅ **默认配置已优化**：5分钟轮转，保留10个文件  
✅ **自动管理**：无需手动清理旧文件  
✅ **灵活配置**：可根据需求自定义  
✅ **性能友好**：异步压缩，不阻塞采集  

日志轮转功能可以有效防止长时间监控导致的文件过大问题！🎉
