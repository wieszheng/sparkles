import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Clock,
  AlertCircle,
  Save,
  Cpu,
  HardDrive,
  Thermometer,
  Battery,
} from "lucide-react";
import type { MonitorConfig } from "./types";
import { monitorMetrics } from "./mock-data";

interface MonitoringConfigProps {
  config: MonitorConfig;
  onConfigChange: (config: MonitorConfig) => void;
}

export function MonitoringConfigPanel({
  config,
  onConfigChange,
}: MonitoringConfigProps) {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-base font-semibold">监控配置</h2>
        <p className="text-xs text-muted-foreground mt-1">
          配置监控指标、采集参数和告警规则
        </p>
      </div>

      {/* 监控指标配置 */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">监控指标</h3>
        </div>
        <div className="divide-y divide-border/30">
          {monitorMetrics.map((metric) => {
            const Icon = metric.icon;
            const isEnabled = config[metric.key as keyof MonitorConfig];
            return (
              <div
                key={metric.key}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${metric.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: metric.color }} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{metric.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({metric.unit})
                    </span>
                  </div>
                </div>
                <Switch
                  checked={isEnabled as boolean}
                  onCheckedChange={(checked) =>
                    onConfigChange({
                      ...config,
                      [metric.key]: checked,
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 采集设置 */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium">采集设置</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">采集间隔</label>
            <div className="flex gap-1.5">
              {[
                { value: "10s", label: "10秒" },
                { value: "30s", label: "30秒" },
                { value: "1m", label: "1分钟" },
                { value: "5m", label: "5分钟" },
                { value: "10m", label: "10分钟" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onConfigChange({ ...config, interval: option.value })
                  }
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                    config.interval === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              数据保留时长
            </label>
            <Select defaultValue="7d">
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 天</SelectItem>
                <SelectItem value="3d">3 天</SelectItem>
                <SelectItem value="7d">7 天</SelectItem>
                <SelectItem value="30d">30 天</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">存储位置</label>
            <Select defaultValue="local">
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">本地存储</SelectItem>
                <SelectItem value="cloud">云端存储</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 告警设置 */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-medium">告警设置</h3>
        </div>
        <div className="divide-y divide-border/30">
          {[
            {
              icon: Cpu,
              label: "CPU 阈值",
              color: "#3b82f6",
              value: 90,
              unit: "%",
            },
            {
              icon: HardDrive,
              label: "内存阈值",
              color: "#22c55e",
              value: 85,
              unit: "%",
            },
            {
              icon: Thermometer,
              label: "温度阈值",
              color: "#f59e0b",
              value: 70,
              unit: "°C",
            },
            {
              icon: Battery,
              label: "电量阈值",
              color: "#a855f7",
              value: 20,
              unit: "%",
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
                    defaultValue={item.value}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground w-6">
                    {item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button className="h-8 px-5 text-xs">
          <Save className="h-3.5 w-3.5 mr-1.5" />
          保存配置
        </Button>
      </div>
    </div>
  );
}
