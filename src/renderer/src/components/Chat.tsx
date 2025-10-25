import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  Loader2,
  Plus,
  Sparkles,
  AlertCircle,
  BrainCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { QuickActions } from "@/components/ai-chat/quick-actions";
import { ZHIPUAI_MODELS, zhipuaiChatService } from "@/services/zhipuai";
import { AIChatSettingsDialog } from "@/components/ai-chat/settings-dialog";
import { ENV_CONFIG, updateEnvConfig, validateConfig } from "@/config/env";
import { MarkdownRenderer } from "@/components/ai-chat/markdown-renderer";
import { MessageActions } from "@/components/ai-chat/message-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AiChat() {
  const [model, setModel] = useState(ENV_CONFIG.AI_MODEL);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant" | "system";
      content: string;
      id: string;
    }>
  >([]);
  const [status, setStatus] = useState<"idle" | "in_progress" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configValid, setConfigValid] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 检查配置有效性
  useEffect(() => {
    const validation = validateConfig();
    setConfigValid(validation.valid);
  }, [settingsOpen]); // 当设置对话框关闭时重新验证配置

  const handleSendMessage = async () => {
    if (!inputValue.trim() || status === "in_progress") return;

    // 检查配置
    if (!configValid) {
      setError("请先配置智谱AI API密钥");
      setSettingsOpen(true);
      return;
    }

    const messageText = inputValue.trim();
    setInputValue("");

    // 添加用户消息
    const userMessage = {
      role: "user" as const,
      content: messageText,
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("in_progress");
    setError(null);

    try {
      // 使用流式响应，只传递用户和助手的消息，系统提示词由服务层自动添加
      const userMessages = messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({ role: msg.role, content: msg.content }));

      const stream = zhipuaiChatService.streamChat([
        ...userMessages,
        { role: "user", content: messageText },
      ]);

      let fullResponse = "";
      let aiMessageId: string | null = null;
      let hasCreatedMessage = false;

      for await (const chunk of stream) {
        fullResponse += chunk;

        // 检查是否收到实际内容（非空白字符）
        const hasContent = fullResponse.trim().length > 0;

        if (!hasCreatedMessage && hasContent) {
          // 收到第一个实际内容后，创建AI消息并移除思考状态
          hasCreatedMessage = true;

          aiMessageId = (Date.now() + 1).toString();
          const aiMessage = {
            role: "assistant" as const,
            content: fullResponse,
            id: aiMessageId,
          };
          setMessages((prev) => [...prev, aiMessage]);
          // 立即设置状态为idle，隐藏思考状态
          setStatus("idle");
        } else if (hasCreatedMessage && aiMessageId) {
          // 更新AI消息内容
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, content: fullResponse } : msg,
            ),
          );
        }
        // 滚动到底部
        scrollToBottom();
      }

      setStatus("idle");
      inputRef.current?.focus();
    } catch (error) {
      console.error("发送消息失败:", error);
      setError(error instanceof Error ? error.message : "发送消息失败");
      setStatus("error");

      // 移除可能创建的部分AI消息
      setMessages((prev) =>
        prev.filter(
          (msg) => msg.role !== "assistant" || msg.content.trim() !== "",
        ),
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full max-h-screen"
    >
      {/* 消息区域 */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                欢迎使用 AI 测试助手
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                我可以帮助您分析测试用例、提供自动化测试建议、解答UI测试相关问题。请随时向我提问！
              </p>

              <div className="max-w-4xl mx-auto">
                <h4 className="text-sm font-medium mb-4 text-left">快速开始</h4>
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "group flex gap-3 max-w-[65%]",
                message.role === "user"
                  ? "ml-auto flex-row-reverse"
                  : "mr-auto",
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {message.role === "user" ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message content */}
              <div
                className={cn(
                  "flex flex-col gap-1",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2 max-w-full break-words rounded-2xl relative",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md",
                  )}
                >
                  <div className="text-sm leading-relaxed">
                    {message.role === "assistant" ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-8 right-0">
                    <MessageActions
                      content={message.content}
                      messageId={message.id}
                      isAssistant={message.role === "assistant"}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground px-2 mt-6">
                  {formatTime(new Date(Date.now()))}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {status === "in_progress" && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-2 bg-muted rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    AI正在思考...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 shrink-0">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <div className="px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-2xl rounded-bl-md">
                <div className="text-sm text-destructive">
                  抱歉，发生了错误。请稍后再试。
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="p-2 shrink-0">
        <div
          className={cn(
            "mx-auto flex flex-col rounded-2xl border shadow-sm transition-all duration-200",
            "max-w-4xl bg-background p-3",
            status === "in_progress" && "opacity-75",
          )}
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="输入你的问题..."
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground transition-all duration-200",
                "min-h-[40px] max-h-[120px] text-left py-2",
              )}
              style={{
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
              onKeyDown={handleKeyPress}
              disabled={status === "in_progress"}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={status === "in_progress"}
              >
                <Plus className="h-4 w-4" />
              </Button>

              <AIChatSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
              />
              <div className="flex items-center">
                <Select
                  value={model}
                  onValueChange={(v) => {
                    updateEnvConfig("AI_MODEL", v);
                    setModel(v);
                  }}
                >
                  <SelectTrigger className="text-xs px-2 min-w-[150px] border-none dark:bg-background dark:hover:bg-background">
                    <div className="flex items-center gap-2">
                      <BrainCog />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ZHIPUAI_MODELS.GLM_4_FLASH}>
                      GLM-4-Flash
                    </SelectItem>
                    <SelectItem value={ZHIPUAI_MODELS.GLM_4}>GLM-4</SelectItem>
                    <SelectItem value={ZHIPUAI_MODELS.GLM_4_LONG}>
                      GLM-4-Long
                    </SelectItem>
                    <SelectItem value={ZHIPUAI_MODELS.GLM_4_AIR}>
                      GLM-4-Air
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || status === "in_progress"}
              size="icon"
              className="h-8 w-8 p-0"
            >
              {status === "in_progress" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
            Shift
          </kbd>
          +
          <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
            Enter
          </kbd>{" "}
          for newline
        </p>
      </div>
    </motion.div>
  );
}
