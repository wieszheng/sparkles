/**
 * 节点执行器基类
 * 提供通用的节点执行逻辑和错误处理
 */

import type { WorkflowNode, NodeConfig } from "../types/workflow";

export abstract class BaseNodeExecutor {
  protected node: WorkflowNode;
  protected config: NodeConfig;

  constructor(node: WorkflowNode) {
    this.node = node;
    this.config = node.data.config || {};
  }

  /**
   * 执行节点逻辑
   */
  abstract execute(): Promise<any>;

  /**
   * 验证节点配置
   */
  abstract validateConfig(): void;

  /**
   * 获取节点类型
   */
  getNodeType(): string {
    return this.node.type;
  }

  /**
   * 获取节点标签
   */
  getNodeLabel(): string {
    return this.node.data.label;
  }

  /**
   * 获取节点ID
   */
  getNodeId(): string {
    return this.node.id;
  }

  /**
   * 获取配置值，带默认值
   */
  protected getConfigValue<T>(key: string, defaultValue: T): T {
    return (this.config[key] as T) ?? defaultValue;
  }

  /**
   * 验证必需的配置项
   */
  protected validateRequiredConfig(requiredKeys: string[]): void {
    const missingKeys = requiredKeys.filter((key) => !this.config[key]);
    if (missingKeys.length > 0) {
      throw new Error(
        `节点 ${this.node.id} 缺少必需配置: ${missingKeys.join(", ")}`,
      );
    }
  }

  /**
   * 验证配置项类型
   */
  protected validateConfigType(key: string, expectedType: string): void {
    const value = this.config[key];
    if (value !== undefined && typeof value !== expectedType) {
      throw new Error(
        `节点 ${this.node.id} 配置项 ${key} 类型错误，期望 ${expectedType}，实际 ${typeof value}`,
      );
    }
  }
}

/**
 * 点击节点执行器
 */
export class ClickNodeExecutor extends BaseNodeExecutor {
  validateConfig(): void {
    const hasSelector = !!this.config.selector;
    const hasCoordinates = !!(this.config.x && this.config.y);

    if (!hasSelector && !hasCoordinates) {
      throw new Error(`点击节点 ${this.node.id} 缺少选择器或坐标配置`);
    }
  }

  async execute(): Promise<void> {
    this.validateConfig();

    // 这里应该包含实际的点击逻辑
    // 由于我们已经在 workflow.ts 中实现了具体的执行逻辑
    // 这里只是提供一个结构化的接口
    throw new Error("点击节点执行逻辑需要在 workflow.ts 中实现");
  }
}

/**
 * 输入节点执行器
 */
export class InputNodeExecutor extends BaseNodeExecutor {
  validateConfig(): void {
    this.validateRequiredConfig(["selector"]);
  }

  async execute(): Promise<void> {
    this.validateConfig();
    throw new Error("输入节点执行逻辑需要在 workflow.ts 中实现");
  }
}

/**
 * 条件节点执行器
 */
export class ConditionNodeExecutor extends BaseNodeExecutor {
  validateConfig(): void {
    this.validateRequiredConfig(["selector", "operator"]);
  }

  async execute(): Promise<boolean> {
    this.validateConfig();
    throw new Error("条件节点执行逻辑需要在 workflow.ts 中实现");
  }
}

/**
 * 节点执行器工厂
 */
export class NodeExecutorFactory {
  static createExecutor(node: WorkflowNode): BaseNodeExecutor {
    switch (node.type) {
      case "click":
        return new ClickNodeExecutor(node);
      case "print":
        return new InputNodeExecutor(node);
      case "condition":
        return new ConditionNodeExecutor(node);
      default:
        throw new Error(`不支持的节点类型: ${node.type}`);
    }
  }
}
