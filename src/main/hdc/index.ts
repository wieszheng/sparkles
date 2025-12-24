import { Hdc, Client } from "hdckit";
import { BrowserWindow } from "electron";
import * as os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { getSettingsStore } from "../store";
import { MainWorkflowExecutor } from "../workflow";
import { shell } from "./utils";
import log from "electron-log";

let client: Client;
let selectedDeviceKey: string | null = null;
let workflowExecutor: MainWorkflowExecutor | null = null;
let winDow: BrowserWindow;

const getTargets: GetTargets = async function () {
  const targets = await client.listTargets();

  return Promise.all(
    targets.map(async (connectKey: string) => {
      const parameters = await client.getTarget(connectKey).getParameters();
      let ohosVersion =
        parameters["const.product.software.version"].split(/\s/)[1];
      ohosVersion = ohosVersion.slice(0, ohosVersion.indexOf("("));

      const sdkVersion = parameters["const.ohos.apiversion"];

      return {
        name: parameters["const.product.name"],
        key: connectKey,
        ohosVersion,
        sdkVersion,
      };
    }),
  ).catch(() => []);
};

const screencap: Screencap = async function (
  connectKey: string,
  saveToLocal?: boolean,
): Promise<string> {
  const name = "sparkles_screen.jpeg";
  const p = `/data/local/tmp/${name}`;
  await shell(client, connectKey, [
    `rm -r ${p}`,
    `snapshot_display -i 0 -f ${p}`,
  ]);
  console.log("[Screencap]:", p);
  const target = client.getTarget(connectKey);
  const tempDest = path.resolve(os.tmpdir(), name);
  await target.recvFile(p, tempDest);

  if (saveToLocal) {
    const { saveLocation, screenshotFormat } =
      getSettingsStore().get("toolSettings");

    // 确保保存目录存在
    await fs.ensureDir(saveLocation);
    // 生成带时间戳的文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalName = `Sparkles_screen_${timestamp}.${screenshotFormat}`;
    const finalDest = path.join(saveLocation, finalName);

    // 将文件从临时目录移动到目标目录
    await fs.move(tempDest, finalDest);

    return finalDest;
  } else {
    // 默认行为：读取文件并返回 base64
    const buf = await fs.readFile(tempDest);
    // 清理临时文件
    await fs.remove(tempDest);
    return buf.toString("base64");
  }
};

const startScreenRecording: StartScreenRecording = async function (
  connectKey: string,
): Promise<string> {
  const fileName = "sparkles_screen.mp4";
  await shell(client, connectKey, [
    `aa start -b com.huawei.hmos.screenrecorder -a com.huawei.hmos.screenrecorder.ServiceExtAbility --ps "CustomizedFileName" ${fileName}`,
  ]);

  return fileName;
};

