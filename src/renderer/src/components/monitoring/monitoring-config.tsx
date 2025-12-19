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
} from "lucide-react";

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
              <SelectTrigger className="w-32">
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
              className="w-32 text-xs text-center"
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
            <button
              type="button"
              onClick={() =>
                onConfigChange({
                  ...config,
                  enableAlerts: !enableAlerts,
                })
              }
              className={`h-6 w-12 rounded-full border p-1 transition ${
                enableAlerts
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-border bg-background"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full transition ${
                  enableAlerts
                    ? "translate-x-5 bg-emerald-600"
                    : "translate-x-0 bg-muted-foreground"
                }`}
              />
            </button>
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
                    className="w-16 h-8 text-xs text-center"
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
                    className="w-16 h-8 text-xs text-center"
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

      {/* 保存按钮（当前仅更新父组件 state，不做持久化） */}
      {/*<div className="flex justify-end">*/}
      {/*  <Button*/}
      {/*    className="h-8 px-5 text-xs"*/}
      {/*    type="button"*/}
      {/*    onClick={() => {*/}
      {/*      // 预留：未来如需持久化到本地配置，可在父组件中监听 config 变化*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <Save className="h-3.5 w-3.5 mr-1.5" />*/}
      {/*    保存配置*/}
      {/*  </Button>*/}
      {/*</div>*/}
    </div>
  );
}
