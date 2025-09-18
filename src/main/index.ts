import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { initializeAutoUpdater } from "./updater";
import { getTargets, initHdcClient, screencap } from "./hdc";
import { getSettingsStore } from "./store";
import log from "electron-log";

let loadingWindow: BrowserWindow | null = null;

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 480,
    height: 310,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    loadingWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#loading`);
  } else {
    loadingWindow.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "loading",
    });
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1270,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    center: true,
    titleBarStyle: "hidden",
    ...(process.platform === "linux" ? { icon } : {}),
    frame: process.platform === "darwin", // macos显示原生的titlebar
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  initializeAutoUpdater(mainWindow);
  initHdcClient(mainWindow);

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", () => {
    mainWindow.hide();
    mainWindow.close();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.once("did-finish-load", () => {
    // 直接显示主窗口，隐藏/关闭 loading（推荐）
    if (loadingWindow) {
      loadingWindow.hide();
      loadingWindow.close();
    }
    mainWindow.show();
  });

  let isMaximized = false;
  ipcMain.on("action", (_, payload) => {
    switch (payload) {
      case "CLOSE":
        mainWindow.close();
        break;
      case "MAXIMIZE":
        if (isMaximized) {
          mainWindow.unmaximize();
          isMaximized = false;
        } else {
          mainWindow.maximize();
          isMaximized = true;
        }
        break;
      case "MINIMIZE":
        mainWindow.minimize();
        break;
    }
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  createLoadingWindow();
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  setTimeout(() => {
    createWindow(); // 2. 再创建主窗口（可优化为同步但延迟显示）
  }, 3000); // 可选延迟，也可直接调用

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-targets", async () => {
  return await getTargets();
});

ipcMain.handle(
  "screencap",
  async (_, connectKey: string, saveToLocal?: boolean) => {
    return await screencap(connectKey, saveToLocal);
  },
);

const BACKEND_HOST = "82.157.176.120";
const BACKEND_PORT = 8000;

// 定义 IPC Payload 类型
type ApiCallPayload = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  data?: object;
};

// IPC 接口：转发渲染进程请求到 FastAPI
ipcMain.handle("call-api", async (_, payload: ApiCallPayload) => {
  const { method, endpoint, data } = payload;
  log.info("call-api----endpoint", endpoint);
  log.info("call-api----data", data);
  const url = new URL(
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
    `http://${BACKEND_HOST}:${BACKEND_PORT}`,
  );

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    return await res.json();
  } catch (err) {
    console.error("[IPC call-api Error]", err);
    return { success: false, error: "请求失败" };
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
  log.info("工具设置已更新:", settings);
  return { success: true };
});

// 更新系统设置
ipcMain.handle("set-system-settings", (_, settings) => {
  const store = getSettingsStore();
  const currentSystemSettings = store.get("systemSettings") || {};
  const updatedSystemSettings = { ...currentSystemSettings, ...settings };
  store.set("systemSettings", updatedSystemSettings);
  log.info("系统设置已更新:", settings);
  return { success: true };
});
