import React from "react";
import type {
  ExecutionContext,
  ExecutionLogEntry,
} from "../../../types/workflow";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bug } from "lucide-react";

interface ExecutionLogDialogProps {
  open: boolean;
  onClose: () => void;
  context: ExecutionContext;
}

// 日志条目组件
const LogEntry = ({ entry }: { entry: ExecutionLogEntry }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            🔄 等待中
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default" className="text-xs bg-blue-500">
            ⚡ 运行中
          </Badge>
        );
      case "success":
        return (
          <Badge variant="default" className="text-xs bg-green-500">
            ✅ 成功
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="text-xs">
            ❌ 失败
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            📝 信息
          </Badge>
        );
    }
  };

  const getNodeTypeDisplay = (nodeId: string) => {
    const nodeTypeMap: Record<string, string> = {
      workflow: "🔄 工作流",
      start: "🚀 启动",
      click: "👆 点击",
      print: "⌨️ 输入",
      screenshot: "📷 截图",
      scroll: "📜 滚动",
      swipe: "👉 滑动",
      wait: "⏳ 等待",
      condition: "❓ 条件",
      loop: "🔁 循环",
      close: "❌ 关闭",
      hdc: "📲 HDC",
    };

    return nodeTypeMap[nodeId] || `📦 ${nodeId}`;
  };

  const isError = entry.status === "error";
  const isSuccess = entry.status === "success";
  const isRunning = entry.status === "running";

  // 解析详细信息
  const parts = entry.message.split(" | 详情: ");
  const mainMessage = parts[0];
  let details = null;

  if (parts.length > 1) {
    try {
      details = JSON.parse(parts[1]);
    } catch {
      // 如果无法解析，就作为普通文本显示
    }
  }
  const Translations: Record<string, string> = {
    device: "设备",
    nodeList: "节点列表",
    nodeId: "节点ID",
    nodeRelations: "节点关系",
    totalNodes: "总节点数",
    executedNodes: "已执行节点",
    successNodes: "成功节点",
    errorNodes: "失败节点",
    skippedNodes: "跳过节点",
    errorType: "错误类型",
    currentNode: "当前节点",
    totalDuration: "总耗时",
    logCount: "日志数量",
    nodeType: "节点类型",
    performanceLevel: "性能等级",
    selector: "选择器",
    clickType: "点击类型",
    position: "坐标",
    suggestion: "建议",
    startMode: "启动模式",
    waitTime: "等待时间",
    appName: "应用名称",
    operationType: "操作类型",
    operationResult: "操作结果",
    fileName: "文件名",
    saveLocation: "保存位置",
    savePath: "保存路径",
    fileSize: "文件大小",
    direction: "方向",
    distance: "距离",
    startPosition: "起始位置",
    endPosition: "结束位置",
    duration: "持续时间",
    operator: "操作符",
    expectedValue: "期望值",
    checkResult: "检查结果",
    loopType: "循环类型",
    targetCount: "目标次数",
    currentIteration: "当前迭代",
    shouldContinue: "是否继续",
    waitType: "等待类型",
    closeMethod: "关闭方式",
    target: "目标",
    command: "命令",
    error: "错误",
    stopTime: "停止时间",
    executionTime: "执行时间",
    executionStatus: "执行状态",
    finalNodeStatus: "最终节点状态",
  };

  return (
    <div
      key={entry.id}
      className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
        isError
          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
          : isSuccess
            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
            : isRunning
              ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
              : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusBadge(entry.status)}
          <Badge variant="outline" className="text-xs">
            {getNodeTypeDisplay(entry.nodeId)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.duration && (
            <Badge variant="outline" className="text-[10px]">
              ⏱️ {entry.duration}ms
            </Badge>
          )}
          <span className="font-mono">
            {entry.timestamp.toLocaleTimeString("zh-CN", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p
          className={`text-sm ${
            isError
              ? "text-red-700 dark:text-red-300"
              : isSuccess
                ? "text-green-700 dark:text-green-300"
                : "text-foreground"
          }`}
        >
          {mainMessage}
        </p>

        {details && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border text-xs">
            <div className="flex items-center gap-2 font-medium mb-2 text-muted-foreground">
              <span className="text-blue-500">📋</span>
              详细信息
            </div>
            <div className="space-y-2">
              {Object.entries(details).map(([key, value]) => {
                const displayValue =
                  typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value);

                return (
                  <div
                    key={key}
                    className="grid grid-cols-[120px_1fr] gap-2 items-start"
                  >
                    <span
                      className="text-muted-foreground font-medium truncate"
                      title={key}
                    >
                      {Translations[key] || key}:
                    </span>
                    <div
                      className={`font-mono text-[10px] break-all ${
                        typeof value === "object"
                          ? "bg-muted/30 p-1 rounded whitespace-pre-wrap"
                          : ""
                      }`}
                    >
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 对话框封装组件
export function ExecutionLogDialog({
  open,
  onClose,
  context,
}: ExecutionLogDialogProps) {
  // 调试信息
  React.useEffect(() => {
    console.log("ExecutionLogDialog context:", context);
    console.log("ExecutionLogDialog executionLog:", context.executionLog);
  }, [context]);

  // 计算日志统计信息
  const logStats = React.useMemo(() => {
    const logs = context.executionLog;
    console.log("计算日志统计，日志数量:", logs.length);
    const total = logs.length;
    const pending = logs.filter((log) => log.status === "pending").length;
    const running = logs.filter((log) => log.status === "running").length;
    const success = logs.filter((log) => log.status === "success").length;
    const error = logs.filter((log) => log.status === "error").length;

    const nodeTypes = [...new Set(logs.map((log) => log.nodeId))].length;
    const avgDuration =
      logs
        .filter((log) => log.duration)
        .reduce((acc, log) => acc + (log.duration || 0), 0) /
        logs.filter((log) => log.duration).length || 0;

    return {
      total,
      pending,
      running,
      success,
      error,
      nodeTypes,
      avgDuration: Math.round(avgDuration),
    };
  }, [context.executionLog]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            执行日志详情
            {context.isRunning && (
              <Badge variant="default" className="bg-blue-500 animate-pulse">
                ⚡ 运行中
              </Badge>
            )}
          </DialogTitle>

          {/* 日志统计信息 */}
          {logStats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <Badge variant="outline" className="text-[10px]">
                总计: {logStats.total}
              </Badge>
              {logStats.success > 0 && (
                <Badge variant="default" className="bg-green-500 text-[10px]">
                  ✓ 成功: {logStats.success}
                </Badge>
              )}
              {logStats.error > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  ✗ 失败: {logStats.error}
                </Badge>
              )}
              {logStats.running > 0 && (
                <Badge variant="default" className="bg-blue-500 text-[10px]">
                  ⚡ 运行: {logStats.running}
                </Badge>
              )}
              {logStats.avgDuration > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  平均: {logStats.avgDuration}ms
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px]">
                节点类型: {logStats.nodeTypes}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-96 p-3">
            <div className="space-y-3">
              {context.executionLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <Bug className="size-14 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">暂无执行记录</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">
                    运行工作流后将显示详细日志
                  </p>
                </div>
              ) : (
                context.executionLog.map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
