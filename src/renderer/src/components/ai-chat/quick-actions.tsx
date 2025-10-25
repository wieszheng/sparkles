import { Button } from "@/components/ui/button";
import { Lightbulb, FileText, Bug, Zap, Target, BookOpen } from "lucide-react";

interface QuickActionsProps {
  onActionClick: (prompt: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const quickActions = [
    {
      icon: Lightbulb,
      title: "测试策略建议",
      description: "获取测试策略和方法建议",
      prompt:
        "请为我的移动应用项目推荐一套完整的自动化测试策略，包括测试类型、工具选择和实施步骤。",
    },
    {
      icon: FileText,
      title: "用例模板",
      description: "生成测试用例模板",
      prompt:
        "请帮我生成一个标准的UI自动化测试用例模板，包含前置条件、测试步骤、预期结果等要素。",
    },
    {
      icon: Bug,
      title: "问题诊断",
      description: "分析测试问题和解决方案",
      prompt:
        "我的自动化测试经常出现元素定位失败的问题，请帮我分析可能的原因和解决方案。",
    },
    {
      icon: Zap,
      title: "性能优化",
      description: "测试性能优化建议",
      prompt:
        "如何优化自动化测试的执行速度和稳定性？请提供具体的优化建议和最佳实践。",
    },
    {
      icon: Target,
      title: "测试覆盖率",
      description: "提升测试覆盖率的方法",
      prompt:
        "如何设计测试用例来提高代码覆盖率和功能覆盖率？有哪些有效的测试覆盖率分析方法？",
    },
    {
      icon: BookOpen,
      title: "学习资源",
      description: "推荐学习资料和文档",
      prompt:
        "请推荐一些优质的自动化测试学习资源，包括书籍、在线课程、技术博客等。",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {quickActions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onActionClick(action.prompt)}
          className="h-auto p-4 text-left justify-start flex-col items-start space-y-2 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 w-full">
            <action.icon className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{action.title}</span>
          </div>
          <p className="text-xs text-muted-foreground text-left">
            {action.description}
          </p>
        </Button>
      ))}
    </div>
  );
}
