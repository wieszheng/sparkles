import { Client } from "hdckit";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "node:os";
import { shell } from "./utils";
import { startApp, stopApp, sleep } from "./action";
import { click, longClick, doubleClick, swipe } from "./uitest";
import type { NodeConfig } from "../../types/workflow";

/**
 * 工作流操作类 - 封装所有节点操作的具体实现
 */
export class WorkflowOperations {
  private client: Client;
  private connectKey: string;

  constructor(client: Client, connectKey: string) {
    this.client = client;
    this.connectKey = connectKey;
  }

  /**
   * 启动应用操作
   */
  async startApplication(config: NodeConfig): Promise<void> {
    if (!config.appName) {
      throw new Error("App name is required for start operation");
    }

    if (config.startingMode === "coldBoot") {
      // 冷启动：先停止应用再启动
      await stopApp(this.connectKey, config.appName);
      await sleep(1000);
    }

    await startApp(this.connectKey, config.appName);

    // 等待应用完全启动
    await sleep(config.waitTime || 2000);
  }

  /**
   * 点击操作
   */
  async performClick(config: NodeConfig): Promise<void> {
    console.log("Performing click operation");
    if (!config.x || !config.y) {
      throw new Error(
        "Click operation requires either selector or coordinates",
      );
    }

    const clickType = config.clickType || "click";
    await this.clickByCoordinates(config.x!, config.y!, clickType);

    // 点击后等待
    if (config.waitTime && config.waitTime > 0) {
      await sleep(config.waitTime);
    }
  }

  /**
   * 通过坐标点击
   */
  private async clickByCoordinates(
    x: number,
    y: number,
    clickType: string,
  ): Promise<void> {
    console.log("Clicking at coordinates:", x, y);
    switch (clickType) {
      case "long":
        await longClick(this.connectKey, { x, y });
        break;
      case "double":
        await doubleClick(this.connectKey, { x, y });
        break;
      case "click":
      default:
        await click(this.connectKey, { x, y });
        break;
    }
  }

  /**
   * 输入操作
   */
  async performInput(config: NodeConfig): Promise<void> {
    if (!config.selector) {
      throw new Error("Input operation requires selector");
    }

    const inputText = config.text || "";
    const shouldClear = config.clearFirst === "true";

    // 清空输入框（如果需要）
    if (shouldClear) {
      await this.clearInputField(config.selector);
    }

    // 输入文本（如果有）
    if (inputText) {
      await this.inputText(config.selector, inputText);
    }

    // 输入后等待
    if (config.waitTime && config.waitTime > 0) {
      await sleep(config.waitTime);
    }
  }

  /**
   * 清空输入框
   */
  private async clearInputField(selector: string): Promise<void> {
    const command = `uitest uiInput clearText "${selector}"`;
    const result = await shell(this.client, this.connectKey, command);

    if (!this.isOperationSuccess(result)) {
      throw new Error("Failed to clear input field");
    }
  }

  /**
   * 输入文本
   */
  private async inputText(selector: string, text: string): Promise<void> {
    const command = `uitest uiInput inputText "${selector}" "${text}"`;
    const result = await shell(this.client, this.connectKey, command);

    if (!this.isOperationSuccess(result)) {
      throw new Error("Failed to input text");
    }
  }

  /**
   * 截图操作
   */
  async takeScreenshot(config: NodeConfig): Promise<string> {
    const filename = config.filename || `screenshot_${Date.now()}`;
    const remotePath = `/data/local/tmp/${filename}.jpeg`;

    // 执行截图命令
    const screenshotResult = await shell(
      this.client,
      this.connectKey,
      `snapshot_display -i 0 -f ${remotePath}`,
    );

    if (!this.isOperationSuccess(screenshotResult)) {
      throw new Error("Screenshot command execution failed");
    }

    // 下载截图文件
    const target = this.client.getTarget(this.connectKey);
    const localPath = path.resolve(os.tmpdir(), `${filename}.jpeg`);
    await target.recvFile(remotePath, localPath);

    // 验证文件下载
    if (!(await fs.pathExists(localPath))) {
      throw new Error("Screenshot file download failed");
    }

    let finalPath = localPath;

    // 如果需要保存到指定位置
    if (config.saveToLocal) {
      finalPath = path.join(
        config.savePath || os.homedir(),
        `${filename}.jpeg`,
      );
      await fs.ensureDir(path.dirname(finalPath));
      await fs.move(localPath, finalPath);
    }

    // 清理远程文件
    await this.cleanupRemoteFile(remotePath);

    return finalPath;
  }

