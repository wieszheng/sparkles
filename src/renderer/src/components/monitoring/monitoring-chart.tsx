import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { monitorMetrics } from "./mock-data";

interface MonitoringChartProps {
  metricKey: string;
  data: Array<{ time: string; value: number }>;
}

export function MonitoringChart({ metricKey, data }: MonitoringChartProps) {
  const metric = monitorMetrics.find((m) => m.key === metricKey);
  if (!metric) return null;

  const Icon = metric.icon;

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
        <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">
          {data[data.length - 1]?.value}
          {metric.unit}
        </span>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#color${metricKey})`}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
