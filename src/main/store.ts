import fs from "fs-extra";
import memoize from "licia/memoize";
import FileStore from "licia/FileStore";
import { app } from "electron";
import path from "path";

const getUserDataPath = app.getPath("userData");
const dataDir = path.join(getUserDataPath, "data");

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.ensureDirSync(dataDir);
}

export const getSettingsStore = memoize(function () {
  return new FileStore(path.join(dataDir, "settings.json"), {
    language: "system",
    theme: "system",
    hdcPath: "",
    // 工具设置
    toolSettings: {
      screenshotFormat: "jpeg",
      saveLocation: "/screenshots/ss",
    },
    // 系统设置
    systemSettings: {
      notifications: true,
      autoRun: false,
      reportEmail: "admin@example.com",
      maxConcurrent: 5,
      timeout: 30,
      retryCount: 3,
      hdcPath: "/usr/local/bin/hdc",
      hdcAutoDetect: true,
    },
  });
});
