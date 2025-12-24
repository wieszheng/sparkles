# HiLog 快速参考

## 基础命令

```bash
# 查看帮助
hdc shell hilog -h

# 实时查看日志（阻塞模式）
hdc shell hilog

# 读取日志后退出（非阻塞）
hdc shell hilog -x

# 显示最后 100 行
hdc shell hilog -z 100

# 显示前 100 行
hdc shell hilog -a 100
```

## 日志类型过滤

```bash
# 应用日志
hdc shell hilog -t app

# 系统日志
hdc shell hilog -t core

# 启动日志
hdc shell hilog -t init

# 内核日志
hdc shell hilog -t kmsg

# 多种类型
hdc shell hilog -t app -t core
```

## 日志级别过滤

```bash
# 只看 ERROR 和 FATAL
hdc shell hilog -L E/F

# 只看 WARN 及以上
hdc shell hilog -L W/E/F

# 所有级别
hdc shell hilog -L D/I/W/E/F
```

## Domain 和 Tag 过滤

```bash
# 按 Domain 过滤
hdc shell hilog -D A03200

# 按 Tag 过滤
hdc shell hilog -T testTag

# 组合过滤
hdc shell hilog -D A03200 -T testTag
```

## PID 过滤

```bash
# 按进程 ID 过滤
hdc shell hilog -P 5394

# 多个 PID
hdc shell hilog -P 5394 -P 5395
```

## 正则表达式过滤

```bash
# 匹配包含 "error" 的日志
hdc shell hilog -e "error"

# 匹配多个关键词
hdc shell hilog -e "error|exception|crash"
```

## 显示格式

```bash
# 彩色显示
hdc shell hilog -v color

# 显示本地时间
hdc shell hilog -v time

# 毫秒精度
hdc shell hilog -v msec

# 显示年份
hdc shell hilog -v year

# 显示时区
hdc shell hilog -v zone

# 组合格式
hdc shell hilog -v color -v time -v msec -v year
```

## Buffer 管理

```bash
# 查询 buffer 大小
hdc shell hilog -g

# 查询指定类型 buffer
hdc shell hilog -g -t app

# 设置 buffer 大小（1MB）
hdc shell hilog -G 1M -t app

# 清除 buffer
hdc shell hilog -r

# 清除指定类型 buffer
hdc shell hilog -r -t app -t core
```

## 落盘管理

```bash
# 查询落盘任务
hdc shell hilog -w query

# 启动落盘（文件名、大小1MB、数量10）
hdc shell hilog -w start -f hilog -l 1048576 -n 10

# 使用 zlib 压缩
hdc shell hilog -w start -f hilog -l 1048576 -n 10 -m zlib

# 停止落盘
hdc shell hilog -w stop

# 刷新缓冲区到文件
hdc shell hilog -w refresh

# 清除落盘文件
hdc shell hilog -w clear
```

## 统计信息

```bash
# 查询统计信息
hdc shell hilog -s -t app

# 按 Domain 统计
hdc shell hilog -s -D A03200

# 清除统计信息
hdc shell hilog -S -t app
```

## 日志级别控制

```bash
# 设置基础日志级别为 INFO
hdc shell hilog -b I

# 为特定 Domain 设置级别
hdc shell hilog -b W -D A03200

# 为特定 Tag 设置级别
hdc shell hilog -b E -T testTag

# 持久化设置（重启不丢失）
hdc shell hilog -b I --persist
```

## TypeScript API

### 采集日志

```typescript
import { startHiLogCapture, stopHiLogCapture } from "./hilog";

// 开始采集
startHiLogCapture("task-id", {
  connectKey: "device-key",
  savePath: "/path/to/log.txt",
  type: [HiLogType.APP],
  level: [HiLogLevel.ERROR, HiLogLevel.FATAL],
});

// 停止采集
stopHiLogCapture("task-id");
```

### Buffer 管理

```typescript
import { clearHiLogBuffer, getHiLogBufferSize } from "./hilog";

// 清除 buffer
await clearHiLogBuffer("device-key");

// 查询大小
const { size } = await getHiLogBufferSize("device-key");
```

### 解析日志

```typescript
import { parseHiLogLine, filterHiLogLines } from "./hilog-utils";

// 解析单行
const parsed = parseHiLogLine(logLine);

// 过滤日志
const filtered = filterHiLogLines(lines, {
  level: [HiLogLevel.ERROR],
  keyword: "crash",
});
```

## 常用组合

### 查看应用错误日志

```bash
hdc shell hilog -t app -L E/F -v color -v time
```

### 导出最近 1000 行日志

```bash
hdc shell hilog -x -z 1000 > app.log
```

### 监控特定应用

```bash
hdc shell hilog -t app -D A03200 -v color -v time
```

### 查找崩溃日志

```bash
hdc shell hilog -e "crash|exception|fatal" -L E/F
```

## 日志格式

```
日期    时间戳           PID   TID   级别  Domain/进程/Tag:  消息
04-19  17:02:14.735    5394  5394  I    A03200/app/tag:  message
```

## 日志级别

| 级别 | 字母 | 说明 |
|------|------|------|
| DEBUG | D | 调试 |
| INFO | I | 信息 |
| WARN | W | 警告 |
| ERROR | E | 错误 |
| FATAL | F | 致命 |

## 日志类型

| 类型 | 说明 |
|------|------|
| app | 应用日志 |
| core | 系统日志 |
| init | 启动日志 |
| kmsg | 内核日志 |

## Buffer 大小

- 最小：64K
- 最大：16M
- 单位：B/K/M
- 示例：`64K`, `1M`, `16M`

## 常见问题

### Q: 如何只看错误日志？

```bash
hdc shell hilog -L E/F
```

### Q: 如何导出日志到文件？

```bash
hdc shell hilog -x > output.log
```

### Q: 如何实时监控特定 Tag？

```bash
hdc shell hilog -T myTag -v color
```

### Q: 如何清除所有日志？

```bash
hdc shell hilog -r
```

### Q: 如何查看日志统计？

```bash
hdc shell hilog -s -t app
```
