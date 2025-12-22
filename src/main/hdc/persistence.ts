import { getDeviceKey, screencap } from "./index.ts";

const FASTAPI_ENDPOINT =
  process.env.FASTAPI_ENDPOINT || "http://120.48.31.197:8000/api/v1/monitor";

/**
 * 图片模板匹配（调用 FastAPI 接口）
 * @param screenshotBase64 截图 base64（可选，如果不提供则自动截图）
 * @param templateBase64 模板图片 base64
 * @param threshold 匹配阈值（0-1，默认0.8）
 */
export async function matchImageTemplate(
  screenshotBase64: string | null,
  templateBase64: string,
  threshold: number = 0.8,
): Promise<{
  found: boolean;
  confidence: number;
  position?: { x: number; y: number; width: number; height: number };
  center?: { x: number; y: number };
} | null> {
  try {
    let screenshot: string;

    // 如果没有提供截图，自动截图
    if (!screenshotBase64) {
      screenshot = await screencap(getDeviceKey()!, false);
    } else {
      screenshot = screenshotBase64;
    }

    const url = `${FASTAPI_ENDPOINT}/image-template/match`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        screenshot,
        template: templateBase64,
        threshold,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        "[persistence] matchImageTemplate failed",
        url,
        response.status,
        response.statusText,
        errorText,
      );
      return null;
    }

    return (await response.json()) as {
      found: boolean;
      confidence: number;
      position?: { x: number; y: number; width: number; height: number };
      center?: { x: number; y: number };
    };
  } catch (error) {
    console.error("[persistence] matchImageTemplate failed", error);
    return null;
  }
}

/**
 * 简化的图片模板匹配（只需要提供模板数据，自动截图匹配）
 * @param templateBase64 模板图片 base64
 * @param threshold 匹配阈值（0-1，默认0.8）
 */
export async function matchImage(
  templateBase64: string,
  threshold: number = 0.8,
): Promise<{
  found: boolean;
  confidence: number;
  position?: { x: number; y: number; width: number; height: number };
  center?: { x: number; y: number };
} | null> {
  return matchImageTemplate(null, templateBase64, threshold);
}

async function getJson<T = unknown>(path: string): Promise<T | null> {
  const url = `${FASTAPI_ENDPOINT}${path}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.warn(
        "[persistence] GET failed",
        url,
        response.status,
        response.statusText,
      );
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn("[persistence] failed to GET", url, error);
    return null;
  }
}

async function postJson<T = unknown>(
  path: string,
  body: unknown,
): Promise<T | null> {
  const url = `${FASTAPI_ENDPOINT}${path}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.warn(
        "[persistence] POST failed",
        url,
        response.status,
        response.statusText,
      );
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn("[persistence] failed to POST", url, error);
    return null;
  }
}

async function patchJson<T = unknown>(
  path: string,
  body: unknown,
): Promise<T | null> {
  const url = `${FASTAPI_ENDPOINT}${path}`;
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.warn(
        "[persistence] PATCH failed",
        url,
        response.status,
        response.statusText,
      );
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn("[persistence] failed to PATCH", url, error);
    return null;
  }
}

