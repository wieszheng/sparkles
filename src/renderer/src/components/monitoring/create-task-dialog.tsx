import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Battery, Cpu, HardDrive, Thermometer, Wifi } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const monitorMetrics: MonitorMetric[] = [
  { key: "cpu", label: "CPU 使用率", icon: Cpu, color: "#3b82f6", unit: "%" },
  {
    key: "memory",
    label: "内存占用",
    icon: HardDrive,
    color: "#10b981",
    unit: "MB",
  },
  {
    key: "gpu",
    label: "GPU 负载",
    icon: Cpu,
    color: "#6366f1",
    unit: "%",
  },
  {
    key: "fps",
    label: "FPS 帧率",
    icon: Thermometer,
    color: "#22c55e",
    unit: "fps",
  },
  {
    key: "temperature",
    label: "温度",
    icon: Thermometer,
    color: "#f59e0b",
    unit: "°C",
  },
  {
    key: "power",
    label: "功耗",
    icon: Battery,
    color: "#8b5cf6",
    unit: "W",
  },
  {
    key: "network",
    label: "网络流量",
    icon: Wifi,
    color: "#ec4899",
    unit: "MB/s",
  },
];

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: ScriptFile[];
  apps: Application[];
  formData: {
    name: string;
    script: string;
    app: string;
    metrics: Omit<MonitorConfig, "interval">;
  };
  onFormDataChange: (data: {
    name: string;
    script: string;
    app: string;
    metrics: Omit<MonitorConfig, "interval">;
  }) => void;
  onCreateTask: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  scripts,
  apps,
  formData,
  onFormDataChange,
  onCreateTask,
}: CreateTaskDialogProps) {
  const handleMetricToggle = (metricKey: string, checked: boolean) => {
    onFormDataChange({
      ...formData,
      metrics: {
        ...formData.metrics,
        [metricKey]: checked,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-card">
        <DialogHeader>
          <DialogTitle>新建监控任务</DialogTitle>
          <DialogDescription className="text-xs">
            创建一个新的场景监控任务
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">任务名称</label>
            <Input
              placeholder="例如: 登录流程监控"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">选择脚本</label>
              <Select
                value={formData.script}
                onValueChange={(value) =>
                  onFormDataChange({ ...formData, script: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择一个脚本" />
                </SelectTrigger>
                <SelectContent>
                  {scripts.map((script) => (
                    <SelectItem key={script.id} value={script.name}>
                      {script.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">选择应用</label>
              <Select
                value={formData.app}
                onValueChange={(value) =>
                  onFormDataChange({ ...formData, app: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择一个应用" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem 
                      key={app.bundleName} 
                      value={app.bundleName}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="truncate block">{app.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium">监控指标</label>
            <div className="mt-1">
              <div className="grid grid-cols-2 gap-2">
                {monitorMetrics.map((metric) => {
                  const Icon = metric.icon;

                  const isEnabled =
                    formData.metrics[metric.key as keyof MonitorConfig];

                  return (
                    <div
                      key={metric.key}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1 rounded"
                          style={{ backgroundColor: `${metric.color}20` }}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: metric.color }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {metric.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({metric.unit})
                        </span>
                      </div>
                      <Switch
                        checked={isEnabled as boolean}
                        onCheckedChange={(checked) =>
                          handleMetricToggle(metric.key, checked)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
          >
            取消
          </Button>
          <Button onClick={onCreateTask} size="sm">
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
