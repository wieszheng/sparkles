import { Badge } from "@/components/ui/badge.tsx";
import type { Status } from "@/components/type";
import { motion, AnimatePresence } from "framer-motion";

export function getStatusBadge(executionStatus: Status) {
  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  };

  const badgeTransition = {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
  };

  switch (executionStatus) {
    case "running":
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="running"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={badgeTransition}
          >
            <Badge
              variant="default"
              className="bg-blue-500 text-white rounded-xl animate-pulse shadow-lg"
            >
              执行中
            </Badge>
          </motion.div>
        </AnimatePresence>
      );
    case "success":
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="success"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={badgeTransition}
          >
            <Badge
              variant="default"
              className="bg-green-500 text-white rounded-xl shadow-lg"
            >
              已完成
            </Badge>
          </motion.div>
        </AnimatePresence>
      );
    case "error":
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="error"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={badgeTransition}
          >
            <Badge
              variant="destructive"
              className="rounded-xl shadow-lg animate-bounce"
            >
              失败
            </Badge>
          </motion.div>
        </AnimatePresence>
      );
    case "pending":
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="pending"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={badgeTransition}
          >
            <Badge
              variant="secondary"
              className="bg-yellow-500 text-white rounded-xl shadow-lg"
            >
              等待中
            </Badge>
          </motion.div>
        </AnimatePresence>
      );
    default:
      return null;
  }
}

export function getCardStyle(isCurrentNode: boolean, executionStatus: Status) {
  let baseStyle = `p-3 min-w-[240px] node-hover`; // ${selected ? "ring-2 ring-primary shadow-xl" : ""

  if (isCurrentNode) {
    baseStyle += " ring-2 ring-blue-400 shadow-lg executing-border";
  }

  switch (executionStatus) {
    case "running":
      baseStyle +=
        " border-blue-400 shadow-blue-100 animate-pulse-glow progress-indicator";
      break;
    case "error":
      baseStyle += " border-red-400 shadow-red-100 animate-error-glow";
      break;
    case "pending":
      baseStyle += " border-yellow-400 shadow-yellow-100 animate-pending-glow";
      break;
    case "success":
      baseStyle += "";
      break;
  }

  return baseStyle;
}
