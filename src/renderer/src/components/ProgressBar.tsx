import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  /** 进度值 (0-100) */
  value?: number;
  /** 进度条宽度类名，默认 'w-32' */
  width?: string;
  /** 进度条高度类名，默认 'h-2' */
  height?: string;
  /** 进度条渐变色，默认 'from-rose-500 to-orange-500' */
  gradient?: string;
  /** 背景色，默认 'bg-gray-800' */
  backgroundColor?: string;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 标签文本 */
  label?: string;
  /** 是否显示百分比 */
  showPercentage?: boolean;
  /** 是否启用动画 */
  animated?: boolean;
  /** 是否启用悬停效果 */
  hoverEffect?: boolean;
  /** 动画持续时间 (ms) */
  duration?: number;
  /** 是否启用闪光动画 */
  shimmer?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
}

export function ProgressBar({
  value = 0,
  width = "w-32",
  height = "h-2",
  gradient = "from-rose-500 to-orange-500",
  backgroundColor = "bg-gray-800",
  showLabel = false,
  label,
  showPercentage = false,
  animated = true,
  hoverEffect = false,
  duration = 300,
  shimmer = false,
  className,
}: ProgressBarProps) {
  // 确保进度值在 0-100 范围内
  const clampedValue = Math.max(0, Math.min(100, value));

  const progressBarContent = (
    <div
      className={cn(
        "overflow-hidden rounded-full",
        height,
        width,
        backgroundColor,
        className,
      )}
    >
      <motion.div
        className={cn(
          "h-full rounded-full bg-gradient-to-r",
          gradient,
          animated && !hoverEffect && "transition-all ease-out",
          hoverEffect && "transition-all duration-300 group-hover:!w-full",
        )}
        style={{
          width: `${clampedValue}%`,
          transitionDuration:
            animated && !hoverEffect ? `${duration}ms` : undefined,
        }}
        initial={animated && !hoverEffect ? { width: 0 } : undefined}
        animate={
          animated && !hoverEffect ? { width: `${clampedValue}%` } : undefined
        }
        transition={
          animated && !hoverEffect
            ? { duration: duration / 1000, ease: "easeOut" }
            : undefined
        }
      >
        {shimmer && (
          <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        )}
      </motion.div>
    </div>
  );

  // 如果需要标签或百分比，包装在容器中
  if (showLabel || showPercentage) {
    return (
      <div className="space-y-2">
        {(showLabel || showPercentage) && (
          <div className="flex items-center justify-between text-xs">
            {showLabel && (
              <span className="font-medium text-white">
                {label || "Progress"}
              </span>
            )}
            {showPercentage && (
              <span className="text-slate-400">
                {Math.round(clampedValue)}%
              </span>
            )}
          </div>
        )}
        {progressBarContent}
      </div>
    );
  }

  // 如果启用悬停效果，包装在 group 容器中
  if (hoverEffect) {
    return <div className="group">{progressBarContent}</div>;
  }

  return progressBarContent;
}

// 预设样式变体
export const ProgressBarVariants = {
  // 基于 Dashboard 中的样式
  dashboard: {
    value: 0,
    width: "w-32",
    height: "h-2",
    gradient: "from-rose-500 to-orange-500",
    backgroundColor: "bg-gray-800",
    hoverEffect: true,
    animated: true,
    duration: 300,
  },

  // 下载进度样式
  download: {
    value: 0,
    width: "w-full",
    height: "h-1.5",
    gradient: "from-emerald-500 to-teal-500",
    backgroundColor: "bg-slate-900",
    shimmer: true,
    animated: true,
    showLabel: true,
    showPercentage: true,
  },

  // 小型进度条
  small: {
    value: 0,
    width: "w-24",
    height: "h-1",
    gradient: "from-blue-500 to-cyan-500",
    backgroundColor: "bg-gray-700",
    animated: true,
  },

  // 大型进度条
  large: {
    value: 0,
    width: "w-full",
    height: "h-3",
    gradient: "from-purple-500 to-pink-500",
    backgroundColor: "bg-gray-800",
    animated: true,
    showLabel: true,
    showPercentage: true,
  },
} as const;

// 便捷组件
export function DashboardProgressBar(props: Partial<ProgressBarProps>) {
  return <ProgressBar {...ProgressBarVariants.dashboard} {...props} />;
}

export function DownloadProgressBar(props: Partial<ProgressBarProps>) {
  return <ProgressBar {...ProgressBarVariants.download} {...props} />;
}

export function SmallProgressBar(props: Partial<ProgressBarProps>) {
  return <ProgressBar {...ProgressBarVariants.small} {...props} />;
}

export function LargeProgressBar(props: Partial<ProgressBarProps>) {
  return <ProgressBar {...ProgressBarVariants.large} {...props} />;
}
