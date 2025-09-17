import type {
  ExecutionContext,
  ExecutionLogEntry,
} from "@/lib/workflow-executor";
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
  return (
    <div key={entry.id} className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            Info
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.duration && (
            <Badge variant="outline" className="text-[10px]">
              耗时: {entry.duration}ms
            </Badge>
          )}
          <span>{entry.timestamp.toLocaleString()}</span>
        </div>
      </div>
      <div className="mt-2 ml-1">
        <p>{entry.message}</p>
        {entry.nodeId && (
          <p className="text-muted-foreground">节点: {entry.nodeId}</p>
        )}
      </div>
    </div>
    // <div
    //   key={entry.id}
    //   className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
    //     entry.status === "error"
    //       ? "bg-destructive/5 border-destructive/20"
    //       : "bg-card"
    //   }`}
    // >
    //   <div className="flex items-center justify-between mb-1">
    //     <div className="flex items-center gap-2">
    //       <Badge variant="outline" className="text-xs">
    //         {getNodeType(entry.nodeId)}
    //       </Badge>
    //       <span className="text-sm font-medium">{entry.status}</span>
    //     </div>
    //     <div className="flex items-center gap-2 text-xs text-muted-foreground">
    //       {entry.duration && (
    //         <Badge variant="outline" className="text-[10px]">
    //           耗时: {entry.duration}ms
    //         </Badge>
    //       )}
    //       <span>{entry.timestamp.toLocaleString()}</span>
    //     </div>
    //   </div>
    //   <div className="flex items-center">
    //     <Info className="h-4 w-4 mr-1" />
    //     <p className="text-sm text-muted-foreground line-clamp-2">
    //       {entry.message}
    //     </p>
    //   </div>
    // </div>
  );
};

// 对话框封装组件
export function ExecutionLogDialog({
  open,
  onClose,
  context,
}: ExecutionLogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>日志详情</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-80 p-3">
            <div className="space-y-3">
              {context.executionLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <Bug className="size-14 mx-auto mb-2 opacity-50" />
                  <p>暂无执行记录</p>
                  <p className="text-xs mt-1">运行工作流后将显示详细日志</p>
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
