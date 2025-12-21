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
import { useEffect, useState } from "react";

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
  selectedDevice: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: {
    name: string;
    script: string;
    app: string;
    metrics: Omit<MonitorConfig, "interval">;
  }) => Promise<void>;
}

export function CreateTaskDialog({
  selectedDevice,
  open,
  onOpenChange,
  onCreateTask,
}: CreateTaskDialogProps) {
  const [scripts, setScripts] = useState<ScriptFile[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    script: "",
    app: "",
    metrics: {
      cpu: true,
      memory: true,
      gpu: false,
      fps: false,
      temperature: false,
      power: false,
      network: false,
    } as Omit<MonitorConfig, "interval">,
  });

  // 加载脚本模板和应用列表
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载脚本模板
        const templates = await window.api.listScriptTemplates();
        const mappedScripts: ScriptFile[] = templates.map((t, idx) => ({
          id: idx + 1,
          name: t.id,
          label: t.name,
          description:
            t.description ?? "脚本模板，代码存储在 FastAPI，执行时动态加载",
          content: "// 脚本代码存储在 FastAPI，执行时会动态下载到本地并执行",
          lastModified: new Date().toISOString().split("T")[0],
          category: "other",
          difficulty: "beginner",
          downloads: 0,
          rating: 5,
          author: "用户创建",
          tags: [],
        }));
        setScripts(mappedScripts);

        // 加载应用列表
        const bundleNames = await window.api.getBundles(selectedDevice, false);

        if (bundleNames.length > 0) {
          // 获取应用详细信息
          const bundleInfos = await window.api.getBundleInfos(
            selectedDevice,
            bundleNames,
          );
          setApps(bundleInfos);
        } else {
          setApps([]);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };
    if (open) {
      void loadData();
    }
  }, [open]);

  // 重置表单
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        script: "",
        app: "",
        metrics: {
          cpu: true,
          memory: true,
          gpu: false,
          fps: false,
          temperature: false,
          power: false,
          network: false,
        } as Omit<MonitorConfig, "interval">,
      });
    }
  }, [open]);
  const handleMetricToggle = (metricKey: string, checked: boolean) => {
    setFormData({
      ...formData,
      metrics: {
        ...formData.metrics,
        [metricKey]: checked,
      },
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.script || !formData.app) return;
    await onCreateTask(formData);
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
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">选择脚本</label>
              <Select
                value={formData.script}
                onValueChange={(value) =>
                  setFormData({ ...formData, script: value })
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
                  setFormData({ ...formData, app: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择一个应用" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.bundleName} value={app.bundleName}>
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
          <Button onClick={handleCreate} size="sm">
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
