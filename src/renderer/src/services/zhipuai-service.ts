// 智谱AI服务
import { zhipuaiChatService, ZHIPUAI_MODELS } from "./zhipuai";

const ANALYSIS_MODEL = ZHIPUAI_MODELS.GLM_4_AIR; // 适合文本推理
const VISION_MODEL = ZHIPUAI_MODELS.GLM_4_AIR; // GLM-4 支持视觉能力

/**
 * 将 File 对象转换为 Base64 字符串
 */
export const fileToGenerativePart = async (
  file: File,
): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 步骤1：分析需求并提取测试点
 */
export const analyzeRequirements = async (
  textInput: string,
  files: File[],
): Promise<AnalysisResult> => {
  const prompt = `
    你是一位资深QA工程师。请分析提供的需求（文本或图片）。
    
    1. 用中文总结功能点（2-3句话）。
    2. 提取清晰的测试点（Test Points）。
    
    请按照逻辑类别分组（例如：功能、边界、安全、性能、兼容性、异常、UI）。
    返回的 JSON 数据中，summary 和 description 必须使用中文。
    
    ${textInput ? `需求描述: ${textInput}` : ""}
    ${files.length > 0 ? "\n图片文件已提供，请分析图片中的需求信息。" : ""}
  `;

  const messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [
    {
      role: "system",
      content: `你是一位专家级软件测试工程师。请用中文回答。你需要严格按照指定的JSON格式返回结果。

请返回以下JSON格式的数据：
{
  "summary": "功能的中文总结",
  "testPoints": [
    {
      "id": "唯一标识符",
      "category": "分类，例如：功能、边界、安全、性能、兼容性、异常、UI",
      "description": "测试点的中文描述"
    }
  ]
}`,
    },
    { role: "user", content: prompt },
  ];

  // 如果有图片文件，添加图片信息到消息中
  if (files.length > 0) {
    for (const file of files) {
      const part = await fileToGenerativePart(file);
      messages.push({
        role: "user",
        content: `[图片文件：${file.name}，类型：${file.type}，大小：${file.size}字节]`,
      });
    }
  }

  try {
    const response = await zhipuaiChatService.sendMessage(
      messages,
      files.length > 0 ? VISION_MODEL : ANALYSIS_MODEL,
      false, // 不包含默认的系统提示词，使用我们自定义的
    );

    if (!response) throw new Error("No response from AI");

    // 尝试解析JSON响应
    let parsedResponse: AnalysisResult;
    try {
      parsedResponse = JSON.parse(response);
    } catch {
      console.error("JSON解析失败，原始响应:", response);

      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI响应为JSON格式");
      }
    }

    // 验证响应格式
    if (!parsedResponse.summary || !parsedResponse.testPoints) {
      throw new Error("AI响应格式不正确");
    }

    return parsedResponse;
  } catch (error) {
    console.error("智谱AI分析需求失败:", error);
    throw error;
  }
};

/**
 * 步骤2：基于确认的测试点生成详细的测试用例
 */
export const generateTestCases = async (
  summary: string,
  testPoints: TestPoint[],
): Promise<GenerationResult> => {
  const prompt = `
    基于以下项目总结和确认的测试点，生成详细的测试用例。
    
    项目总结: ${summary}
    
    测试点列表:
    ${JSON.stringify(testPoints, null, 2)}
    
    输出详细的测试用例列表。确保覆盖正向流程、异常流程和边界条件。
    所有内容（标题、前置条件、步骤、预期结果）必须使用中文。
    
    字段说明:
    - priority: 使用 P0, P1, P2
    - type: 使用 功能, 边界, 安全, 性能, 兼容性, 异常, UI
    
    请严格按照以下JSON格式返回：
{
  "testCases": [
    {
      "id": "唯一标识符",
      "title": "测试用例标题",
      "precondition": "前置条件",
      "steps": ["步骤1", "步骤2", "步骤3"],
      "expectedResult": "预期结果",
      "priority": "P0|P1|P2",
      "type": "功能|边界|安全|性能|兼容性|异常|UI"
    }
  ]
}
  `;

  const messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [
    {
      role: "system",
      content:
        "你是一位专家级软件测试工程师。请用中文回答。你必须严格按照指定的JSON格式返回结果。",
    },
    { role: "user", content: prompt },
  ];

  try {
    const response = await zhipuaiChatService.sendMessage(
      messages,
      ANALYSIS_MODEL,
      false, // 不包含默认的系统提示词
    );

    if (!response) throw new Error("No response from AI");

    // 尝试解析JSON响应
    let parsedResponse: GenerationResult;
    try {
      parsedResponse = JSON.parse(response);
    } catch {
      console.error("JSON解析失败，原始响应:", response);

      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI响应为JSON格式");
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error("智谱AI生成测试用例失败:", error);
    throw error;
  }
};
