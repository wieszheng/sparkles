import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  FolderOpen,
  TestTube,
  BarChart3,
  Settings,
  Zap,
  Bot,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Pickaxe,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

interface SidebarProps {
  onPageChange?: (page: string) => void;
  activePage?: string;
}

const menuItems = [
  {
    title: "仪表盘",
    icon: LayoutDashboard,
    page: "dashboard",
    badge: null,
  },

  {
    title: "项目管理",
    icon: FolderOpen,
    page: "projects",
    badge: null,
  },
  {
    title: "测试用例",
    icon: TestTube,
    page: "test-cases",
    badge: "12",
  },
  {
    title: "AI 分析",
    icon: Bot,
    page: "ai-analysis",
    badge: "NEW",
  },
  {
    title: "测试报告",
    icon: BarChart3,
    page: "reports",
    badge: null,
  },
  {
    title: "自动化",
    icon: Zap,
    page: "automation",
    badge: null,
  },
  {
    title: "屏幕镜像",
    icon: Monitor,
    page: "screen-mirror",
    badge: null,
  },
  {
    title: "工具栏",
    icon: Pickaxe,
    page: "toolbar",
    badge: null,
  },
  {
    title: "设置",
    icon: Settings,
    page: "settings",
    badge: null,
  },
];

export function Sidebar({
  onPageChange,
  activePage = "projects",
}: SidebarProps) {
  const [isHovered] = useState(false);
  const { theme, setTheme } = useTheme();
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full transition-all duration-300 ease-in-out bg-card rounded-2xl shadow-sm w-16">
        <div className="flex h-16 items-center px-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3.5 py-3">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = activePage === item.page;
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full h-9 justify-center",
                        isActive && "text-primary-foreground",
                      )}
                      onClick={() => onPageChange?.(item.page)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                    </Button>
                  </TooltipTrigger>
                  {!isHovered && (
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "w-full h-10",
                  isHovered ? "justify-start gap-3" : "justify-center",
                )}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            {!isHovered && (
              <TooltipContent side="right">
                <p>切换主题</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {isHovered && (
          <div className="p-4 border-t border-border">
            <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI 助手</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                智能分析测试结果，提供优化建议
              </p>
              <Button size="sm" className="w-full">
                开始对话
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
