export interface Target {
  key: string;
  name: string;
  ohosVersion: string;
  sdkVersion: string;
}

export type GetTargets = () => Promise<Target[]>;
export type Screencap = (
  connectKey: string,
  saveToLocal?: boolean,
) => Promise<string>;

export type StartScreenRecording = (connectKey: string) => Promise<string>;
export type StopScreenRecording = (connectKey: string) => Promise<string>;

/**
 * 设备交互操作类型
 * T: 操作参数类型
 * 当 T = void 时，params 参数可选
 * 当 T ≠ void 时，params 参数必选
 */
export type DeviceAction<T = void> = T extends void
  ? (connectKey: string, params?: T) => Promise<boolean>
  : (connectKey: string, params: T) => Promise<boolean>;

/**
 * 触控点坐标
 */
export interface TouchPoint {
  x: number;
  y: number;
}

/**
 * 滑动操作参数
 */
export interface SwipeAction {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration?: number; // 持续时间(毫秒)
}

/**
 * 文本输入参数
 */
export interface InputText {
  text: string;
}

/**
 * 按键事件类型
 * 可以是字符串(如 'Home', 'Back')或数字键码
 */
export type KeyEvent = string;

/**
 * 屏幕分辨率
 */
export interface ScreenResolution {
  width: number;
  height: number;
}

/**
 * 方向枚举类型
 */
export const SwipeDirection = {
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3,
} as const;

export type SwipeDirection =
  (typeof SwipeDirection)[keyof typeof SwipeDirection];
