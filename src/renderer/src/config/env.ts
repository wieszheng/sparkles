// 环境配置
export const ENV_CONFIG = {
  // 智谱AI API配置
  ZHIPUAI_API_KEY: localStorage.getItem("zhipuai_api_key") || "",

  // AI模型配置
  AI_MODEL: localStorage.getItem("ai_model") || "glm-4-flash",

  // API端点配置
  API_BASE_URL: "https://open.bigmodel.cn/api/paas/v4",
};

// 更新环境配置
export function updateEnvConfig(key: keyof typeof ENV_CONFIG, value: string) {
  ENV_CONFIG[key] = value;

  // 保存到localStorage
  if (key === "ZHIPUAI_API_KEY") {
    localStorage.setItem("zhipuai_api_key", value);
  } else if (key === "AI_MODEL") {
    localStorage.setItem("ai_model", value);
  }
}

// 验证配置
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 从localStorage获取最新值进行验证
  const apiKey =
    localStorage.getItem("zhipuai_api_key") || ENV_CONFIG.ZHIPUAI_API_KEY;
  const model = localStorage.getItem("ai_model") || ENV_CONFIG.AI_MODEL;

  if (!apiKey) {
    errors.push("智谱AI API密钥未配置");
  }

  if (!model) {
    errors.push("AI模型未配置");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
