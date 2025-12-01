// 智谱AI API服务
import { ENV_CONFIG } from "@/config/env";

// 智谱AI模型配置
export const ZHIPUAI_MODELS = {
  GLM_4: "glm-4",
  GLM_4_AIR: "glm-4-air",
  GLM_4_AIRX: "glm-4-airx",
  GLM_4_FLASH: "glm-4-flash",
  GLM_4_LONG: "glm-4-long",
} as const;

// AI测试助手的系统提示词
export const AI_TEST_ASSISTANT_SYSTEM_PROMPT = `你是一个专业的AI测试助手，专门帮助用户进行软件测试相关的工作。你的主要职责包括：

## 核心能力
1. **测试用例设计与分析**
   - 帮助设计功能测试、性能测试、安全测试等各类测试用例
   - 分析测试覆盖率和测试策略
   - 提供测试用例优化建议

2. **自动化测试支持**
   - 协助编写自动化测试脚本（Selenium、Cypress、Jest、Playwright等）
   - 提供测试框架选择建议
   - 帮助解决自动化测试中的技术问题

3. **UI/UX测试指导**
   - 界面功能测试指导
   - 用户体验测试建议
   - 跨浏览器兼容性测试
   - 响应式设计测试

4. **测试工具与技术**
   - 推荐合适的测试工具
   - 解释测试技术和最佳实践
   - 帮助搭建测试环境

5. **缺陷分析与调试**
   - 协助分析和定位bug
   - 提供调试思路和方法
   - 帮助编写缺陷报告

## 回答风格
- 专业且易懂，适合不同技术水平的用户
- 提供具体可操作的建议和代码示例
- 结构化回答，使用清晰的标题和列表
- 必要时提供相关的最佳实践和注意事项

## 特殊说明
- 当用户询问非测试相关问题时，礼貌地引导回测试主题
- 优先提供实用的解决方案，而不是纯理论知识
- 支持中文交流，使用简洁明了的语言
- 可以提供代码示例，并确保代码的正确性和可读性

请始终保持专业、友好和乐于助人的态度。`;

// 智谱AI聊天服务
export class ZhipuAIChatService {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || ENV_CONFIG.ZHIPUAI_API_KEY;
    this.model = model || ENV_CONFIG.AI_MODEL;
  }

  // 更新API密钥
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 更新模型
  setModel(model: string) {
    this.model = model;
  }

  // 发送消息到智谱AI
  async sendMessage(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    model?: string,
    includeSystemPrompt: boolean = true,
  ) {
    const useModel = model || this.model;

    if (!this.apiKey) {
      throw new Error("智谱AI API密钥未配置，请在设置中配置API密钥");
    }

    // 准备消息数组，如果需要则添加系统提示词
    const finalMessages = includeSystemPrompt
      ? [
          { role: "system" as const, content: AI_TEST_ASSISTANT_SYSTEM_PROMPT },
          ...messages,
        ]
      : messages;

    try {
      const response = await fetch(
        `${ENV_CONFIG.API_BASE_URL}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: useModel,
            messages: finalMessages,
            stream: false,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `智谱AI API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || "未知错误"}`,
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("智谱AI API调用失败:", error);
      throw error;
    }
  }

  // 流式聊天（如果需要）
  async *streamChat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    model?: string,
    includeSystemPrompt: boolean = true,
  ) {
    const useModel = model || this.model;

    if (!this.apiKey) {
      throw new Error("智谱AI API密钥未配置");
    }

    // 准备消息数组，如果需要则添加系统提示词
    const finalMessages = includeSystemPrompt
      ? [
          { role: "system" as const, content: AI_TEST_ASSISTANT_SYSTEM_PROMPT },
          ...messages,
        ]
      : messages;

    const response = await fetch(
      `${ENV_CONFIG.API_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: useModel,
          messages: finalMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `智谱AI API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || "未知错误"}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// 创建默认实例
export const zhipuaiChatService = new ZhipuAIChatService();

// 测试连接
export async function testZhipuAIConnection(apiKey: string): Promise<boolean> {
  try {
    const service = new ZhipuAIChatService(apiKey);
    await service.sendMessage([{ role: "user", content: "你好" }]);
    return true;
  } catch (error) {
    console.error("智谱AI连接测试失败:", error);
    return false;
  }
}
