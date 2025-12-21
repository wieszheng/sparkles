import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  AlertCircle,
  Cpu,
  HardDrive,
  Thermometer,
  Battery,
  RotateCcw,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface MonitoringConfigProps {
  config: {
    interval?: string;
    enableAlerts: boolean;
    thresholds: AlertThresholdsConfig;
  };
  onConfigChange: (config: MonitoringConfigProps["config"]) => void;
}

export function MonitoringConfigPanel({
  config,
  onConfigChange,
}: MonitoringConfigProps) {
  const { interval, enableAlerts, thresholds } = config;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const savedConfig = await window.api.loadMonitoringConfig();
      if (savedConfig) {
        onConfigChange(savedConfig);
      }
    } catch (error) {
      console.error("加载监控配置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const result = await window.api.saveMonitoringConfig(config);
      if (result.success) {
        toast.success("配置已保存");
      } else {
        toast.error("保存失败");
      }
    } catch (error) {
      console.error("保存监控配置失败:", error);
      toast.error("保存失败: " + String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("确定要重置为默认配置吗？")) {
      return;
    }
    try {
      setSaving(true);
      const result = await window.api.resetMonitoringConfig();
      if (result.success) {
        await loadConfig();
        toast.success("已重置为默认配置");
      } else {
        toast.error("重置失败");
      }
    } catch (error) {
      console.error("重置监控配置失败:", error);
      toast.error("重置失败: " + String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdChange = (
    key: keyof AlertThresholdsConfig,
    value?: number,
  ) => {
    onConfigChange({
      ...config,
      thresholds: {
        ...thresholds,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 采集设置 */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium">采集设置</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">采样间隔</label>
            <Select
              value={interval && interval !== "" ? interval : "1"}
              onValueChange={(value) =>
                onConfigChange({
                  ...config,
                  interval: value,
                })
              }
            >
              <SelectTrigger className="w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5 秒</SelectItem>
                <SelectItem value="1">1 秒</SelectItem>
                <SelectItem value="2">2 秒</SelectItem>
                <SelectItem value="5">5 秒</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              自定义间隔 (秒)
            </label>
            <Input
              type="number"
              className="w-30 text-xs text-center"
              value={interval ?? ""}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  interval: e.target.value,
                })
              }
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* 告警设置 */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-medium">告警设置</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">启用告警</span>
            <Switch
              onClick={() =>
                onConfigChange({
                  ...config,
                  enableAlerts: !enableAlerts,
                })
              }
              checked={enableAlerts}
            ></Switch>
          </div>
          <p className="text-xs text-muted-foreground">
            当前未启用告警，仍会采集性能指标但不会触发告警事件。
          </p>
        </div>

        <div className="divide-y divide-border/30">
          {[
            {
              icon: Cpu,
              label: "CPU 阈值",
              color: "#3b82f6",
              warningKey: "cpuWarning" as const,
              criticalKey: "cpuCritical" as const,
              unit: "%",
            },
            {
              icon: HardDrive,
              label: "内存阈值",
              color: "#22c55e",
              warningKey: "memoryWarning" as const,
              criticalKey: "memoryCritical" as const,
              unit: "%",
            },
            {
              icon: Thermometer,
              label: "温度阈值",
              color: "#f59e0b",
              warningKey: "temperatureWarning" as const,
              criticalKey: "temperatureCritical" as const,
              unit: "°C",
            },
            {
              icon: Battery,
              label: "FPS 阈值",
              color: "#a855f7",
              warningKey: "fpsWarning" as const,
              criticalKey: "fpsCritical" as const,
              unit: "fps",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="警告"
                    value={thresholds[item.warningKey] ?? ""}
                    onChange={(e) =>
                      handleThresholdChange(
                        item.warningKey,
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                    className="w-18 h-7 text-xs text-center"
                  />
                  <Input
                    type="number"
                    placeholder="严重"
                    value={thresholds[item.criticalKey] ?? ""}
                    onChange={(e) =>
                      handleThresholdChange(
                        item.criticalKey,
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                    className="w-18 h-7 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={saving || loading}
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
          <div className="flex gap-2">
            {loading && (
              <span className="text-xs text-muted-foreground flex items-center">
                加载中...
              </span>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving || loading}>
              <Save className="h-4 w-4" />
              {saving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
