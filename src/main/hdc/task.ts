import { stopMonitoring, taskMetrics } from "./monitor";
import { stopSceneScript, runSceneScript } from "./engine";

import {
  persistTask,
  updateTaskStatus as persistUpdateTaskStatus,
  fetchAllTasks,
  fetchTask,
  deleteTask as persistDeleteTask,
} from "./persistence";

// 内存缓存（用于快速访问，与 FastAPI 同步）
const tasks = new Map<string, SceneTask>();

/**
 * 从 FastAPI 同步任务列表到内存缓存
 */
export async function syncTasksFromFastAPI(): Promise<void> {
  try {
    const fetchedTasks = await fetchAllTasks();
    tasks.clear();
    fetchedTasks.forEach((task) => {
      tasks.set(task.id, task);
    });
    console.log(`[task] synced ${fetchedTasks.length} tasks from FastAPI`);
  } catch (error) {
    console.warn("[task] failed to sync tasks from FastAPI", error);
  }
}

/**
 * 获取所有任务（从 FastAPI 获取）
 */
export async function getAllTasks(): Promise<SceneTask[]> {
  try {
    const fetchedTasks = await fetchAllTasks();
    // 更新内存缓存
    tasks.clear();
    fetchedTasks.forEach((task) => {
      tasks.set(task.id, task);
    });
    return fetchedTasks;
  } catch (error) {
    console.warn(
      "[task] failed to fetch tasks from FastAPI, using cache",
      error,
    );
    // 如果 FastAPI 不可用，返回内存缓存
    return Array.from(tasks.values());
  }
}

/**
 * 获取指定任务（从 FastAPI 获取）
 */
export async function getTask(taskId: string): Promise<SceneTask | undefined> {
  try {
    const task = await fetchTask(taskId);
    if (task) {
      // 更新内存缓存
      tasks.set(task.id, task);
      return task;
    }
    // 如果 FastAPI 中没有，检查内存缓存
    return tasks.get(taskId);
  } catch (error) {
    console.warn(
      "[task] failed to fetch task from FastAPI, using cache",
      error,
    );
    return tasks.get(taskId);
  }
}

/**
 * 创建任务（同步到 FastAPI）
 */
export async function createTask(config: SceneTaskConfig): Promise<SceneTask> {
  const task: SceneTask = {
    ...config,
    status: "idle",
    createdAt: Date.now(),
  };

  // 先持久化到 FastAPI
  try {
    await persistTask(config);
    // 成功后更新内存缓存
    tasks.set(task.id, task);
  } catch (error) {
    console.warn("[task] failed to persist task", task.id, error);
    // 即使失败也更新内存缓存（降级处理）
    tasks.set(task.id, task);
  }

  return task;
}

/**
 * 删除任务（从 FastAPI 删除）
 */
export async function removeTask(taskId: string): Promise<boolean> {
  await stopMonitoring(taskId);
  stopSceneScript(taskId);
  taskMetrics.delete(taskId);

  // 从 FastAPI 删除
  try {
    const success = await persistDeleteTask(taskId);
    if (success) {
      tasks.delete(taskId);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[task] failed to delete task from FastAPI", taskId, error);
    // 即使失败也删除内存缓存（降级处理）
    tasks.delete(taskId);
    return true;
  }
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(
  taskId: string,
  status: SceneTaskStatus,
  errorMessage?: string,
): boolean {
  const task = tasks.get(taskId);
  if (!task) {
    return false;
  }
  task.status = status;
  if (errorMessage !== undefined) {
    task.errorMessage = errorMessage;
  }
  tasks.set(task.id, task);

  // 异步同步状态到 FastAPI（不阻塞）
  persistUpdateTaskStatus(taskId, status, errorMessage).catch((error) => {
    console.warn("[task] failed to persist task status", taskId, error);
  });

  return true;
}

/**
 * 启动任务（异步执行脚本）
 */
export async function startTask(
  taskId: string,
): Promise<{ success: boolean; message?: string }> {
  // 先从 FastAPI 获取最新任务状态
  const task = await getTask(taskId);
  if (!task) {
    return { success: false, message: "task not found" };
  }

  if (task.status === "running") {
    return { success: true };
  }

  task.status = "running";
  tasks.set(task.id, task);

  // 异步同步状态到 FastAPI
  persistUpdateTaskStatus(taskId, "running").catch((error) => {
    console.warn("[task] failed to persist task status", taskId, error);
  });

  // 不等待脚本执行完成，脚本在后台跑
  runSceneScript(task)
    .then(async () => {
      const t = await getTask(taskId);
      if (t && t.status === "running") {
        t.status = "finished";
        t.errorMessage = undefined;
        tasks.set(t.id, t);
        persistUpdateTaskStatus(taskId, "finished").catch((error) => {
          console.warn("[task] failed to persist task status", taskId, error);
        });
      }
    })
    .catch(async (error) => {
      console.error("[task] scene script failed", taskId, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 停止监控和脚本执行
      await stopMonitoring(taskId);
      stopSceneScript(taskId);

      const t = await getTask(taskId);
      if (t && t.status === "running") {
        // 检查是否是主动中止任务导致的错误
        const isAborted = errorMessage.toLowerCase().includes("aborted");

        if (isAborted) {
          // 如果是主动中止，设置为 finished 而不是 error
          t.status = "finished";
          t.errorMessage = undefined;
          tasks.set(t.id, t);
          persistUpdateTaskStatus(taskId, "finished").catch((err) => {
            console.warn("[task] failed to persist task status", taskId, err);
          });
        } else {
          // 真正的错误，设置为 error 状态
          t.status = "error";
          t.errorMessage = errorMessage;
          tasks.set(t.id, t);
          persistUpdateTaskStatus(taskId, "error", errorMessage).catch(
            (err) => {
              console.warn("[task] failed to persist task status", taskId, err);
            },
          );
        }
      }
    });

  return { success: true };
}

/**
 * 停止任务
 */
export async function stopTask(
  taskId: string,
): Promise<{ success: boolean; message?: string }> {
  // 先从 FastAPI 获取最新任务状态
  const task = await getTask(taskId);
  if (!task) {
    return { success: false, message: "task not found" };
  }

  // 如果任务已经停止或出错，不需要再次停止
  if (task.status !== "running") {
    return { success: true, message: "task already stopped" };
  }

  await stopMonitoring(taskId);
  stopSceneScript(taskId);

  // 只有在任务正在运行时才更新状态为 finished
  // 如果任务已经出错，保持 error 状态
  if (task.status === "running") {
    task.status = "finished";
    // 清除错误信息（如果有）
    task.errorMessage = undefined;
    tasks.set(task.id, task);

    // 异步同步状态到 FastAPI
    persistUpdateTaskStatus(taskId, "finished").catch((error) => {
      console.warn("[task] failed to persist task status", taskId, error);
    });
  }

  return { success: true };
}
