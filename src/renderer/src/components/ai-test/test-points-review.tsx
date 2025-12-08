import {
  Plus,
  ArrowLeft,
  FileText,
  Layers,
  Code,
  Shield,
  Gauge,
  Globe,
  Monitor,
  Target,
  Zap,
  ChevronRight,
  ChevronDown,
  X,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { type ReactNode, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["功能", "边界", "安全", "性能", "兼容性", "异常", "UI"];

// 规范化category名称，处理AI返回不一致问题
function normalizeCategory(category: string): string {
  if (!category) return "功能";

  // 直接匹配已有分类
  if (CATEGORIES.includes(category)) {
    return category;
  }

  // 处理AI可能返回的其他格式
  const normalizedMap: Record<string, string> = {
    功能测试: "功能",
    UI测试: "UI",
    性能测试: "性能",
    安全测试: "安全",
    异常测试: "异常",
    边界测试: "边界",
    兼容性测试: "兼容性",
    function: "功能",
    ui: "UI",
    performance: "性能",
    security: "安全",
    exception: "异常",
    boundary: "边界",
    compatibility: "兼容性",
  };

  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(normalizedMap)) {
    if (key.toLowerCase() === lowerCategory) {
      return value;
    }
  }

  // 如果都没匹配到，尝试模糊匹配
  if (category.includes("功能") || lowerCategory.includes("function")) {
    return "功能";
  }
  if (
    category.includes("界面") ||
    category.includes("UI") ||
    lowerCategory.includes("ui")
  ) {
    return "UI";
  }
  if (category.includes("性能") || lowerCategory.includes("performance")) {
    return "性能";
  }
  if (category.includes("安全") || lowerCategory.includes("security")) {
    return "安全";
  }
  if (category.includes("异常") || lowerCategory.includes("exception")) {
    return "异常";
  }
  if (category.includes("边界") || lowerCategory.includes("boundary")) {
    return "边界";
  }
  if (category.includes("兼容") || lowerCategory.includes("compatibility")) {
    return "兼容性";
  }

  // 默认返回功能
  return "功能";
}

function getCategoryIcon(category: string): ReactNode {
  // 先规范化category
  const normalizedCategory = normalizeCategory(category);

  const icons: Record<string, ReactNode> = {
    功能: <Layers className="h-4 w-4" />,
    边界: <Code className="h-4 w-4" />,
    安全: <Shield className="h-4 w-4" />,
    性能: <Gauge className="h-4 w-4" />,
    兼容性: <Globe className="h-4 w-4" />,
    UI: <Monitor className="h-4 w-4" />,
  };
  return icons[normalizedCategory] || <Target className="h-4 w-4" />;
}

function getCategoryColor(category: string): {
  bg: string;
  text: string;
  border: string;
} {
  // 先规范化category
  const normalizedCategory = normalizeCategory(category);

  const colors: Record<string, { bg: string; text: string; border: string }> = {
    功能: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      border: "border-emerald-500/30",
    },
    边界: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/30",
    },
    安全: {
      bg: "bg-red-500/10",
      text: "text-red-500",
      border: "border-red-500/30",
    },
    性能: {
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      border: "border-purple-500/30",
    },
    兼容性: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-500",
      border: "border-cyan-500/30",
    },
    UI: {
      bg: "bg-pink-500/10",
      text: "text-pink-500",
      border: "border-pink-500/30",
    },
  };
  return (
    colors[normalizedCategory] || {
      bg: "bg-gray-500/10",
      text: "text-gray-500",
      border: "border-gray-500/30",
    }
  );
}

