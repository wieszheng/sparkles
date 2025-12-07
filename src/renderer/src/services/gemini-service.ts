import { GoogleGenAI, Type, type Schema } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "",
});

const ANALYSIS_MODEL = "gemini-2.5-flash"; // Good for text/reasoning
const VISION_MODEL = "gemini-2.5-flash";

/**
 * Converts a File object to a Base64 string.
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
 * Step 1: Analyze requirements and extract test points.
 */
export const analyzeRequirements = async (
  textInput: string,
  files: File[],
): Promise<AnalysisResult> => {
  const prompt = `
    你是一位资深QA工程师。请分析提供的需求（文本或图片）。
    
    1. 用中文总结功能点（2-3句话）。
    2. 提取清晰的测试点（Test Points）。
    
    请按照逻辑类别分组（例如：功能测试、UI测试、异常测试、安全测试）。
    返回的 JSON 数据中，summary 和 description 必须使用中文。
  `;

  const inputParts: any[] = [{ text: prompt }];

  if (textInput) {
    inputParts.push({ text: `需求描述: ${textInput}` });
  }

  for (const file of files) {
    const part = await fileToGenerativePart(file);
    inputParts.push(part);
  }

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "功能的中文总结" },
      testPoints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: {
              type: Type.STRING,
              description: "例如：功能、UI、性能",
            },
            description: { type: Type.STRING, description: "测试点的中文描述" },
          },
          required: ["id", "category", "description"],
        },
      },
    },
    required: ["summary", "testPoints"],
  };

  const response = await ai.models.generateContent({
    model: files.length > 0 ? VISION_MODEL : ANALYSIS_MODEL,
    contents: { parts: inputParts },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      systemInstruction: "你是一位专家级软件测试工程师。请用中文回答。",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  return JSON.parse(text) as AnalysisResult;
};

/**
 * Step 2: Generate detailed test cases from confirmed points.
 */
export const generateTestCases = async (
  summary: string,
  testPoints: TestPoint[],
): Promise<GenerationResult> => {
  const prompt = `
    基于以下项目总结和确认的测试点，生成详细的测试用例。
    
    项目总结: ${summary}
    
    测试点列表:
    ${JSON.stringify(testPoints)}
    
    输出详细的测试用例列表。确保覆盖正向流程、异常流程和边界条件。
    所有内容（标题、前置条件、步骤、预期结果）必须使用中文。
    
    字段说明:
    - priority: 使用 P0, P1, P2
    - type: 使用 功能测试, UI测试, 性能测试, 安全测试
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      testCases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            precondition: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            expectedResult: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["P0", "P1", "P2"] },
            type: {
              type: Type.STRING,
              enum: ["功能测试", "UI测试", "性能测试", "安全测试"],
            },
          },
          required: [
            "id",
            "title",
            "steps",
            "expectedResult",
            "priority",
            "type",
          ],
        },
      },
    },
    required: ["testCases"],
  };

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  return JSON.parse(text) as GenerationResult;
};