async function deleteJson(path: string): Promise<boolean> {
  const url = `${FASTAPI_ENDPOINT}${path}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      console.warn(
        "[persistence] DELETE failed",
        url,
        response.status,
        response.statusText,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[persistence] failed to DELETE", url, error);
    return false;
  }
}

/**
 * 将监控样本持久化到 FastAPI 服务
 */
export async function persistMonitorSample(
  task: SceneTask,
  sample: MonitorSample,
): Promise<void> {
  await postJson("/metrics", {
    taskId: task.id,
    sample: {
      timestamp: sample.timestamp,
      cpu: sample.cpu,
      memory: sample.memory,
      appCpuUsage: sample.appCpuUsage,
      appMemoryUsage: sample.appMemoryUsage,
      appMemoryPercent: sample.appMemoryPercent,
      fps: sample.fps,
      fpsStability: sample.fpsStability,
      gpuLoad: sample.gpuLoad,
      powerConsumption: sample.powerConsumption,
      networkUpSpeed: sample.networkUpSpeed,
      networkDownSpeed: sample.networkDownSpeed,
      deviceTemperature: sample.deviceTemperature,
      performanceScore: sample.performanceScore,
    },
  });
}

/**
 * 创建任务到 FastAPI 服务
 */
export async function persistTask(config: SceneTaskConfig): Promise<void> {
  await postJson("/tasks", {
    id: config.id,
    name: config.name,
    packageName: config.packageName,
    scriptTemplateId: config.scriptTemplateId,
    metrics: config.metrics,
    monitorConfig: config.monitorConfig,
  });
}

/**
 * 更新任务状态到 FastAPI 服务
 */
export async function updateTaskStatus(
  taskId: string,
  status: SceneTask["status"],
  errorMessage?: string,
): Promise<void> {
  await patchJson(`/tasks/${taskId}`, {
    status,
    errorMessage,
  });
}

/**
 * 更新任务监控配置到 FastAPI 服务
 */
export async function updateTaskMonitorConfig(
  taskId: string,
  monitorConfig: SceneTask["monitorConfig"],
): Promise<void> {
  await patchJson(`/tasks/${taskId}`, {
    monitorConfig,
  });
}

/**
 * FastAPI 任务响应格式
 */
interface TaskOut {
  id: string;
  name: string;
  packageName: string;
  scriptTemplateId: string;
  metrics: string[];
  status: string;
  errorMessage?: string;
  archived: boolean;
  monitorConfig?: {
    interval?: number;
    enableAlerts?: boolean;
    thresholds?: {
      fpsWarning?: number;
      fpsCritical?: number;
      cpuWarning?: number;
      cpuCritical?: number;
      memoryWarning?: number;
      memoryCritical?: number;
      temperatureWarning?: number;
      temperatureCritical?: number;
    };
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * FastAPI 任务输出格式
 */
interface TaskOut {
  id: string;
  name: string;
  packageName: string;
  scriptTemplateId: string;
  metrics: string[];
  status: string;
  monitorConfig?: SceneTask["monitorConfig"];
  errorMessage?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 从 FastAPI 任务格式转换为 SceneTask
 */
function taskOutToSceneTask(taskOut: TaskOut): SceneTask {
  return {
    id: taskOut.id,
    name: taskOut.name,
    packageName: taskOut.packageName,
    scriptTemplateId: taskOut.scriptTemplateId,
    metrics: taskOut.metrics as SceneTask["metrics"],
    status: taskOut.status as SceneTask["status"],
    monitorConfig: taskOut.monitorConfig as SceneTask["monitorConfig"],
    createdAt: taskOut.createdAt,
    errorMessage: taskOut.errorMessage,
    archived: taskOut.archived,
  };
}

/**
 * 从 FastAPI 查询所有任务
 */
export async function fetchAllTasks(): Promise<SceneTask[]> {
  const tasks = await getJson<TaskOut[]>("/tasks");
  if (!tasks) {
    return [];
  }
  return tasks.map(taskOutToSceneTask);
}

/**
 * 从 FastAPI 查询单个任务
 */
export async function fetchTask(taskId: string): Promise<SceneTask | null> {
  const task = await getJson<TaskOut>(`/tasks/${taskId}`);
  if (!task) {
    return null;
  }
  return taskOutToSceneTask(task);
}

/**
 * 从 FastAPI 删除任务
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  return await deleteJson(`/tasks/${taskId}`);
}

/**
 * 归档/取消归档任务
 */
export async function archiveTask(
  taskId: string,
  archived: boolean,
): Promise<boolean> {
  const result = await patchJson(
    `/tasks/${taskId}/archive?archived=${archived}`,
    {},
  );
  return result !== null;
}

/**
 * FastAPI 监控样本响应格式
 */
interface MetricOut {
  id: number;
  taskId: string;
  timestamp: number;
  cpu?: number;
  memory?: number;
  appCpuUsage?: number;
  appMemoryUsage?: number;
  appMemoryPercent?: number;
  fps?: number;
  fpsStability?: number;
  gpuLoad?: number;
  powerConsumption?: number;
  networkUpSpeed?: number;
  networkDownSpeed?: number;
  deviceTemperature?: number;
  performanceScore?: {
    overall: number;
    fpsScore: number;
    cpuScore: number;
    memoryScore: number;
    temperatureScore: number;
    powerScore: number;
    grade: string;
  };
}

/**
 * 从 FastAPI 查询任务的监控样本列表
 */
export async function fetchTaskMetrics(
  taskId: string,
  limit: number = 1000,
): Promise<MonitorSample[]> {
  const metrics = await getJson<MetricOut[]>(
    `/metrics?task_id=${taskId}&limit=${limit}`,
  );
  if (!metrics) {
    return [];
  }

  // 转换为 MonitorSample 格式，按时间戳升序排列（最早的在前）
  return metrics
    .map((metric) => ({
      taskId: metric.taskId,
      timestamp: metric.timestamp,
      cpu: metric.cpu,
      memory: metric.memory,
      appCpuUsage: metric.appCpuUsage,
      appMemoryUsage: metric.appMemoryUsage,
      appMemoryPercent: metric.appMemoryPercent,
      fps: metric.fps,
      fpsStability: metric.fpsStability,
      gpuLoad: metric.gpuLoad,
      powerConsumption: metric.powerConsumption,
      networkUpSpeed: metric.networkUpSpeed,
      networkDownSpeed: metric.networkDownSpeed,
      deviceTemperature: metric.deviceTemperature,
      performanceScore: metric.performanceScore,
    }))
    .sort((a, b) => a.timestamp - b.timestamp); // 按时间戳升序
}

/**
 * 脚本模板相关接口
 */
interface ScriptTemplateOut {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 从 FastAPI 查询所有脚本模板
 */
export async function fetchScriptTemplates(): Promise<ScriptTemplateOut[]> {
  const templates = await getJson<ScriptTemplateOut[]>("/script-templates");
  return templates || [];
}

/**
 * 从 FastAPI 查询单个脚本模板
 */
export async function fetchScriptTemplate(
  templateId: string,
): Promise<ScriptTemplateOut | null> {
  const template = await getJson<ScriptTemplateOut>(
    `/script-templates/${templateId}`,
  );
  return template || null;
}

/**
 * 创建脚本模板到 FastAPI
 */
export async function persistScriptTemplate(
  id: string,
  name: string,
  description: string | undefined,
  code: string,
): Promise<void> {
  await postJson("/script-templates", {
    id,
    name,
    description,
    code,
  });
}

/**
 * 更新脚本模板到 FastAPI
 */
export async function updateScriptTemplate(
  id: string,
  name?: string,
  description?: string,
  code?: string,
): Promise<void> {
  await patchJson(`/script-templates/${id}`, {
    name,
    description,
    code,
  });
}

/**
 * 从 FastAPI 删除脚本模板
 */
export async function deleteScriptTemplate(id: string): Promise<boolean> {
  return await deleteJson(`/script-templates/${id}`);
}