const stopScreenRecording: StopScreenRecording = async function (
  connectKey: string,
): Promise<string> {
  const fileName = "sparkles_screen.mp4";
  // 1. 停止录屏
  await shell(client, connectKey, [
    `aa start -b com.huawei.hmos.screenrecorder -a com.huawei.hmos.screenrecorder.ServiceExtAbility`,
  ]);

  // 2. 查询录屏文件
  const rawOutput = await shell(client, connectKey, [
    `mediatool query ${fileName} -u`,
  ]);
  const outputStr = Array.isArray(rawOutput) ? rawOutput.join("\n") : rawOutput;

  // 3. 提取文件 URI
  const lines = outputStr
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // 提取所有包含 file:// 的 URI
  const uriLines = lines.filter((line) => line.includes("file://"));

  const fileUri = uriLines[uriLines.length - 1]
    .replace(/[\r\n\t"]/g, "")
    .trim();

  if (!fileUri) {
    log.error("[Screencap]: 无法找到录屏文件 URI");
    return "";
  }
  log.info("[Screencap]: 找到录屏文件 URI:", fileUri);

  // 4. 移动文件到临时目录
  const output = await shell(client, connectKey, [
    `mediatool recv "${fileUri}" /data/local/tmp`,
  ]);
  const moveResult = Array.isArray(output) ? output.join("\n") : output;
  // 5. 提取移动后的文件路径
  const moveLines = moveResult
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  // 查找以 /data/local/tmp/ 开头的行作为文件路径
  const filePath = moveLines.find((line) =>
    line.startsWith("/data/local/tmp" + "/"),
  );

  const deviceFilePath = filePath
    ? filePath.replace(/[\r\n\t"]/g, "").trim()
    : null;
  if (!deviceFilePath) {
    log.error("[Screencap]: 无法获取设备上的文件路径");
    return "";
  }
  log.info("[Screencap]: 设备上的文件路径:", deviceFilePath);

  // 6. 下载到本地
  const { saveLocation } = getSettingsStore().get("toolSettings");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const finalName = `Sparkles_screen_recording_${timestamp}.mp4`;
  const finalDest = path.join(saveLocation, finalName);

  await fs.ensureDir(path.dirname(finalDest));
  await client.getTarget(connectKey).recvFile(deviceFilePath, finalDest);
  return finalDest;
};

const installApp = async function (connectKey: string, filePath: string) {
  const target = client.getTarget(connectKey);
  return await target.install(filePath);
};

import { app } from "electron";

// ... existing imports ...

export async function initHdcClient(win: BrowserWindow) {
  const store = getSettingsStore();
  const Settings = store.get("systemSettings");
  let { hdcPath } = Settings;

  // 尝试使用内置 HDC 的逻辑
  if (Settings.hdcAutoDetect) {
    const platform = process.platform;
    const isWin = platform === "win32";
    const executableName = isWin ? "hdc.exe" : "hdc";

    if (app.isPackaged) {
      // 生产环境: resources/bin/hdc
      const bundledPath = path.join(
        process.resourcesPath,
        "bin",
        executableName,
      );

      if (await fs.pathExists(bundledPath)) {
        hdcPath = bundledPath;
        // 确保非 Windows 平台有执行权限
        if (!isWin) {
          try {
            await fs.chmod(hdcPath, 0o755);
          } catch (err) {
            console.error("Failed to set chmod for bundled hdc:", err);
          }
        }
      }
    } else {
      // 开发环境: 项目根目录 resources/bin/hdc
      // 根据您的项目结构，resources 位于根目录
      // electron-vite build 输出在 out/main/，所以 root 在 ../../
      const bundledPath = path.resolve(
        __dirname,
        "../../resources/bin",
        executableName,
      );
      if (await fs.pathExists(bundledPath)) {
        hdcPath = bundledPath;
      }
    }
  } else {
    if (hdcPath && !(await fs.pathExists(hdcPath))) {
      log.error(`HDC path ${hdcPath} does not exist`);
    }
  }

  log.info(`Initializing HDC client with path: ${hdcPath || "system default"}`);

  client = Hdc.createClient({
    bin: hdcPath,
  });
  // 初始化工作流执行器
  workflowExecutor = new MainWorkflowExecutor(client, win);
  winDow = win;
  client.trackTargets().then((tracker) => {
    tracker.on("add", onTargetChange);
    tracker.on("remove", onTargetChange);
  });

  function onTargetChange() {
    if (win) {
      setTimeout(() => win.webContents.send("hdc", "changeTarget"), 2000);
    }
  }
}

// 导出工作流执行器实例
export function getWorkflowExecutor(): MainWorkflowExecutor | null {
  return workflowExecutor;
}

// 导出 client 实例
export function getClient(): Client {
  if (!client) {
    throw new Error(
      "HDC client not initialized. Please call initHdcClient first.",
    );
  }
  return client;
}

export function setSelectedDevice(deviceKey: string | null): void {
  selectedDeviceKey = deviceKey;
}

export function getDeviceKey() {
  return selectedDeviceKey;
}

export function getWindow(): BrowserWindow {
  return winDow;
}

export {
  getTargets,
  screencap,
  startScreenRecording,
  stopScreenRecording,
  installApp,
  selectedDeviceKey,
};

// 导出工作流操作类
export { WorkflowOperations } from "./workflow-operations";
