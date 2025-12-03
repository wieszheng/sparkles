import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "./types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig = {
  running: {
    label: "运行中",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  completed: {
    label: "已完成",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  stopped: {
    label: "已停止",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  error: {
    label: "异常",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  pending: {
    label: "待执行",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
