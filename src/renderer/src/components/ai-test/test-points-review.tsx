import {
  Trash2,
  Plus,
  ArrowRight,
  CheckCircle2,
  CheckCircle2Icon,
} from "lucide-react";
import type { TestPoint } from "./types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const handleDelete = (id: string) => {
    setTestPoints(testPoints.filter((p) => p.id !== id));
  };

  const handleAdd = () => {
    const newPoint: TestPoint = {
      id: Date.now().toString(),
      category: "功能测试",
      description: "",
    };
    setTestPoints([...testPoints, newPoint]);
  };

  const handleEdit = (id: string, newDesc: string) => {
    setTestPoints(
      testPoints.map((p) => (p.id === id ? { ...p, description: newDesc } : p)),
    );
  };

  return (
    <div className=" flex-1 flex flex-col overflow-hidden p-1.5">
      <div className="flex items-center justify-between flex-shrink-0 mb-2">
        <div>
          <h2 className="font-bold flex items-center gap-1">
            <CheckCircle2 className="text-primary h-4.5 w-4.5" />
            确认测试点
          </h2>
          <p className="text-xs text-muted-foreground mt-2 ml-1">
            AI 已分析需求，请检查以下提取的测试点并进行调整
          </p>
        </div>
        <div className="flex gap-1">
          <Button onClick={onBack} size="sm" variant="ghost">
            返回
          </Button>
          <Button onClick={onGenerate} disabled={isGenerating} size="sm">
            {isGenerating ? "生成中..." : "生成用例"}
            {!isGenerating && <ArrowRight />}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="pr-4 pb-10">
            <Alert className="mb-4 mt-3">
              <CheckCircle2Icon className="ml-1" />
              <AlertTitle>需求总结</AlertTitle>
              <AlertDescription>{summary}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testPoints.map((point) => (
                <div
                  key={point.id}
                  className="group  rounded-lg border bg-card p-3 shadow-sm hover:shadow-lg transition-all flex flex-col h-31"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge>{point.category}</Badge>
                    <button
                      onClick={() => handleDelete(point.id)}
                      className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Textarea
                    className="text-muted-foreground border-none"
                    value={point.description}
                    onChange={(e) => handleEdit(point.id, e.target.value)}
                    placeholder="输入测试点描述..."
                  />
                </div>
              ))}

              <div
                onClick={handleAdd}
                className="flex flex-col items-center justify-center h-31 rounded-lg bg-card border-1 border-dashed hover:border-primary transition-all group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors">
                  <Plus className="text-muted-foreground w-7 h-7" />
                </div>
                <span className="text-sm font-mediu">添加测试点</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
