// 脚本执行引擎模块

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { startMonitoring, stopMonitoring } from "./monitor";
import {
  fetchScriptTemplate,
  fetchScriptTemplates,
  matchImage,
  matchImageTemplate,
} from "./persistence";
import {
  clickCmd,
  startApp,
  stopApp,
  uiClick,
  uiDoubleClick,
  uiLongClick,
  uiFling,
  uiSwipe,
  uiDrag,
  uiDircFling,
  uiInputText,
  uiText,
  uiKeyEvent,
  uiGoHome,
  uiGoBack,
  uiPowerKey,
  uiPaste,
  SwipeDirection,
} from "./action.ts";
import { getDeviceKey } from "./index.ts";
import { loadMonitoringConfig } from "../store.ts";

// 任务中止标志
const taskAbortFlags = new Map<string, { aborted: boolean }>();

// 脚本文件存储目录
const SCRIPTS_DIR = join(tmpdir(), "harmony-monitor-scripts");

/**
 * 从 FastAPI 加载脚本模板
 */
export async function loadScriptTemplate(
  templateId: string,
): Promise<{ name: string; description?: string; code: string } | null> {
  try {
    const template = await fetchScriptTemplate(templateId);
    if (template) {
      return {
        name: template.name,
        description: template.description,
        code: template.code,
      };
    }
    return null;
  } catch (error) {
    console.error(
      "[script-engine] failed to load script template",
      templateId,
      error,
    );
    return null;
  }
}
/**
 * 获取所有脚本模板列表（从 FastAPI）
 */
export async function listScriptTemplates(): Promise<
  Array<{ id: string; name: string; description?: string }>
> {
  try {
    const templates = await fetchScriptTemplates();
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    }));
  } catch (error) {
    console.error("[script-engine] failed to list script templates", error);
    return [];
  }
}

/**
 * 获取指定的脚本模板
 */
export async function getScriptTemplate(
  templateId: string,
): Promise<{ name: string; description?: string; code: string } | null> {
  return await loadScriptTemplate(templateId);
}

/**
 * 下载脚本到本地（从 FastAPI 获取并保存到本地文件）
 */
