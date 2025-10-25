import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { ENV_CONFIG, updateEnvConfig, validateConfig } from "@/config/env";
import { testZhipuAIConnection, ZHIPUAI_MODELS } from "@/services/zhipuai";

interface AIChatSettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AIChatSettingsDialog({
  open,
  onOpenChange,
}: AIChatSettingsDialogProps) {
  const [apiKey, setApiKey] = useState(ENV_CONFIG.ZHIPUAI_API_KEY);
  const [model, setModel] = useState(ENV_CONFIG.AI_MODEL);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(open || false);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);

    if (!newOpen) {
      // 关闭时重置测试结果
      setTestResult(null);
    }
  };

  const handleSave = () => {
    updateEnvConfig("ZHIPUAI_API_KEY", apiKey);
    updateEnvConfig("AI_MODEL", model);
    handleOpenChange(false);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "请输入API密钥" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const success = await testZhipuAIConnection(apiKey);
      setTestResult({
        success,
        message: success ? "连接测试成功" : "连接测试失败",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `测试失败: ${error instanceof Error ? error.message : "未知错误"}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const validation = validateConfig();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            AI聊天设置
          </DialogTitle>
          <DialogDescription>
            配置智谱AI API参数以启用智能聊天功能
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* API密钥设置 */}
          <div className="space-y-2">
            <Label htmlFor="api-key">
              智谱AI API密钥
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="请输入您的智谱AI API密钥"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              请前往智谱AI开放平台获取API密钥
            </p>
          </div>

          {/* 模型选择 */}
          <div className="space-y-2">
            <Label htmlFor="ai-model">AI模型</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="选择AI模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ZHIPUAI_MODELS.GLM_4_FLASH}>
                  GLM-4-Flash (快速响应)
                </SelectItem>
                <SelectItem value={ZHIPUAI_MODELS.GLM_4}>
                  GLM-4 (标准版)
                </SelectItem>
                <SelectItem value={ZHIPUAI_MODELS.GLM_4_LONG}>
                  GLM-4-Long (长文本)
                </SelectItem>
                <SelectItem value={ZHIPUAI_MODELS.GLM_4_AIR}>
                  GLM-4-Air (轻量版)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 连接测试 */}
          <div className="space-y-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  测试中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  测试连接
                </>
              )}
            </Button>

            {testResult && (
              <div
                className={`flex items-center gap-2 text-sm p-2 rounded ${
                  testResult.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* 配置验证 */}
          {!validation.valid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">配置不完整</span>
              </div>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            保存设置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