interface TestPointsReviewProps {
  summary: string;
  testPoints: TestPoint[];
  setTestPoints: (points: TestPoint[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

export function TestPointsReview({
  summary,
  testPoints,
  setTestPoints,
  onGenerate,
  onBack,
  isGenerating,
}: TestPointsReviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newPointText, setNewPointText] = useState("");
  const [newPointCategory, setNewPointCategory] = useState("功能");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const groupedPoints = useMemo(() => {
    const groups: Record<string, TestPoint[]> = {};

    // 先规范化所有测试点的category
    const normalizedPoints = testPoints.map((p) => ({
      ...p,
      category: normalizeCategory(p.category),
    }));

    // 按规范化后的category分组
    const categories = Array.from(
      new Set(normalizedPoints.map((p) => p.category)),
    );
    categories.forEach((c) => (groups[c] = []));

    normalizedPoints.forEach((p) => {
      if (groups[p.category]) {
        groups[p.category].push(p);
      } else {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
      }
    });
    return groups;
  }, [testPoints]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setTestPoints(testPoints.filter((p) => p.id !== id));
  };

  const handleAddPoint = () => {
    if (!newPointText.trim()) return;

    const newPoint: TestPoint = {
      id: `tp-${Date.now()}`,
      category: normalizeCategory(newPointCategory),
      description: newPointText.trim(),
    };

    setTestPoints([...testPoints, newPoint]);
    setNewPointText("");
    setIsAdding(false);
  };

  const cancelAdd = () => {
    setNewPointText("");
    setIsAdding(false);
  };
  const startEdit = (point: TestPoint) => {
    setEditingId(point.id);
    setEditValue(point.description);
  };
  const saveEdit = (id: string) => {
    setTestPoints(
      testPoints.map((p) =>
        p.id === id ? { ...p, description: editValue } : p,
      ),
    );
    setEditingId(null);
  };
  const updateCategory = (id: string, newCategory: string) => {
    setTestPoints(
      testPoints.map((p) =>
        p.id === id ? { ...p, category: normalizeCategory(newCategory) } : p,
      ),
    );
  };
  return (
    <div className="flex-1 flex overflow-hidden p-1.5 rounded-lg bg-muted/20">
      {/* 左侧：需求总结面板 (30%) */}
      <div className="w-[30%] border-r border-border flex flex-col">
        {/* 左侧头部 */}
        <div className="flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            返回修改
          </Button>
        </div>

        {/* 需求摘要内容 */}
        <div className="flex-1 overflow-auto py-2 px-1.5 custom-scrollbar mr-2">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">需求摘要</h3>
            </div>

            <div className="p-3 bg-card border border-border rounded-lg ml-1">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {summary || "暂无需求摘要..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：测试点工作区 (70%) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 固定顶部工具栏 */}
        <div className="flex items-center justify-between px-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">测试点清单</h2>
            <Badge variant="secondary">{testPoints.length}</Badge>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              添加测试点
            </Button>

            <Button
              onClick={onGenerate}
              size="sm"
              disabled={isGenerating || testPoints.length === 0}
            >
              <Zap className="h-4 w-4" />
              {isGenerating ? "正在生成用例..." : "生成详细用例"}
            </Button>
          </div>
        </div>

        {/* 测试点列表 - 独立滚动 */}
        <div className="flex-1 overflow-auto p-3 custom-scrollbar">
          <div className="space-y-3">
            {isAdding && (
              <div className="p-3 bg-card border  rounded-lg space-y-3">
                <div className="flex items-center gap-1">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">添加</span>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="请输入测试点描述..."
                    value={newPointText}
                    onChange={(e) => setNewPointText(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPoint();
                      if (e.key === "Escape") cancelAdd();
                    }}
                  />
                  <Select
                    value={newPointCategory}
                    onValueChange={setNewPointCategory}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={cancelAdd}>
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddPoint}
                    disabled={!newPointText.trim()}
                  >
                    确定
                  </Button>
                </div>
              </div>
            )}

            {Object.entries(groupedPoints).map(([category, points]) => {
              const colors = getCategoryColor(category);
              const isCollapsed = collapsedCategories.has(category);

              return (
                <div key={category} className="space-y-1">
                  {/* 分类标题 - 可折叠 */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center ${colors.bg}`}
                    >
                      <span className={colors.text}>
                        {getCategoryIcon(category)}
                      </span>
                    </div>
                    <span className="font-medium text-sm">{category}</span>
                    <Badge
                      variant="outline"
                      className={`ml-auto ${colors.text} ${colors.border}`}
                    >
                      {points.length}
                    </Badge>
                  </button>

                  {/* 测试点清单 */}
                  {!isCollapsed && (
                    <div className="ml-4 space-y-1">
                      {points.map((point, index) => (
                        <div
                          key={point.id}
                          className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-all border border-transparent hover:border-border"
                        >
                          {/* 拖拽手柄 */}
                          {/*<GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />*/}

                          {/* 序号 */}
                          <span className="w-5 h-4 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                            {index + 1}.
                          </span>

                          {/* 描述 - 可编辑 */}
                          {editingId === point.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(point.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => saveEdit(point.id)}
                              >
                                <Check className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                          ) : (
                            <p
                              className="flex-1 text-sm cursor-default"
                              onDoubleClick={() => saveEdit(point.id)}
                            >
                              {point.description}
                            </p>
                          )}

                          {/* 分类选择器 - 悬停显示 */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Select
                              value={point.category}
                              onValueChange={(val) =>
                                updateCategory(point.id, val)
                              }
                            >
                              <SelectTrigger className="w-28 h-4 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem
                                    key={cat}
                                    value={cat}
                                    className="text-sm"
                                  >
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 编辑按钮 */}
                          <button
                            onClick={() => startEdit(point)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-md"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>

                          {/* 删除按钮 */}
                          <button
                            onClick={() => handleRemove(point.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-md"
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
