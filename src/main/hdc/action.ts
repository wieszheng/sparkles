import { sendKey, shell, KeyCode } from "./utils";
import assert from "node:assert";
import { getClient } from "./index";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function startApp(
  connectKey: string,
  packageName: string,
): Promise<string | string[]> {
  const client = getClient();
  return await shell(
    client,
    connectKey,
    `aa start -a EntryAbility -b ${packageName}`,
  );
}

export async function stopApp(
  connectKey: string,
  packageName: string,
): Promise<string | string[]> {
  const client = getClient();

  return await shell(client, connectKey, `aa force-stop ${packageName}`);
}
export async function clearApp(
  connectKey: string,
  packageName: string,
): Promise<void> {
  const client = getClient();

  await shell(client, connectKey, `bm clean -n ${packageName} -c`);
  await shell(client, connectKey, `bm clean -n ${packageName} -d`);
}
export async function forceStartApp(
  connectKey: string,
  packageName: string,
): Promise<void> {
  await stopApp(connectKey, packageName);
  await sleep(1000);
  await goHome(connectKey);
  await startApp(connectKey, packageName);
}
export async function goBack(connectKey: string): Promise<string | string[]> {
  const client = getClient();

  return await sendKey(client, connectKey, KeyCode.BACK);
}

export async function goHome(connectKey: string): Promise<string | string[]> {
  const client = getClient();

  return await sendKey(client, connectKey, KeyCode.HOME);
}

export async function clickCmd(
  connectKey: string,
  clickType: "click" | "double" | "long" | "input",
  position: {
    x: number;
    y: number;
    text?: string;
  },
) {
  const client = getClient();
  assert(
    clickType === "input" ||
      clickType === "click" ||
      clickType === "double" ||
      clickType === "long",
    "Invalid click type",
  );
  assert(position.x >= 0 && position.y >= 0, "Invalid position");

  switch (clickType) {
    case "input":
      return await shell(
        client,
        connectKey,
        `uitest uiInput inputText ${position.x} ${position.y} "${position.text}"`,
      );
    case "long":
      return await shell(
        client,
        connectKey,
        `uitest uiInput longClick ${position.x} ${position.y}`,
      );
    case "double":
      return await shell(
        client,
        connectKey,
        `uitest uiInput doubleClick ${position.x} ${position.y}`,
      );
    default:
      return await shell(
        client,
        connectKey,
        `uitest uiInput click ${position.x} ${position.y}`,
      );
  }
}

/**
 * UI模拟操作 - 单击
 * @param connectKey 设备连接键
 * @param x 点击x坐标点
 * @param y 点击y坐标点
 */
export async function uiClick(
  connectKey: string,
  x: number,
  y: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(x >= 0 && y >= 0, "Invalid position");
  return await shell(client, connectKey, `uitest uiInput click ${x} ${y}`);
}

/**
 * UI模拟操作 - 双击
 * @param connectKey 设备连接键
 * @param x 点击x坐标点
 * @param y 点击y坐标点
 */
export async function uiDoubleClick(
  connectKey: string,
  x: number,
  y: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(x >= 0 && y >= 0, "Invalid position");
  return await shell(
    client,
    connectKey,
    `uitest uiInput doubleClick ${x} ${y}`,
  );
}

/**
 * UI模拟操作 - 长按
 * @param connectKey 设备连接键
 * @param x 点击x坐标点
 * @param y 点击y坐标点
 */
export async function uiLongClick(
  connectKey: string,
  x: number,
  y: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(x >= 0 && y >= 0, "Invalid position");
  return await shell(client, connectKey, `uitest uiInput longClick ${x} ${y}`);
}

/**
 * UI模拟操作 - 快滑（带惯性滚动）
 * @param connectKey 设备连接键
 * @param fromX 滑动起点x坐标
 * @param fromY 滑动起点y坐标
 * @param toX 滑动终点x坐标
 * @param toY 滑动终点y坐标
 * @param swipeVelocityPps 滑动速度，单位：px/s，取值范围：200-40000，默认值：600
 * @param stepLength 滑动步长，单位：px，默认值：滑动距离/50
 */
export async function uiFling(
  connectKey: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  swipeVelocityPps?: number,
  stepLength?: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(
    fromX >= 0 && fromY >= 0 && toX >= 0 && toY >= 0,
    "Invalid coordinates",
  );

  let cmd = `uitest uiInput fling ${fromX} ${fromY} ${toX} ${toY}`;
  if (swipeVelocityPps !== undefined) {
    cmd += ` ${swipeVelocityPps}`;
    if (stepLength !== undefined) {
      cmd += ` ${stepLength}`;
    }
  }

  return await shell(client, connectKey, cmd);
}

/**
 * UI模拟操作 - 慢滑
 * @param connectKey 设备连接键
 * @param fromX 滑动起点x坐标
 * @param fromY 滑动起点y坐标
 * @param toX 滑动终点x坐标
 * @param toY 滑动终点y坐标
 * @param swipeVelocityPps 滑动速度，单位：px/s，取值范围：200-40000，默认值：600
 */
export async function uiSwipe(
  connectKey: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  swipeVelocityPps?: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(
    fromX >= 0 && fromY >= 0 && toX >= 0 && toY >= 0,
    "Invalid coordinates",
  );

  let cmd = `uitest uiInput swipe ${fromX} ${fromY} ${toX} ${toY}`;
  if (swipeVelocityPps !== undefined) {
    cmd += ` ${swipeVelocityPps}`;
  }

  return await shell(client, connectKey, cmd);
}

