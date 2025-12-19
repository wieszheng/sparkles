// import { execCommand, execHdc, execHdcShell } from "./hdc";
// import { startMonitoring, stopMonitoring } from './monitor'

// 脚本模板注册表
import { startMonitoring, stopMonitoring } from "./monitor.ts";

const scriptTemplates = new Map<string, ScriptTemplateMeta>();

// 任务中止标志
const taskAbortFlags = new Map<string, { aborted: boolean }>();

/**
 * 注册脚本模板
 */
export function registerScriptTemplate(meta: ScriptTemplateMeta): void {
  scriptTemplates.set(meta.id, meta);
}

/**
 * 获取所有已注册的脚本模板列表
 */
export function listScriptTemplates(): Array<{
  id: string;
  name: string;
  description?: string;
}> {
  return Array.from(scriptTemplates.values()).map(
    ({ id, name, description }) => ({
      id,
      name,
      description,
    }),
  );
}

/**
 * 获取指定的脚本模板
 */
export function getScriptTemplate(
  templateId: string,
): ScriptTemplateMeta | undefined {
  return scriptTemplates.get(templateId);
}

/**
 * 执行场景脚本
 */
export async function runSceneScript(task: SceneTask): Promise<void> {
  const flag = { aborted: false };
  taskAbortFlags.set(task.id, flag);

  const ensureNotAborted = () => {
    if (flag.aborted) {
      throw new Error(`Task ${task.id} aborted`);
    }
  };

  // 查找对应的脚本模板
  const templateMeta = scriptTemplates.get(task.scriptTemplateId);
  if (!templateMeta) {
    throw new Error(`脚本模板不存在: ${task.scriptTemplateId}`);
  }
  // 场景脚本整个执行周期内采集监控数据
  startMonitoring(task, task.monitorConfig);

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
    execHdcShell: async (cmd: string) => {
      ensureNotAborted();
      console.log(`[SceneTask ${task.id}] execHdcShell: ${cmd}`);
      return "execHdcShell(cmd)";
    },
    isAborted: () => flag.aborted,
  };

  try {
    // 调用脚本模板函数
    await templateMeta.template(task, helpers);
  } finally {
    stopMonitoring(task.id);
    taskAbortFlags.delete(task.id);
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
