import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface MonitoringConfigProps {
  config: {
    enableAlerts: boolean;
    thresholds: AlertThresholdsConfig;
  };
  onConfigChange: (config: MonitoringConfigProps["config"]) => void;
}

export function MonitoringConfigPanel({
  config,
  onConfigChange,
}: MonitoringConfigProps) {
  const { enableAlerts, thresholds } = config;
  const [interval, setInterval] = useState<string>("1");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // HiLog 配置
  const [enableHiLog, setEnableHiLog] = useState(true);
  const [hilogRotationInterval, setHilogRotationInterval] = useState<string>("5");
  const [hilogMaxFiles, setHilogMaxFiles] = useState<string>("10");
  const [hilogCompress, setHilogCompress] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const savedConfig = await window.api.loadMonitoringConfig();
      if (savedConfig) {
        if (savedConfig.interval) {
          setInterval(savedConfig.interval);
        }
        onConfigChange({
          enableAlerts: savedConfig.enableAlerts ?? false,
          thresholds: savedConfig.thresholds ?? thresholds,
        });

        // 加载 HiLog 配置
        if (savedConfig.hilog) {
          setEnableHiLog(savedConfig.hilog.enabled ?? true);
          setHilogRotationInterval(
            String(savedConfig.hilog.rotationInterval ?? 5)
          );
          setHilogMaxFiles(String(savedConfig.hilog.maxFiles ?? 10));
          setHilogCompress(savedConfig.hilog.compress ?? false);
        }
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

      const result = await window.api.saveMonitoringConfig({
        ...config,
        interval,
        hilog: {
          enabled: enableHiLog,
          rotationInterval: Number(hilogRotationInterval),
          maxFiles: Number(hilogMaxFiles),
          compress: hilogCompress,
        },
      });
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
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full">
          <div className="space-y-4 mr-3 mb-4">
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
                    onValueChange={(value) => {
                      setInterval(value);
                    }}
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
                    onChange={(e) => {
                      setInterval(e.target.value);
                    }}
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

            {/* HiLog 日志配置 */}
            <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium">HiLog 日志配置</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* 启用 HiLog */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">启用 HiLog 采集</label>
                    <p className="text-xs text-muted-foreground">
                      自动采集应用和系统日志
                    </p>
                  </div>
                  <Switch
                    checked={enableHiLog}
                    onCheckedChange={setEnableHiLog}
                  />
                </div>

                {/* 轮转配置 */}
                {enableHiLog && (
                  <>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs font-medium text-muted-foreground mb-3">
                        日志轮转设置（防止文件过大）
                      </p>
                    </div>

                    {/* 轮转间隔 */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm text-muted-foreground">
                          轮转间隔
                        </label>
                        <p className="text-xs text-muted-foreground">
                          每隔指定时间自动切换到新文件
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          className="w-20 h-8 text-xs text-center"
                          value={hilogRotationInterval}
                          onChange={(e) => setHilogRotationInterval(e.target.value)}
                          placeholder="5"
                        />
                        <span className="text-xs text-muted-foreground">分钟</span>
                      </div>
                    </div>

                    {/* 最大文件数 */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm text-muted-foreground">
                          最大保留文件数
                        </label>
                        <p className="text-xs text-muted-foreground">
                          超过此数量自动删除旧文件
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          className="w-20 h-8 text-xs text-center"
                          value={hilogMaxFiles}
                          onChange={(e) => setHilogMaxFiles(e.target.value)}
                          placeholder="10"
                        />
                        <span className="text-xs text-muted-foreground">个</span>
                      </div>
                    </div>

                    {/* 压缩选项 */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm text-muted-foreground">
                          压缩旧文件
                        </label>
                        <p className="text-xs text-muted-foreground">
                          使用 gzip 压缩节省空间
                        </p>
                      </div>
                      <Switch
                        checked={hilogCompress}
                        onCheckedChange={setHilogCompress}
                      />
                    </div>

                    {/* 配置说明 */}
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">
                        💡 提示：默认每 5 分钟轮转一次，保留最近 10 个文件
                        {hilogRotationInterval === "0" && (
                          <span className="block mt-1 text-amber-600">
                            ⚠️ 轮转间隔为 0 将禁用日志轮转
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* 保存按钮 */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={saving || loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <div className="flex gap-2">
            {loading && (
              <span className="text-xs text-muted-foreground flex items-center">
                加载中...
              </span>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving || loading}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
