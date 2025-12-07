import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedNodeWrapperProps {
  children: ReactNode;
  isCurrentNode: boolean;
  executionStatus: Status;
  nodeId: string;
}

export function AnimatedNodeWrapper({
  children,
  isCurrentNode,
  executionStatus,
  nodeId,
}: AnimatedNodeWrapperProps) {
  const nodeVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    running: {
      scale: 1.01,
      rotate: 0,
      boxShadow: "0 10px 25px -3px rgba(59, 130, 246, 0.3)",
    },
    error: {
      scale: 1,
      rotate: [-1, 1, -1, 0],
      boxShadow: "0 10px 25px -3px rgba(239, 68, 68, 0.3)",
    },
    pending: {
      scale: 1.01,
      rotate: 0,
      boxShadow: "0 10px 25px -3px rgba(234, 179, 8, 0.3)",
    },
  };

  const getAnimationState = () => {
    if (isCurrentNode) return "running";
    return executionStatus;
  };

  return (
    <motion.div
      key={nodeId}
      variants={nodeVariants}
      animate={getAnimationState()}
      className="relative"
    >
      <AnimatePresence>
        {isCurrentNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -inset-1 rounded-lg bg-blue-400/20 blur-sm -z-10"
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {executionStatus === "running" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-1 rounded-lg bg-blue-400/10 -z-10"
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
              animate={{ opacity: 1 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {executionStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -inset-1 rounded-lg bg-red-400/20 -z-10"
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {children}
    </motion.div>
  );
}
