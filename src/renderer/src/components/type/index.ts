import type { Node } from "@xyflow/react";

export type Status = "pending" | "running" | "success" | "error" | "idle";
export type Operator =
  | "equals"
  | "contains"
  | "exists"
  | "not_exists"
  | "greater"
  | "less"
  | "visible"
  | "enabled";

export type LoopType = "count" | "condition" | "foreach";

export type ScreenshotFormat = "png" | "jpg";

export type SwipeDirection = "up" | "down" | "left" | "right";

export type ClickNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  selectedDevice: string;
  config: {
    selector?: string;
    x?: number;
    y?: number;
    clickType?: string;
    waitTime?: string;
    retryCount?: string;
  };
}>;

export type CloseNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    waitTime?: number;
    closeMode?: string;
    target?: string;
  };
}>;

export type StartNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    appName?: string;
    waitTime?: number;
    startingMode?: string;
    retryCount?: number;
  };
}>;

export type ConditionNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    selector: string;
    operator: Operator;
    value: string;
    attribute?: string;
    waitTime?: string;
    retryCount?: string;
  };
}>;

export type InputNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    text: string;
    selector: string;
    waitTime?: number;
    retryCount?: number;
    clearFirst?: string;
  };
}>;

export type LoopNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    type: LoopType;
    count?: number;
    selector?: string;
    condition?: string;
    maxIterations?: number;
    waitTime?: string;
  };
}>;

export type ScreenshotNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    filename: string;
    fullScreen: boolean;
    selector?: string;
    format?: ScreenshotFormat;
  };
}>;

export type ScrollNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    selector: string;
    direction: string;
    scrollTarget: string;
    distance?: number;
    smooth?: string;
    speed?: string;
  };
}>;

export type SwipeNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    selector?: string;
    direction: SwipeDirection;
    distance?: number;
    duration?: number;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
  };
}>;

export type WaitNode = Node<{
  executionStatus: Status;
  isCurrentNode: boolean;
  onConfigChange: (newConfig) => void;
  onSingleNodeExecute?: (nodeId: string) => void;
  progress?: number;
  config: {
    duration: number;
    unit: "seconds" | "milliseconds";
    waitType: "fixed" | "arise" | "vanish";
    selector?: string;
  };
}>;
