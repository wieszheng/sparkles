import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import { getSettingsStore } from "../store";

let logProcess: ChildProcess | null = null;
let fileStream: fs.WriteStream | null = null;

const startCapture = (connectKey: string, savePath: string) => {
  if (logProcess) return false;
  const store = getSettingsStore();
  const Settings = store.get("systemSettings");
  const { hdcPath } = Settings;

  const args = ["-t", connectKey, "hilog"];

  logProcess = spawn(hdcPath, args);
  fileStream = fs.createWriteStream(savePath);

  logProcess.stdout?.pipe(fileStream);

  logProcess.on("error", (err) => {
    stopCapture();
    console.error("Error starting log capture:", err);
    // 发送错误事件到渲染进程
  });

  return true;
};

const stopCapture = () => {
  if (logProcess) {
    logProcess.kill();
    logProcess = null;
  }
  if (fileStream) {
    fileStream.end();
    fileStream = null;
  }
};

const getStatus = () => {
  return {
    isRunning: logProcess !== null,
    pid: logProcess?.pid,
  };
};

export { startCapture, stopCapture, getStatus };
