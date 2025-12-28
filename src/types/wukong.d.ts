// Wukong 测试类型
type WukongTestType = "exec" | "special" | "focus";

// Wukong 任务状态
type WukongTaskStatus = "idle" | "running" | "finished" | "error";

// Wukong 随机测试配置
interface WukongExecConfig {
  seed?: number;
  interval?: number; // ms
  count?: number;
  time?: number; // 分钟
  bundle?: string[];
  prohibit?: string[];
  page?: string[];
  appswitch?: number; // 比例 0-1
  touch?: number; // 比例 0-1
  swap?: number; // 比例 0-1
  mouse?: number; // 比例 0-1
  keyboard?: number; // 比例 0-1
  hardkey?: number; // 比例 0-1
  rotate?: number; // 比例 0-1
  component?: number; // 比例 0-1
  screenshot?: boolean;
  allowAbility?: string[];
  blockAbility?: string[];
  blockCompId?: string[];
  blockCompType?: string[];
  checkBWScreen?: boolean;
  uri?: string;
  uriType?: string;
}

// Wukong 专项测试配置
interface WukongSpecialConfig {
  count?: number;
  interval?: number; // ms
  time?: number; // 分钟
  touch?: { x: number; y: number };
  swap?: {
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    bilateral?: boolean;
  };
  spec_insomnia?: boolean;
  component?: string; // bundle name
  screenshot?: boolean;
  record?: string; // 录制文件路径
  replay?: string; // 回放文件路径
  uitest?: boolean;
}

// Wukong 专注测试配置
interface WukongFocusConfig {
  numberfocus?: number;
  focustypes?: string[]; // 控件类型列表
  seed?: number;
  interval?: number; // ms
  count?: number;
  time?: number; // 分钟
  bundle?: string[];
  prohibit?: string[];
  page?: string[];
  appswitch?: number; // 比例 0-1
  touch?: number; // 比例 0-1
  swap?: number; // 比例 0-1
  mouse?: number; // 比例 0-1
  keyboard?: number; // 比例 0-1
  hardkey?: number; // 比例 0-1
  rotate?: number; // 比例 0-1
  component?: number; // 比例 0-1
  screenshot?: boolean;
  allowAbility?: string[];
  blockAbility?: string[];
  blockCompId?: string[];
  blockCompType?: string[];
  checkBWScreen?: boolean;
}

// Wukong 任务
interface WukongTask {
  id: string;
  name: string;
  testType: WukongTestType;
  config: WukongExecConfig | WukongSpecialConfig | WukongFocusConfig;
  command?: string; // 命令字符串（前端生成）
  status: WukongTaskStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  reportPath?: string;
  errorMessage?: string;
  packageName?: string; // 用于性能监控的应用包名
  metrics?: string[]; // 监控指标列表
}
