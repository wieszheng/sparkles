import { Badge } from "@/components/ui/badge";

interface TaskStatusBadgeProps {
  status: SceneTaskStatus;
}

// 后端状态配置: idle | running | finished | error
const statusConfig: Record<SceneTaskStatus, { label: string; className: string }> = {
  running: {
    label: "运行中",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  finished: {
    label: "已完成",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  completed: {
    label: "已完成",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  error: {
    label: "异常",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  idle: {
    label: "待执行",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status || "未知",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
