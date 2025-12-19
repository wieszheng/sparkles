import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { initializeAutoUpdater } from "./updater";
import { initHdcClient } from "./hdc";
import { initIpcHandlers } from "./handlers";
import { setupMenu } from "./menu";
import { destroyTray, setUpTray } from "./tray";

import "./hdc/templates";
import { setMainWindow } from "./hdc/monitor.ts";

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
  initIpcHandlers();
  setMainWindow(mainWindow);

  mainWindow.on("ready-to-show", () => {
    setupMenu();
    setUpTray(mainWindow);
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
  }, 2000); // 可选延迟，也可直接调用

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    destroyTray();
    app.quit();
  }
});
