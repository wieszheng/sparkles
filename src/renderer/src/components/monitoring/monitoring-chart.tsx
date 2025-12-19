import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Battery, Cpu, HardDrive, Thermometer, Wifi } from "lucide-react";

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
interface MonitoringChartProps {
  metricKey: string;
  data: Array<{ time: string; value: number }>;
}

export function MonitoringChart({ metricKey, data }: MonitoringChartProps) {
  const metric = monitorMetrics.find((m) => m.key === metricKey);
  if (!metric) return null;

  const Icon = metric.icon;

  // 计算平均值
  const averageValue = data.length > 0 
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length 
    : 0;

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: metric.color }}
        />
        <span className="text-xs font-medium text-foreground truncate">
          {metric.label}
        </span>
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {averageValue > 0 && (
            <span className="text-[10px] text-muted-foreground">
              <span className="opacity-60">平均:</span>{" "}
              <span style={{ color: metric.color }}>
                {averageValue.toFixed(1)}
                {metric.unit}
              </span>
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            <span className="opacity-60">当前:</span>{" "}
            {data[data.length - 1]?.value}
            {metric.unit}
          </span>
        </div>
      </div>
      <div className="h-[160px]">
        <ChartContainer
          config={{
            value: {
              label: metric.label,
              color: metric.color,
            },
          }}
          className="w-full h-full"
        >
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`color${metricKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.2}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {averageValue > 0 && (
              <ReferenceLine
                y={averageValue}
                stroke={metric.color}
                strokeDasharray="5 5"
                strokeWidth={2}
                strokeOpacity={0.8}
                label={{
                  value: `${averageValue.toFixed(1)}${metric.unit}`,
                  position: "insideBottomLeft",
                  fontSize: 11,
                  fill: metric.color,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#color${metricKey})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
