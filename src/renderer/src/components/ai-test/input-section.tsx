import React, { useRef } from "react";
import {
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Settings2,
  UploadCloud,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InputSectionProps {
  text: string;
  setText: (text: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  variant: "expanded" | "compact";
}

export function InputSection({
  text,
  setText,
  files,
  setFiles,
  selectedModel,
  setSelectedModel,
  onAnalyze,
  isAnalyzing,
}: InputSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="flex-1 flex gap-4 p-1.5 overflow-hidden">
      <div className="flex-1 flex flex-col relative border-r border-border">
        <Textarea
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          ref={textareaRef}
          className="w-full h-full border-none p-4 focus-visible:ring-0 leading-relaxed"
          placeholder="# 需求描述&#10;&#10;请在此处粘贴产品需求文档 (PRD)、用户故事或功能列表...&#10;&#10;例如：&#10;1. 用户可以通过手机号注册&#10;2. 密码必须包含字母和数字"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isAnalyzing}
        />
        <div className="h-8 bg-muted/30 flex items-center px-4 text-[10px] text-muted-foreground justify-between select-none">
          <span>Markdown Supported</span>
          <span>{text.length} 字符</span>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        {/* 模型配置 */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 font-semibold">
            <Settings2 className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wide">
              参数
            </span>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground px-1">
              AI 模型
            </label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={isAnalyzing}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glm-4-air">GLM-4-Air</SelectItem>
                <SelectItem value="glm-4-flash">GLM-4-Flash</SelectItem>
                <SelectItem value="glm-4">GLM-4</SelectItem>
                <SelectItem value="glm-4-long">GLM-4-Long</SelectItem>
                <SelectItem value="glm-4v-plus">GLM-4V-Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* 附件区域 */}
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="text-sm text-muted-foreground px-1">附件列表</div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg group"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.size.toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="relative">
              <input
                type="file"
                multiple
                accept=".txt,.md,.doc,.docx,.pdf,.png,.jpg,.jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              <Button
                variant="outline"
                className="w-full h-24 border-dashed flex flex-col gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent"
              >
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs">点击上传文档或图片</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8">
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || (!text && files.length === 0)}
            className="w-full"
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin"></div>
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                分析并提取测试点
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
