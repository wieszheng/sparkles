// 脚本执行引擎模块

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { startMonitoring, stopMonitoring } from "./monitor";
import { fetchScriptTemplate, matchImageTemplate } from "./persistence";
import { startApp, stopApp } from "./action.ts";
import { getDeviceKey } from "./index.ts";

// 脚本模板缓存（从 FastAPI 加载）
const scriptTemplateCache = new Map<
  string,
  { name: string; description?: string; code: string; updatedAt: number }
>();

// 本地脚本文件缓存（模板ID -> 文件路径）
const scriptFileCache = new Map<string, string>();

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
      // 更新缓存
      scriptTemplateCache.set(templateId, {
        name: template.name,
        description: template.description,
        code: template.code,
        updatedAt: template.updatedAt,
      });
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
    const { fetchScriptTemplates } = await import("./persistence");
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
 * 获取指定的脚本模板（从缓存或 FastAPI）
 */
export async function getScriptTemplate(
  templateId: string,
): Promise<{ name: string; description?: string; code: string } | null> {
  // 先检查缓存
  const cached = scriptTemplateCache.get(templateId);
  if (cached) {
    return {
      name: cached.name,
      description: cached.description,
      code: cached.code,
    };
  }

  // 从 FastAPI 加载
  return await loadScriptTemplate(templateId);
}

/**
 * 下载脚本到本地（从 FastAPI 获取并保存到本地文件）
 */
export async function downloadScriptToLocal(
  templateId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    // 从 FastAPI 加载脚本模板
    const template = await getScriptTemplate(templateId);
    if (!template) {
      return { success: false, message: "脚本模板不存在" };
    }

    // 保存到本地文件
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

  // 确保脚本已下载到本地（如果未下载则先下载）
  if (!isScriptDownloaded(task.scriptTemplateId)) {
    console.log(
      `[script-engine] 脚本未下载，正在下载: ${task.scriptTemplateId}`,
    );
    const downloadResult = await downloadScriptToLocal(task.scriptTemplateId);
    if (!downloadResult.success) {
      throw new Error(`脚本下载失败: ${downloadResult.message || "未知错误"}`);
    }
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
      screenshotBase64: string,
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
    tap: async (x: number, y: number) => {
      ensureNotAborted();
      // await tap(x, y);
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
    inputText: async (text: string) => {
      ensureNotAborted();
      // await inputText(text);
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
  };

  // 场景脚本整个执行周期内采集监控数据
  startMonitoring(task, task.monitorConfig);

  try {
    // 动态执行脚本代码（下载到本地后执行）
    await executeScriptCode(
      task.scriptTemplateId,
      template.code,
      task,
      helpers,
    );
  } finally {
    stopMonitoring(task.id);
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

  // 缓存文件路径
  scriptFileCache.set(templateId, scriptPath);

  return scriptPath;
}

/**
 * 执行脚本代码（从本地文件加载并执行）
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

    // 清除 require 缓存（如果文件已存在），确保使用最新代码
    if (require.cache[scriptPath]) {
      delete require.cache[scriptPath];
    }

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
