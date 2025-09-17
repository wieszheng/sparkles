import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  isVisible: boolean;
  progress?: number;
  status: "running" | "pending" | "success" | "error" | "idle";
}

export function ProgressIndicator({
  isVisible,
  progress = 0,
  status,
}: ProgressIndicatorProps) {
  if (!isVisible || status === "idle") return null;

  const getProgressColor = () => {
    switch (status) {
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-2 space-y-1"
    >
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>执行进度</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="relative">
        <Progress value={progress} className="h-1" />
        <motion.div
          className={`absolute top-0 left-0 h-1 rounded-full ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {status === "running" && (
        <motion.div
          className="flex items-center gap-1 text-xs text-blue-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.div
            className="w-1 h-1 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1 h-1 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
          <span className="ml-1">执行中...</span>
        </motion.div>
      )}
    </motion.div>
  );
}
