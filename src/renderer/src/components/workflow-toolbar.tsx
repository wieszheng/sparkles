import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  GitBranch,
  MousePointer,
  MousePointer2,
  Move,
  Play,
  Plus,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

import { motion } from "framer-motion";
import type { WorkflowData } from "../../../types/workflow";

interface WorkflowToolbarProps {
  onAddNode: (type: string) => void;
  currentNodes?: Node[];
  currentEdges?: Edge[];
  onLoadWorkflow?: (workflow: WorkflowData) => void;
}

export function WorkflowToolbar({ onAddNode }: WorkflowToolbarProps) {
  const [isNodePanelExpanded, setIsNodePanelExpanded] = useState(false);

  const nodeTypes = [
    {
      type: "start",
      label: "开始",
      description: "启动应用程序",
      icon: <Play />,
    },
    {
      type: "click",
      label: "点击",
      description: "点击元素",
      icon: <MousePointer />,
    },
    { type: "print", label: "输入", description: "输入文本", icon: <Type /> },
    { type: "close", label: "关闭", description: "关闭应用", icon: <X /> },
    {
      type: "wait",
      label: "等待",
      description: "等待指定时间",
      icon: <Clock />,
    },
    {
      type: "scroll",
      label: "滚动",
      description: "滚动页面",
      icon: <MousePointer2 />,
    },
    {
      type: "screenshot",
      label: "截图",
      description: "截取屏幕",
      icon: <Camera />,
    },
    {
      type: "condition",
      label: "条件",
      description: "条件判断",
      icon: <GitBranch />,
    },
    {
      type: "loop",
      label: "循环",
      description: "循环执行",
      icon: <RotateCcw />,
    },
    { type: "swipe", label: "滑动", description: "滑动操作", icon: <Move /> },
    // { type: "variable", label: "变量", description: "设置变量" },
    // { type: "keyboard", label: "按键", description: "按键操作" },
    // { type: "drag", label: "拖拽", description: "拖拽元素" },
  ];

  return (
    <Card
      className="absolute top-4 left-4 p-2.5 z-10 min-w-[200px]"
      onMouseEnter={() => setIsNodePanelExpanded(true)}
      onMouseLeave={() => setIsNodePanelExpanded(false)}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">节点面板</span>
          </div>
          {isNodePanelExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>

        {isNodePanelExpanded && (
          <motion.div
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {nodeTypes.map((nodeType) => (
              <Button
                key={nodeType.type}
                size="sm"
                variant="outline"
                onClick={() => onAddNode(nodeType.type)}
                className="text-xs h-auto p-2 flex flex-col items-start gap-1"
                title={nodeType.description}
              >
                <div className="flex">
                  {nodeType.icon}
                  <span className="font-medium ml-2">{nodeType.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {nodeType.description}
                </span>
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </Card>
  );
}