  /**
   * 滚动操作
   */
  async performScroll(config: NodeConfig): Promise<void> {
    const direction = config.direction || "down";
    const distance = config.distance || 300;

    const command = this.buildScrollCommand(direction, distance);
    const result = await shell(this.client, this.connectKey, command);

    if (!this.isOperationSuccess(result)) {
      throw new Error("Scroll operation failed");
    }

    // 滚动后等待
    if (config.waitTime && config.waitTime > 0) {
      await sleep(config.waitTime);
    } else {
      await sleep(1000); // 默认等待1秒
    }
  }

  /**
   * 构建滚动命令
   */
  private buildScrollCommand(direction: string, distance: number): string {
    switch (direction) {
      case "down":
        return `uitest uiInput scroll 0 -${distance}`;
      case "up":
        return `uitest uiInput scroll 0 ${distance}`;
      case "left":
        return `uitest uiInput scroll ${distance} 0`;
      case "right":
        return `uitest uiInput scroll -${distance} 0`;
      default:
        throw new Error(`Unknown scroll direction: ${direction}`);
    }
  }

  /**
   * 滑动操作
   */
  async performSwipe(config: NodeConfig): Promise<void> {
    const startX = config.startX || 500;
    const startY = config.startY || 1000;
    const endX = config.endX || 500;
    const endY = config.endY || 500;

    await swipe(
      this.connectKey,
      { x: startX, y: startY },
      { x: endX, y: endY },
    );

    // 滑动后等待
    if (config.waitTime && config.waitTime > 0) {
      await sleep(config.waitTime);
    } else {
      await sleep(1000); // 默认等待1秒
    }
  }

  /**
   * 条件检查操作
   */
  async checkCondition(config: NodeConfig): Promise<boolean> {
    if (!config.selector) {
      throw new Error("Condition check requires selector");
    }

    const operator = config.operator || "exists";
    let result: string | string[];

    // 根据操作符类型执行不同的命令
    switch (operator) {
      case "exists":
        result = await shell(
          this.client,
          this.connectKey,
          `uitest uiInput elementExists "${config.selector}"`,
        );
        break;
      case "contains":
      case "equals":
        result = await shell(
          this.client,
          this.connectKey,
          `uitest uiInput getElementText "${config.selector}"`,
        );
        break;
      default:
        result = await shell(
          this.client,
          this.connectKey,
          `uitest uiInput elementExists "${config.selector}"`,
        );
        break;
    }

    // 解析结果以确定条件是否满足
    return this.parseConditionResult(result, config);

    // 条件检查后等待
    if (config.waitTime && config.waitTime > 0) {
      await sleep(config.waitTime);
    }
  }

  /**
   * 等待操作
   */
  async performWait(duration: number): Promise<void> {
    await sleep(duration);
  }

  /**
   * 关闭应用操作
   */
  async closeApplication(config: NodeConfig): Promise<void> {
    const target = config.target || "com.example.app";

    await stopApp(this.connectKey, target);

    // 关闭后等待
    if (config.waitTime && config.waitTime > 0) {
      await sleep(config.waitTime);
    }
  }

  /**
   * 获取文件大小
   */
  async getFileSize(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath);
      const sizeInKB = Math.round(stats.size / 1024);
      return `${sizeInKB}KB`;
    } catch {
      return "Unknown";
    }
  }

  /**
   * 清理远程文件
   */
  private async cleanupRemoteFile(remotePath: string): Promise<void> {
    try {
      await shell(this.client, this.connectKey, `rm ${remotePath}`);
    } catch (cleanupError) {
      console.warn(`Failed to clean up remote file: ${cleanupError}`);
    }
  }

  /**
   * 判断操作是否成功
   */
  private isOperationSuccess(result: string | string[]): boolean {
    const output = Array.isArray(result) ? result.join(" ") : result;
    const lowerOutput = output.toLowerCase();
    const errorIndicators = ["failed", "not found", "timeout", "error"];

    for (const indicator of errorIndicators) {
      if (lowerOutput.includes(indicator)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 解析条件检查结果
   */
  private parseConditionResult(
    result: string | string[],
    config: NodeConfig,
  ): boolean {
    const output = Array.isArray(result) ? result.join(" ") : result;
    const lowerOutput = output.toLowerCase();

    switch (config.operator) {
      case "exists":
        return (
          !lowerOutput.includes("not found") && !lowerOutput.includes("error")
        );
      case "contains":
        return lowerOutput.includes(config.value?.toLowerCase() || "");
      case "equals":
        return output.trim() === config.value;
      default:
        return false;
    }
  }
}
