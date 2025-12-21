import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  Download,
  User,
  Tag,
  FileCode,
  Eye,
  Package,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ScriptMarket() {
  const [scripts, setScripts] = useState<ScriptFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedScript, setSelectedScript] = useState<ScriptFile | null>(null);
  const [scriptContent, setScriptContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { theme } = useTheme();

  // 加载脚本模板
  useEffect(() => {
    const loadScriptTemplates = async () => {
      try {
        const templates = await window.api.listScriptTemplates();
        const mappedScripts: ScriptFile[] = templates.map((t, idx) => ({
          id: idx + 1,
          name: t.id, // 这里存放真实的 scriptTemplateId，创建任务时直接使用
          label: t.name,
          description:
            t.description ?? "脚本模板，代码存储在 FastAPI，执行时动态加载",
          content: "// 脚本代码存储在 FastAPI，执行时会动态下载到本地并执行",
          lastModified: new Date().toISOString().split("T")[0],
          category: "other",
          difficulty: "beginner",
          downloads: 0,
          rating: 5,
          author: "shwezheng",
          tags: [],
        }));
        setScripts(mappedScripts);
      } catch (error) {
        console.error("加载脚本模板失败:", error);
      }
    };
    void loadScriptTemplates();
  }, []);

  const loadScriptCode = async (templateId: string) => {
    try {
      const template = await window.api.getScriptTemplate(templateId);
      console.log("loadScriptCode", template);
      return template?.code || "";
    } catch (error) {
      console.error("加载脚本代码失败:", error);
      return "";
    }
  };

  const handleViewScript = async (script: ScriptFile) => {
    // 如果是脚本模板（ID 以 script- 开头），加载实际代码
    if (script.name.startsWith("script-")) {
      const code = await loadScriptCode(script.name);
      setScriptContent(code || script.content);
    } else {
      setScriptContent(script.content);
    }
    setSelectedScript(script);
    setShowPreview(true);
  };

  const categories = [
    { value: "all", label: "全部" },
    { value: "auth", label: "认证授权" },
    { value: "payment", label: "支付功能" },
    { value: "cart", label: "购物车" },
    { value: "search", label: "搜索功能" },
    { value: "form", label: "表单验证" },
    { value: "other", label: "其他" },
  ];

  const difficulties = [
    { value: "all", label: "全部" },
    { value: "beginner", label: "初级" },
    { value: "intermediate", label: "中级" },
    { value: "advanced", label: "高级" },
  ];

  const filteredScripts = scripts
    .filter((script) => {
      const matchesSearch =
        script.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const matchesCategory =
        selectedCategory === "all" || script.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === "all" ||
        script.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: "bg-blue-100 text-blue-700 border-blue-200",
      payment: "bg-purple-100 text-purple-700 border-purple-200",
      cart: "bg-green-100 text-green-700 border-green-200",
      search: "bg-orange-100 text-orange-700 border-orange-200",
      form: "bg-pink-100 text-pink-700 border-pink-200",
      other: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 固定搜索和筛选区域 */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索脚本名称、描述或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-85"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              共找到 {filteredScripts.length} 个脚本
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger className="w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7 p-0"
            >
              <Package className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 w-7 p-0"
            >
              <FileCode className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 脚本列表/网格 - 可滚动区域 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="py-4 mr-3.5">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-card/70 rounded-lg border border-border/30 p-4 hover:border-primary/50 transition-all hover:shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {script.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {script.description || "暂无"}
                        </p>
                      </div>
                      <Badge
                        className={`text-[10px] ${getDifficultyColor(script.difficulty)}`}
                      >
                        {script.difficulty === "beginner"
                          ? "初级"
                          : script.difficulty === "intermediate"
                            ? "中级"
                            : "高级"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] ${getCategoryColor(script.category)}`}
                      >
                        {
                          categories.find((c) => c.value === script.category)
                            ?.label
                        }
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {script.rating}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Download className="h-3 w-3" />
                        {script.downloads}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {script.author}
                      </div>
                      <div>{script.lastModified}</div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {script.tags.slice(0, 3).map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </div>
                      ))}
                      {script.tags.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{script.tags.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewScript(script)}
                        className="flex-1 h-7 text-xs gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        预览
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-card/50 rounded-lg border border-border/30 p-4 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold">
                          {script.label}
                        </h3>
                        <Badge
                          className={`text-[10px] ${getDifficultyColor(script.difficulty)}`}
                        >
                          {script.difficulty === "beginner"
                            ? "初级"
                            : script.difficulty === "intermediate"
                              ? "中级"
                              : "高级"}
                        </Badge>
                        <Badge
                          className={`text-[10px] ${getCategoryColor(script.category)}`}
                        >
                          {
                            categories.find((c) => c.value === script.category)
                              ?.label
                          }
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {script.description}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {script.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {script.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {script.downloads}
                        </div>
                        <div>{script.lastModified}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {script.tags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 bg-muted/30 rounded px-2 py-1 text-[10px]"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewScript(script)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        预览
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 脚本预览/编辑对话框 */}
      {showPreview && selectedScript && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-7xl max-h-[75vh] flex flex-col bg-card">
            <DialogHeader>
              <DialogTitle>{selectedScript.label}</DialogTitle>
              <DialogDescription>
                {selectedScript.description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <div className="rounded-lg overflow-hidden border border-border/30">
                <SyntaxHighlighter
                  language="javascript"
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.85rem",
                    background: "transparent",
                    borderRadius: "0.375rem",
                  }}
                  showLineNumbers
                  wrapLines
                  wrapLongLines
                  lineNumberStyle={{
                    minWidth: "3em",
                    paddingRight: "1em",
                    color: theme === "dark" ? "#858585" : "#858585",
                    userSelect: "none",
                  }}
                >
                  {scriptContent || "// 暂无代码"}
                </SyntaxHighlighter>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPreview(false);
                  setSelectedScript(null);
                  setScriptContent("");
                }}
              >
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