export async function downloadScriptToLocal(
  templateId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    // 从 FastAPI 加载脚本模板（总是获取最新版本）
    const template = await getScriptTemplate(templateId);
    if (!template) {
      return { success: false, message: "脚本模板不存在" };
    }

    // 保存到本地文件（覆盖旧文件）
    saveScriptToFile(templateId, template.code);

    console.log(`[script-engine] 脚本已下载到本地: ${templateId}`);
    return { success: true };
  } catch (error) {
    console.error(`[script-engine] 下载脚本失败: ${templateId}`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 检查脚本是否已下载到本地
 */
export function isScriptDownloaded(templateId: string): boolean {
  const scriptPath = join(SCRIPTS_DIR, `${templateId}.js`);
  return existsSync(scriptPath);
}

/**
 * 获取所有已下载的脚本列表
 */
export function getDownloadedScripts(): string[] {
  if (!existsSync(SCRIPTS_DIR)) {
    return [];
  }

  try {
    const files = readdirSync(SCRIPTS_DIR);
    return files
      .filter((file: string) => file.endsWith(".js"))
      .map((file: string) => file.replace(".js", ""));
  } catch (error) {
    console.error("[script-engine] 读取已下载脚本列表失败", error);
    return [];
  }
}

/**
 * 执行场景脚本（动态加载并执行脚本代码）
 */
export async function runSceneScript(task: SceneTask): Promise<void> {
  const flag = { aborted: false };
  taskAbortFlags.set(task.id, flag);

  const ensureNotAborted = () => {
    if (flag.aborted) {
      throw new Error(`Task ${task.id} aborted`);
    }
  };

  // 从 FastAPI 加载脚本模板
  const template = await getScriptTemplate(task.scriptTemplateId);
  if (!template) {
    throw new Error(`脚本模板不存在: ${task.scriptTemplateId}`);
  }

  // 构建辅助工具函数
  const helpers: ScriptHelpers = {
    log: (message: string) => {
      console.log(`[SceneTask ${task.id}]`, message);
    },
    sleep: (ms: number) => {
      return new Promise((resolve) => {
        if (flag.aborted) {
          return resolve();
        }
        setTimeout(() => {
          resolve();
        }, ms);
      });
    },
    isAborted: () => flag.aborted,
    matchImageTemplate: async (
      screenshotBase64: string | null,
      templateBase64: string,
      threshold: number = 0.8,
    ) => {
      ensureNotAborted();
      const result = await matchImageTemplate(
        screenshotBase64,
        templateBase64,
        threshold,
      );
      if (!result) {
        return { found: false, confidence: 0 };
      }
      return result;
    },
    matchImage: async (templateBase64: string, threshold: number = 0.8) => {
      ensureNotAborted();
      const result = await matchImage(templateBase64, threshold);
      if (!result) {
        return { found: false, confidence: 0 };
      }
      return result;
    },
    tap: async (x: number, y: number) => {
      ensureNotAborted();
      await clickCmd(getDeviceKey()!, "click", { x, y });
      console.log("tap", x, y);
    },
    swipe: async (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      duration: number = 300,
    ) => {
      ensureNotAborted();
      // await swipe(x1, y1, x2, y2, duration);
      console.log("tap", x1, y1, x2, y2, duration);
    },
    inputText: async (x: number, y: number, text: string) => {
      ensureNotAborted();
      await clickCmd(getDeviceKey()!, "input", { x, y, text });
      console.log("inputText", text);
    },
    launchApp: async (packageName: string) => {
      ensureNotAborted();
      await startApp(getDeviceKey()!, packageName);
      console.log("launchApp", packageName);
    },
    stopApp: async (packageName: string) => {
      ensureNotAborted();
      await stopApp(getDeviceKey()!, packageName);
      console.log("stopApp", packageName);
    },
    // UI模拟操作 - 点击相关
    uiClick: async (x: number, y: number) => {
      ensureNotAborted();
      await uiClick(getDeviceKey()!, x, y);
      console.log("uiClick", x, y);
    },
    uiDoubleClick: async (x: number, y: number) => {
      ensureNotAborted();
      await uiDoubleClick(getDeviceKey()!, x, y);
      console.log("uiDoubleClick", x, y);
    },
    uiLongClick: async (x: number, y: number) => {
      ensureNotAborted();
      await uiLongClick(getDeviceKey()!, x, y);
      console.log("uiLongClick", x, y);
    },
    // UI模拟操作 - 滑动相关
    uiFling: async (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      swipeVelocityPps?: number,
      stepLength?: number,
    ) => {
      ensureNotAborted();
      await uiFling(
        getDeviceKey()!,
        fromX,
        fromY,
        toX,
        toY,
        swipeVelocityPps,
        stepLength,
      );
      console.log("uiFling", fromX, fromY, toX, toY, swipeVelocityPps);
    },
    uiSwipe: async (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      swipeVelocityPps?: number,
    ) => {
      ensureNotAborted();
      await uiSwipe(getDeviceKey()!, fromX, fromY, toX, toY, swipeVelocityPps);
      console.log("uiSwipe", fromX, fromY, toX, toY, swipeVelocityPps);
    },
    uiDrag: async (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      swipeVelocityPps?: number,
    ) => {
      ensureNotAborted();
      await uiDrag(getDeviceKey()!, fromX, fromY, toX, toY, swipeVelocityPps);
      console.log("uiDrag", fromX, fromY, toX, toY, swipeVelocityPps);
    },
    uiDircFling: async (
      direction: number,
      swipeVelocityPps?: number,
      stepLength?: number,
    ) => {
      ensureNotAborted();
      await uiDircFling(
        getDeviceKey()!,
        direction,
        swipeVelocityPps,
        stepLength,
      );
      console.log("uiDircFling", direction, swipeVelocityPps, stepLength);
    },
    // UI模拟操作 - 文本输入
    uiInputText: async (x: number, y: number, text: string) => {
      ensureNotAborted();
      await uiInputText(getDeviceKey()!, x, y, text);
      console.log("uiInputText", x, y, text);
    },
    uiText: async (text: string) => {
      ensureNotAborted();
      await uiText(getDeviceKey()!, text);
      console.log("uiText", text);
    },
    // UI模拟操作 - 按键事件
    uiKeyEvent: async (
      keyId1: string | number,
      keyId2?: string | number,
      keyId3?: string | number,
    ) => {
      ensureNotAborted();
      await uiKeyEvent(getDeviceKey()!, keyId1, keyId2, keyId3);
      console.log("uiKeyEvent", keyId1, keyId2, keyId3);
    },
    uiGoHome: async () => {
      ensureNotAborted();
      await uiGoHome(getDeviceKey()!);
      console.log("uiGoHome");
    },
    uiGoBack: async () => {
      ensureNotAborted();
      await uiGoBack(getDeviceKey()!);
      console.log("uiGoBack");
    },
    uiPowerKey: async () => {
      ensureNotAborted();
      await uiPowerKey(getDeviceKey()!);
      console.log("uiPowerKey");
    },
    uiPaste: async () => {
      ensureNotAborted();
      await uiPaste(getDeviceKey()!);
      console.log("uiPaste");
    },
    // 滑动方向常量
    SwipeDirection,
  };
  console.log("runSceneScript", task);
  // 场景脚本整个执行周期内采集监控数据、
  const config = loadMonitoringConfig();
  startMonitoring(task, {
    interval: config.interval,
    thresholds: config.thresholds,
    enableAlerts: config.enableAlerts,
    hilog: config.hilog,
  });
  await helpers.sleep(5000);
  try {
    // 动态执行脚本代码（下载到本地后执行）
    await executeScriptCode(
      task.scriptTemplateId,
      template.code,
      task,
      helpers,
    );
  } finally {
    await stopMonitoring(task.id);
    taskAbortFlags.delete(task.id);
  }
}

/**
 * 将脚本代码保存到本地文件
 */
function saveScriptToFile(templateId: string, code: string): string {
  // 确保脚本目录存在
  if (!existsSync(SCRIPTS_DIR)) {
    mkdirSync(SCRIPTS_DIR, { recursive: true });
  }

  // 生成文件路径（使用模板ID作为文件名）
  const scriptPath = join(SCRIPTS_DIR, `${templateId}.js`);

  // 包装脚本代码为模块导出
  const moduleCode = `
// 脚本模板: ${templateId}
// 自动生成，请勿手动修改

module.exports = async function(task, helpers) {
  ${code}
}
`;

  // 写入文件
  writeFileSync(scriptPath, moduleCode, "utf-8");
  console.log(`[ScriptEngine] 保存脚本到: ${scriptPath}`);
  console.log(`[ScriptEngine] 脚本内容: ${moduleCode}`);

  return scriptPath;
}

/**
 * 执行脚本代码（从本地文件加载并执行
 */
async function executeScriptCode(
  templateId: string,
  code: string,
  task: SceneTask,
  helpers: ScriptHelpers,
): Promise<void> {
  try {
    // 保存脚本到本地文件
    const scriptPath = saveScriptToFile(templateId, code);

    delete require.cache[require.resolve(scriptPath)];
    // 动态加载脚本模块
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scriptModule = require(scriptPath);

    // 执行脚本函数
    if (typeof scriptModule === "function") {
      await scriptModule(task, helpers);
    } else if (typeof scriptModule.default === "function") {
      await scriptModule.default(task, helpers);
    } else {
      throw new Error("脚本模块必须导出一个函数");
    }
  } catch (error) {
    console.error(`[Script Execution Error] Task ${task.id}:`, error);
    throw new Error(
      `脚本执行失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 停止场景脚本执行
 */
export function stopSceneScript(taskId: string): void {
  const flag = taskAbortFlags.get(taskId);
  if (flag) {
    flag.aborted = true;
  }
}
