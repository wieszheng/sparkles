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
  FlaskConical,
  Settings,
  Zap,
  Bot,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Pickaxe,
  Grid3X3,
  Video,
  Activity,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";

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
  // {
  //   title: "测试计划",
  //   icon: ClipboardList,
  //   page: "test-plans",
  //   badge: null,
  // },
  {
    title: "应用列表",
    icon: Grid3X3,
    page: "applications",
    badge: null,
  },
  {
    title: "工具栏",
    icon: Pickaxe,
    page: "toolbar",
    badge: null,
  },

  // {
  //   title: "测试报告",
  //   icon: BarChart3,
  //   page: "reports",
  //   badge: null,
  // },
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
    title: "帧分析",
    icon: Video,
    page: "video-frame-analyzer",
    badge: null,
  },
  {
    title: "应用监控",
    icon: Activity,
    page: "monitoring",
    badge: null,
  },
  {
    title: "AI Chat",
    icon: Bot,
    page: "ai",
    badge: "NEW",
  },
  {
    title: "智能生成",
    icon: FlaskConical,
    page: "ai-test",
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
                      <motion.div
                        animate={
                          isActive
                            ? {
                                rotate: [0, -10, 10, -10, 10, 0],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.8,
                          ease: "easeInOut",
                        }}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                      </motion.div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="p-3">
          <div className="relative flex flex-col items-center gap-2 bg-muted/30 rounded-lg p-1 border border-border/30">
            {/* 滑块 */}
            <motion.div
              className="absolute  h-8 w-8 bg-primary rounded-md shadow-md"
              animate={{
                y: theme === "light" ? 0 : 41,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "relative flex items-center justify-center p-2 rounded-md transition-all duration-200 z-10 w-8 h-8",
                    theme === "light"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">亮色模式</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "relative flex items-center justify-center p-2 rounded-md transition-all duration-200 z-10 w-8 h-8",
                    theme === "dark"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">深色模式</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
