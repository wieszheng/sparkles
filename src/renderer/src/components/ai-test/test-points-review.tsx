import React from "react";
import {
  Trash2,
  Plus,
  ArrowRight,
  CheckCircle2,
  CheckCircle2Icon,
} from "lucide-react";
import type { TestPoint } from "./types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

interface TestPointsReviewProps {
  summary: string;
  testPoints: TestPoint[];
  setTestPoints: (points: TestPoint[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

export const TestPointsReview: React.FC<TestPointsReviewProps> = ({
  summary,
  testPoints,
  setTestPoints,
  onGenerate,
  onBack,
  isGenerating,
}) => {
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

  const handleCategoryEdit = (id: string, newCat: string) => {
    setTestPoints(
      testPoints.map((p) => (p.id === id ? { ...p, category: newCat } : p)),
    );
  };

  return (
    <div className=" flex-1 flex flex-col overflow-hidden p-1.5">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-shrink-0 mb-2">
        <div>
          <h2 className=" font-bold flex items-center gap-1">
            <CheckCircle2 className="text-primary h-5 w-5" />
            确认测试点
          </h2>
          <p className="text-sm text-muted-foreground mt-2 ml-6">
            AI 已分析需求，请检查以下提取的测试点并进行调整
          </p>
        </div>
        <div className="flex gap-1">
          <Button onClick={onBack} size="sm" variant="ghost">
            返回修改
          </Button>
          <Button onClick={onGenerate} disabled={isGenerating} size="sm">
            {isGenerating ? "生成中..." : "生成用例"}
            {!isGenerating && <ArrowRight />}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-10">
        <Alert className="mb-4">
          <CheckCircle2Icon className="ml-1" />
          <AlertTitle>需求总结</AlertTitle>
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
        {/* Test Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testPoints.map((point) => (
            <div
              key={point.id}
              className="group  rounded-lg border bg-card p-3 shadow-sm hover:shadow-lg transition-all flex flex-col h-31"
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  className="text-sm font-bold bg-card/20 px-2 py-1 rounded border-none focus:ring-1 focus:ring-primary-foreground w-24"
                  value={point.category}
                  onChange={(e) => handleCategoryEdit(point.id, e.target.value)}
                />
                <button
                  onClick={() => handleDelete(point.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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

          {/* Add New Card */}
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
    </div>
  );
};
