import { BrowserWindow, dialog, ipcMain } from "electron";
import log from "electron-log";
import { getSettingsStore } from "./store";
import {
  getTargets,
  getWorkflowExecutor,
  installApp,
  screencap,
  startScreenRecording,
  stopScreenRecording,
} from "./hdc";
import { clearApp, goBack, goHome } from "./hdc/action";
import {
  cleanBundleCache,
  cleanBundleData,
  getBundleInfos,
  getBundles,
  getTopBundle,
  installBundle,
  startBundle,
  stopBundle,
  uninstallBundle,
} from "./hdc/bundle";

import { startCaptureScreen, stopCaptureScreen } from "./hdc/uitest";

import fs from "fs-extra";
import { File, FormData } from "formdata-node";
import path from "path";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 8000;

export function initIpcHandlers(): void {
  // ==================== HDC 相关 IPC 处理程序 ====================
  ipcMain.handle("get-targets", async () => {
    return await getTargets();
  });

  // ==================== 屏幕镜像相关 IPC 处理程序 ====================
  ipcMain.handle(
    "startCaptureScreen",
    async (_, connectKey: string, scale: number) => {
      try {
        log.info("开始屏幕镜像", { connectKey, scale });
        await startCaptureScreen(connectKey, scale);
        return { success: true };
      } catch (error) {
        log.error("启动屏幕镜像失败:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "未知错误",
        };
      }
    },
  );

  ipcMain.handle("stopCaptureScreen", async (_, connectKey: string) => {
    try {
      log.info("停止屏幕镜像", { connectKey });
      await stopCaptureScreen(connectKey);
      return { success: true };
    } catch (error) {
      log.error("停止屏幕镜像失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  });

  // ==================== Bundle 相关 IPC 处理程序 ====================
  ipcMain.handle(
    "get-bundles",
    async (_, connectKey: string, system?: boolean) => {
      return await getBundles(connectKey, system);
    },
  );

  ipcMain.handle(
    "get-bundle-infos",
    async (_, connectKey: string, bundleNames: string[]) => {
      return await getBundleInfos(connectKey, bundleNames);
    },
  );

  ipcMain.handle(
    "install-bundle",
    async (_, connectKey: string, hap: string) => {
      return await installBundle(connectKey, hap);
    },
  );

  ipcMain.handle(
    "start-bundle",
    async (_, connectKey: string, bundleName: string, ability?: string) => {
      return await startBundle(connectKey, bundleName, ability);
    },
  );

  ipcMain.handle(
    "stop-bundle",
    async (_, connectKey: string, bundleName: string) => {
      return await stopBundle(connectKey, bundleName);
    },
  );

  ipcMain.handle(
    "clean-bundle-data",
    async (_, connectKey: string, bundleName: string) => {
      return await cleanBundleData(connectKey, bundleName);
    },
  );

  ipcMain.handle(
    "clean-bundle-cache",
    async (_, connectKey: string, bundleName: string) => {
      return await cleanBundleCache(connectKey, bundleName);
    },
  );

  ipcMain.handle(
    "uninstall-bundle",
    async (_, connectKey: string, bundleName: string) => {
      return await uninstallBundle(connectKey, bundleName);
    },
  );

  ipcMain.handle("get-top-bundle", async (_, connectKey: string) => {
    return await getTopBundle(connectKey);
  });

  ipcMain.handle(
    "screencap",
    async (_, connectKey: string, saveToLocal?: boolean) => {
      return await screencap(connectKey, saveToLocal);
    },
  );
  ipcMain.handle(
    "hdc-command",
    async (
      _,
      commandType: string,
      connectKey: string,
      saveToLocal?: boolean,
      packageName?: string,
    ) => {
      switch (commandType) {
        case "screencap":
          await screencap(connectKey, saveToLocal);
          break;
        case "start-screen-recording":
          await startScreenRecording(connectKey);
          break;
        case "stop-screen-recording":
          await stopScreenRecording(connectKey);
          break;
        case "clear-app":
          await clearApp(connectKey, packageName!);
          break;
        case "go-back":
          await goBack(connectKey);
          break;
        case "go-home":
          await goHome(connectKey);
          break;
        case "install-app":
          await installApp(connectKey, packageName!);
          break;
        default:
          throw new Error(`未支持的方法: ${commandType}`);
      }
    },
  );

  // ==================== API 相关 IPC 处理程序 ====================
  ipcMain.handle("call-api", async (_, payload: ApiCallPayload) => {
    console.info("[IPC call-api]：", payload);
    const { method, endpoint, data, contentType } = payload;
    console.info("[IPC call-api endpoint]：", endpoint);
    console.info("[IPC call-api data]：", data);
    const url = new URL(
      endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
      `http://${BACKEND_HOST}:${BACKEND_PORT}`,
    );

    try {
      const headers: Record<string, string> = {};

      let body;
      if (data) {
        console.log("[IPC call-api contentType]：", contentType);
        if (contentType === "form-data") {
          const formData = new FormData();
          // 通用遍历 data，支持路径字段与普通字段
          for (const [key, val] of Object.entries(
            data as Record<string, any>,
          )) {
            if (
              typeof val === "string" &&
              (key.toLowerCase().includes("file") ||
                key.toLowerCase().includes("path"))
            ) {
              try {
                const fileBuf = await fs.readFile(val);
                const filename = path.basename(val);
                const blob = new Blob([fileBuf as Buffer]);
                formData.append(
                  key === "videoPath" ? "file" : key,
                  blob,
                  filename,
                );
              } catch (e) {
                console.warn("读取文件失败，按字符串传递:", key, e);
                formData.append(key, String(val));
              }
            } else {
              formData.append(key, String(val));
            }
          }

          body = formData;
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(data);
        }
      }

      const res = await fetch(url.toString(), {
        method,
        headers,
        body,
      });
      return await res.json();
    } catch (err) {
      console.error("[IPC call-api Error]", err);
      return { success: false, error: "请求失败" };
    }
  });
  ipcMain.handle("call-api-request", async (_, options: RequestOptions) => {
    try {
      console.info("[IPC call-api-request]", options);
      const {
        endpoint,
        method = "GET",
        headers = {},
        body,
        bodyType = "json",
        formData,
      } = options;

      // 构建请求配置
      const url = new URL(
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
        `http://${BACKEND_HOST}:${BACKEND_PORT}`,
      );
      console.log("[IPC call-api endpoint]", url);
      const fetchOptions: RequestInit = {
        method,
        headers: { ...headers },
      };

      // 处理请求体
      if (method !== "GET") {
        if (bodyType === "json") {
          fetchOptions.body = JSON.stringify(body);
          if (!fetchOptions.headers) fetchOptions.headers = {};
          if (
            !(fetchOptions.headers as Record<string, string>)["Content-Type"]
          ) {
            (fetchOptions.headers as Record<string, string>)["Content-Type"] =
              "application/json";
          }
        } else if (bodyType === "text") {
          fetchOptions.body = String(body);
          if (!fetchOptions.headers) fetchOptions.headers = {};
          if (
            !(fetchOptions.headers as Record<string, string>)["Content-Type"]
          ) {
            (fetchOptions.headers as Record<string, string>)["Content-Type"] =
              "text/plain";
          }
        } else if (bodyType === "formData") {
          const form = new FormData();
          // if (formData && Array.isArray(formData)) {
          //   for (const field of formData) {
          //     if (field.type === "file" && field.filePath) {
          //       // 文件字段
          //       const fileStream = fs.createReadStream(field.filePath);
          //       form.append(
          //         field.name,
          //         fileStream,
          //         path.basename(field.filePath),
          //       );
          //     } else if (field.type === "buffer" && field.buffer) {
          //       // Buffer 字段
          //       form.append(
          //         field.name,
          //         Buffer.from(field.buffer),
          //         field.filename,
          //       );
          //     } else if (field.value !== undefined) {
          //       // 普通字段
          //       form.append(field.name, String(field.value));
          //     }
          //   }
          // }

          console.log("[IPC call-api endpoint]", formData);
          if (formData) {
            // ← 接收
            for (const field of formData.fields) {
              if (field.type === "file") {
                // base64 → Buffer
                const buffer = Buffer.from(field.data, "base64");
                // 添加到 Node.js FormData
                form.append(field.name, buffer, field.filename);
              } else {
                form.append(field.name, String(field.value));
              }
            }
          }

          fetchOptions.body = formData;
          console.log("[IPC call-api endpoint]", fetchOptions);
          // FormData 会自动设置 Content-Type
          if (fetchOptions.headers) {
            delete (fetchOptions.headers as Record<string, string>)[
              "Content-Type"
            ];
          }
        } else if (bodyType === "blob") {
          fetchOptions.body = Buffer.from(body);
        } else {
          fetchOptions.body = body;
        }
      }

      // 发送请求
      const res: Response = await fetch(url, fetchOptions);

      // 返回响应
      return await res.json();
    } catch (error) {
      return {
        error: error,
      };
    }
  });

  ipcMain.handle("call-api-upload", async (_, options: UploadFileOptions) => {
    try {
      const {
        endpoint,
        filePath,
        additionalFields = {},
        headers = {},
      } = options;

      const url = new URL(
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
        `http://${BACKEND_HOST}:${BACKEND_PORT}`,
      );
      const form = new FormData();

      // 添加文件 - 使用 readFile 读取文件内容为 Buffer
      for (let index = 0; index < filePath.length; index++) {
        const file = filePath[index];
        console.log("[IPC FilePath:]", file);

        // 检查文件是否存在
        if (!(await fs.pathExists(file))) {
          console.error(`文件不存在: ${file}`);
          throw new Error(`文件不存在: ${file}`);
        }

        // 读取文件内容为 Buffer
        const fileBuffer = await fs.readFile(file);
        const filename = path.basename(file) || `file${index}`;

        // 使用 Buffer 创建 File 对象
        form.append("files", new File([fileBuffer], filename), filename);
      }

      // 添加其他字段
      for (const [key, value] of Object.entries(additionalFields)) {
        form.append(key, String(value));
      }

      // formdata-node 的 FormData 可以直接传递给 fetch，但需要类型断言
      // FormData 会自动设置正确的 Content-Type 和 boundary
      const response = await fetch(url, {
        method: "POST",
        body: form as any,
        headers, // 不设置 Content-Type，让 FormData 自动处理
      });

      return await response.json();
    } catch (error) {
      console.error("[IPC call-api-upload Error]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "上传失败",
      };
    }
  });
  // ==================== 存储相关 IPC 处理程序 ====================
  // 获取所有设置
  ipcMain.handle("get-settings", () => getSettingsStore().get());
  // 获取工具设置
  ipcMain.handle("get-tool-settings", () =>
    getSettingsStore().get("toolSettings"),
  );
  // 获取系统设置
  ipcMain.handle("get-system-settings", () =>
    getSettingsStore().get("systemSettings"),
  );

  // 更新工具设置
  ipcMain.handle("set-tool-settings", (_, settings) => {
    const store = getSettingsStore();
    const currentToolSettings = store.get("toolSettings") || {};
    const updatedToolSettings = { ...currentToolSettings, ...settings };
    store.set("toolSettings", updatedToolSettings);
    log.info("[IPC 工具设置]:", settings);
    return { success: true };
  });

  // 更新系统设置
  ipcMain.handle("set-system-settings", (_, settings) => {
    const store = getSettingsStore();
    const currentSystemSettings = store.get("systemSettings") || {};
    const updatedSystemSettings = { ...currentSystemSettings, ...settings };
    store.set("systemSettings", updatedSystemSettings);
    log.info("[IPC 系统设置]:", settings);
    return { success: true };
  });

  // 工作流执行相关 IPC 处理程序
  ipcMain.handle("execute-workflow", async (_, nodes, edges, connectKey) => {
    const workflowExecutor = getWorkflowExecutor();
    if (!workflowExecutor) {
      return { success: false, error: "工作流执行器未初始化" };
    }

    try {
      log.info("开始执行工作流", {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        connectKey,
      });
      await workflowExecutor.executeWorkflow(nodes, edges, connectKey);
      return { success: true };
    } catch (error) {
      log.error("工作流执行失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  });

  ipcMain.handle("stop-workflow", async () => {
    const workflowExecutor = getWorkflowExecutor();
    if (!workflowExecutor) {
      return { success: false, error: "工作流执行器未初始化" };
    }

    try {
      workflowExecutor.stopExecution();
      return { success: true };
    } catch (error) {
      log.error("停止工作流失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  });

  ipcMain.handle("get-workflow-context", async () => {
    const workflowExecutor = getWorkflowExecutor();
    if (!workflowExecutor) {
      return null;
    }
    return workflowExecutor.getContext();
  });

  // 单节点执行 IPC 处理程序
  ipcMain.handle("execute-single-node", async (_, node, connectKey) => {
    const workflowExecutor = getWorkflowExecutor();
    if (!workflowExecutor) {
      return { success: false, error: "工作流执行器未初始化" };
    }

    try {
      log.info("开始执行单节点", {
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data.label,
        connectKey,
      });
      await workflowExecutor.executeSingleNode(node, connectKey);
      return { success: true };
    } catch (error) {
      log.error("单节点执行失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  });

  // ==================== 目录文件操作相关 IPC 处理程序 ====================
  ipcMain.handle(
    "get-directory-files",
    async (_, directoryPath: string, extension?: string) => {
      try {
        const files = await fs.readdir(directoryPath);
        let filteredFiles = files;

        if (extension) {
          filteredFiles = files.filter((file) =>
            file.toLowerCase().endsWith(extension.toLowerCase()),
          );
        }

        // 返回完整路径
        return filteredFiles.map((file) => path.join(directoryPath, file));
      } catch (error) {
        log.error("读取目录文件失败:", error);
        return [];
      }
    },
  );

  // ==================== 文件对话框相关 IPC 处理程序 ====================
  ipcMain.handle("open-file-dialog", async (_, options) => {
    try {
      const mainWindow =
        BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        log.error("没有找到主窗口");
        return { canceled: true, filePaths: [] };
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: options.title || "选择文件",
        defaultPath: options.defaultPath,
        buttonLabel: options.buttonLabel,
        filters: options.filters || [{ name: "All Files", extensions: ["*"] }],
        properties: options.properties || ["openFile"],
      });

      log.info("[文件选择对话框结果]:", result);

      return result;
    } catch (error) {
      log.error("打开文件对话框失败:", error);
      return { canceled: true, filePaths: [] };
    }
  });

  ipcMain.handle("show-save-dialog", async (_, options) => {
    try {
      const mainWindow =
        BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        log.error("没有找到主窗口");
        return { canceled: true };
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: options.title || "保存文件",
        defaultPath: options.defaultPath,
        buttonLabel: options.buttonLabel,
        filters: options.filters || [{ name: "All Files", extensions: ["*"] }],
      });

      log.info("[保存文件对话框结果]:", result);
      return result;
    } catch (error) {
      log.error("打开保存对话框失败:", error);
      return { canceled: true };
    }
  });

  // ==================== 文件保存相关 IPC 处理程序 ====================
  ipcMain.handle("save-file", async (_, filePath: string, data: number[]) => {
    try {
      // 将数字数组转换为Buffer
      const buffer = Buffer.from(data);

      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);

      // 写入文件
      await fs.writeFile(filePath, buffer);

      log.info("[文件保存成功]:", filePath);
      return { success: true };
    } catch (error) {
      log.error("文件保存失败:", error);
      throw error;
    }
  });

  // ==================== 文件读取相关 IPC 处理程序 ====================
  ipcMain.handle("read-file", async (_, filePath: string) => {
    try {
      // 检查文件是否存在
      if (!(await fs.pathExists(filePath))) {
        throw new Error("文件不存在");
      }

      // 读取文件内容
      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      // 简单的MIME类型检测
      const ext = path.extname(fileName).toLowerCase();
      let mimeType = "application/octet-stream";
      switch (ext) {
        case ".png":
          mimeType = "image/png";
          break;
        case ".jpg":
        case ".jpeg":
          mimeType = "image/jpeg";
          break;
        case ".gif":
          mimeType = "image/gif";
          break;
        case ".bmp":
          mimeType = "image/bmp";
          break;
      }

      log.info("[文件读取成功]:", filePath);
      return {
        success: true,
        data: Array.from(buffer),
        fileName,
        mimeType,
      };
    } catch (error) {
      log.error("文件读取失败:", error);
      return { success: false };
    }
  });
}
