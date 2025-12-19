import { stopMonitoring } from "./monitor";
import { stopSceneScript, runSceneScript } from "./engine";
import { taskMetrics } from "./monitor";

// 简单内存任务存储，后续可替换为持久化存储
const tasks = new Map<string, SceneTask>();

/**
 * 获取所有任务
 */
export function getAllTasks(): SceneTask[] {
  return Array.from(tasks.values());
}

/**
 * 获取指定任务
 */
export function getTask(taskId: string): SceneTask | undefined {
  return tasks.get(taskId);
}

/**
 * 创建任务
 */
export function createTask(config: SceneTaskConfig): SceneTask {
  const task: SceneTask = {
    ...config,
    status: "idle",
    createdAt: Date.now(),
  };
  tasks.set(task.id, task);
  return task;
}

/**
 * 删除任务
 */
export function removeTask(taskId: string): boolean {
  stopMonitoring(taskId);
  stopSceneScript(taskId);
  taskMetrics.delete(taskId);
  return tasks.delete(taskId);
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(
  taskId: string,
  status: SceneTaskStatus,
): boolean {
  const task = tasks.get(taskId);
  if (!task) {
    return false;
  }
  task.status = status;
  tasks.set(task.id, task);
  return true;
}

/**
 * 启动任务（异步执行脚本）
 */
export function startTask(taskId: string): {
  success: boolean;
  message?: string;
} {
  const task = tasks.get(taskId);
  if (!task) return { success: false, message: "task not found" };

  if (task.status === "running") {
    return { success: true };
  }

  task.status = "running";
  tasks.set(task.id, task);

  // 不等待脚本执行完成，脚本在后台跑
  runSceneScript(task)
    .then(() => {
      const t = tasks.get(taskId);
      if (t && t.status === "running") {
        t.status = "finished";
        tasks.set(t.id, t);
      }
    })
    .catch((error) => {
      console.error("scene script failed", error);
      const t = tasks.get(taskId);
      if (t) {
        t.status = "error";
        tasks.set(t.id, t);
      }
    });

  return { success: true };
}

/**
 * 停止任务
 */
export function stopTask(taskId: string): {
  success: boolean;
  message?: string;
} {
  const task = tasks.get(taskId);
  if (!task) return { success: false, message: "task not found" };

  stopMonitoring(taskId);
  stopSceneScript(taskId);

  task.status = "finished";
  tasks.set(task.id, task);

  return { success: true };
}