/**
 * UI模拟操作 - 拖拽
 * @param connectKey 设备连接键
 * @param fromX 滑动起点x坐标
 * @param fromY 滑动起点y坐标
 * @param toX 滑动终点x坐标
 * @param toY 滑动终点y坐标
 * @param swipeVelocityPps 滑动速度，单位：px/s，取值范围：200-40000，默认值：600
 */
export async function uiDrag(
  connectKey: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  swipeVelocityPps?: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(
    fromX >= 0 && fromY >= 0 && toX >= 0 && toY >= 0,
    "Invalid coordinates",
  );

  let cmd = `uitest uiInput drag ${fromX} ${fromY} ${toX} ${toY}`;
  if (swipeVelocityPps !== undefined) {
    cmd += ` ${swipeVelocityPps}`;
  }

  return await shell(client, connectKey, cmd);
}

/**
 * 滑动方向常量
 */
export const SwipeDirection = {
  LEFT: 0, // 向左滑动
  RIGHT: 1, // 向右滑动
  UP: 2, // 向上滑动
  DOWN: 3, // 向下滑动
} as const;

export type SwipeDirection =
  (typeof SwipeDirection)[keyof typeof SwipeDirection];

/**
 * UI模拟操作 - 指定方向滑动
 * @param connectKey 设备连接键
 * @param direction 滑动方向，0=左，1=右，2=上，3=下
 * @param swipeVelocityPps 滑动速度，单位：px/s，取值范围：200-40000，默认值：600
 * @param stepLength 滑动步长，单位：px
 */
export async function uiDircFling(
  connectKey: string,
  direction: number = SwipeDirection.LEFT,
  swipeVelocityPps?: number,
  stepLength?: number,
): Promise<string | string[]> {
  const client = getClient();
  assert(direction >= 0 && direction <= 3, "Invalid direction");

  let cmd = `uitest uiInput dircFling ${direction}`;
  if (swipeVelocityPps !== undefined) {
    cmd += ` ${swipeVelocityPps}`;
    if (stepLength !== undefined) {
      cmd += ` ${stepLength}`;
    }
  }

  return await shell(client, connectKey, cmd);
}

/**
 * UI模拟操作 - 输入框输入（需指定坐标）
 * @param connectKey 设备连接键
 * @param x 输入框x坐标点
 * @param y 输入框y坐标点
 * @param text 输入文本内容
 */
export async function uiInputText(
  connectKey: string,
  x: number,
  y: number,
  text: string,
): Promise<string | string[]> {
  const client = getClient();
  assert(x >= 0 && y >= 0, "Invalid position");
  assert(text && text.length > 0, "Text cannot be empty");
  console.log(`Input text: "${text}"`);
  return await shell(
    client,
    connectKey,
    `uitest uiInput inputText ${x} ${y} "${text}"`,
  );
}

/**
 * UI模拟操作 - 当前获焦处输入文本（无需坐标）
 * @param connectKey 设备连接键
 * @param text 输入文本内容
 */
export async function uiText(
  connectKey: string,
  text: string,
): Promise<string | string[]> {
  const client = getClient();
  assert(text && text.length > 0, "Text cannot be empty");

  return await shell(client, connectKey, `uitest uiInput text "${text}"`);
}

/**
 * UI模拟操作 - 按键事件
 * @param connectKey 设备连接键
 * @param keyId1 实体按键对应ID，取值范围：Back、Home、Power、或KeyCode键码值
 * @param keyId2 可选，实体按键对应ID（用于组合键）
 * @param keyId3 可选，实体按键对应ID（用于组合键）
 */
export async function uiKeyEvent(
  connectKey: string,
  keyId1: string | number,
  keyId2?: string | number,
  keyId3?: string | number,
): Promise<string | string[]> {
  const client = getClient();

  let cmd = `uitest uiInput keyEvent ${keyId1}`;
  if (keyId2 !== undefined) {
    cmd += ` ${keyId2}`;
    if (keyId3 !== undefined) {
      cmd += ` ${keyId3}`;
    }
  }

  return await shell(client, connectKey, cmd);
}

/**
 * UI模拟操作 - 返回主页
 * @param connectKey 设备连接键
 */
export async function uiGoHome(connectKey: string): Promise<string | string[]> {
  return await uiKeyEvent(connectKey, "Home");
}

/**
 * UI模拟操作 - 返回上一级
 * @param connectKey 设备连接键
 */
export async function uiGoBack(connectKey: string): Promise<string | string[]> {
  return await uiKeyEvent(connectKey, "Back");
}

/**
 * UI模拟操作 - 电源键
 * @param connectKey 设备连接键
 */
export async function uiPowerKey(
  connectKey: string,
): Promise<string | string[]> {
  return await uiKeyEvent(connectKey, "Power");
}

/**
 * UI模拟操作 - 组合键粘贴（Ctrl+V）
 * @param connectKey 设备连接键
 */
export async function uiPaste(connectKey: string): Promise<string | string[]> {
  return await uiKeyEvent(connectKey, 2072, 2038);
}

/**
 * UI模拟操作 - 输入单个字符
 * @param connectKey 设备连接键
 * @param char 要输入的字符
 * @param uppercase 是否大写（默认false）
 */
export async function uiInputChar(
  connectKey: string,
  char: string,
  uppercase: boolean = false,
): Promise<string | string[]> {
  assert(char.length === 1, "Only single character is allowed");

  // 示例：输入字母v的KeyCode为2038，Shift的KeyCode为2047
  // 这里需要根据实际KeyCode映射表来实现
  // 简化示例：仅处理字母v/V
  if (char.toLowerCase() === "v") {
    if (uppercase) {
      return await uiKeyEvent(connectKey, 2047, 2038); // Shift + V
    } else {
      return await uiKeyEvent(connectKey, 2038); // v
    }
  }

  throw new Error(`Character '${char}' is not supported yet`);
}
