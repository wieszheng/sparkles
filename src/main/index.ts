import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { initializeAutoUpdater } from "./updater";
import { getTargets, initHdcClient, screencap } from "./hdc";

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
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1270,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    center: true,
    titleBarStyle: "hidden",
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      // nodeIntegration: true,
      // contextIsolation: true,
      // nodeIntegrationInSubFrames: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  initializeAutoUpdater(mainWindow);
  initHdcClient(mainWindow);
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");
  createLoadingWindow();
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  setTimeout(() => {
    createWindow(); // 2. 再创建主窗口（可优化为同步但延迟显示）
  }, 3000); // 可选延迟，也可直接调用

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle("get-targets", async () => {
  return await getTargets();
});

ipcMain.handle("screencap", async (_, connectKey: string) => {
  return await screencap(connectKey);
});
